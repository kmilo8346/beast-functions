import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";

import config from "../../../../lib/config";
import orderClient from "../../../../lib/clients/order";
import { Payment, DispatchProvider } from "../../../../types";

const prefix = "[owner dispatch provider client]";
const pubSubClient = new PubSub();

class ProviderClient {
  /**
   *
   * @param payment
   */
  async createOrder(payment: Payment): Promise<void> {
    try {
      // precondition
      if (
        payment.transaction.store.dispatch_provider !== DispatchProvider.OWNER
      ) {
        functions.logger.info(
          `${prefix} The dispatch provider must be owner, skipping logic`
        );
        return;
      }

      // skip if order is already created
      const searchResponse = await orderClient.search({
        filters: { reference: payment.reference },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        const order = searchResponse.hits[0];
        functions.logger.info(
          `${prefix} Order with reference ${payment.reference} is already created, id: ${order.id}, status: ${order.status}`
        );
        return;
      }

      // create new order
      const order = await orderClient.create({
        body: {
          reference: payment.reference,
          customer: payment.customer,
          transaction: payment.transaction,
        },
      });

      // emit order created
      const event = `order.created`;
      const topic = `${config.get("google_pub_sub.topic_prefix")}/${event}`;
      const messageId = await pubSubClient
        .topic(topic)
        .publish(Buffer.from(JSON.stringify(order)), {
          id: order.id,
          time: new Date().toISOString(),
          source: "beast-functions",
        });
      functions.logger.info(
        `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`
      );
    } catch (error) {
      functions.logger.debug({ payment });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error creating order`);
    }
  }
}

export default new ProviderClient();
