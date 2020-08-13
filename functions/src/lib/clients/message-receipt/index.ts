import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";

import config from "../../config";
import elastic from "../../elastic";
import {
  CreateParams,
  CreateMessageReceipt,
  MessageReceipt,
  MessageReceiptStatus,
} from "../../../types";
import utils from "../../utils";

const prefix = "[message receipt client]";
const pubSubClient = new PubSub();

class MessageReceiptClient {
  /**
   * Create a message receipt
   * @param params CreateParams<CreateMessageReceipt>
   * @returns Promise<MessageReceipt>
   */
  async create(
    params: CreateParams<CreateMessageReceipt>
  ): Promise<MessageReceipt> {
    try {
      const index = `message-receipts-${utils.formatDate(new Date())}`;
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            created_at: { type: "date" },
            updated_at: { type: "date" },
          },
        },
      });

      let status: MessageReceiptStatus = MessageReceiptStatus.SENT;
      if (params.body.expo_ticket.status === "error") {
        status = MessageReceiptStatus.FAILED;
      }

      const newMessageReceipt = {
        ...params.body,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: "true",
        body: newMessageReceipt,
      });

      const created: MessageReceipt = {
        ...newMessageReceipt,
        id: `${response.body._index}|${response.body._id}`,
      };

      if (created.status === MessageReceiptStatus.FAILED) {
        const event = `message-receipt.failed`;
        const topic = `${config.get("google_pub_sub.topic_prefix")}/${event}`;
        const messageId = await pubSubClient
          .topic(topic)
          .publish(Buffer.from(JSON.stringify(created)), {
            id: created.id,
            time: new Date().toISOString(),
            source: "beast-functions",
          });
        functions.logger.info(
          `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`
        );
      }

      return utils.mapObject(created, params.source);
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error creating a message receipt`);
    }
  }
}

export default new MessageReceiptClient();
