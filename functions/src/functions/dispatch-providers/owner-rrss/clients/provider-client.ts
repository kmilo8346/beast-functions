import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";

import config from "../../../../lib/config";
import orderClient from "../../../../lib/clients/order";
import { Payment, OrderStatus, DispatchProvider, OwnerRRSSDispatchStatus  } from "../../../../types";

const prefix = "[owner rrss dispatch provider client]";
const pubSubClient = new PubSub();

class ProviderClient {
  /**
   *
   * @param payment
   */
  async createOrder(payment: Payment): Promise<void> {
    try {
      if (
        payment.dispatch_provider_id !== DispatchProvider.OWNER_RRSS
      ) {
        return;
      }
      // skip if order is already created
      const searchResponse = await orderClient.search({
        filters: { reference: payment.reference },
        from: 0,
        size: 1,
      });
      if (searchResponse.hits.length) {
        const createdOrder = searchResponse.hits[0];
        functions.logger.info(
          `${prefix} Order with reference ${payment.reference} is already created, id: ${createdOrder.id}, status: ${createdOrder.status}`
        );
        return;
      }

      // create new order
      const order = await orderClient.create({
        body: {
          status: OrderStatus.DELIVERED,
          reference: payment.reference,
          transaction: payment.transaction,
          payment_provider_id: payment.payment_provider_id,
          dispatch_provider_id: payment.dispatch_provider_id,
          payment_provider: payment.provider,
          dispatch_provider: {
            id: DispatchProvider.OWNER_RRSS,
            status: OwnerRRSSDispatchStatus.DELIVERED,
          },
        },
      });

      // emit order delivered
      const event = `order.delivered`;
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
