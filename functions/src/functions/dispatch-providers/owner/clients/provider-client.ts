import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";

import config from "../../../../lib/config";
import mercadopago from '../../../../lib/mercadopago'
import orderClient from "../../../../lib/clients/order";
import { Payment,  Order, ProductConfirmationType,  } from "../../../../types";

const prefix = "[owner dispatch provider client]";
const pubSubClient = new PubSub();

class ProviderClient {
  /**
   *
   * @param payment
   */
  async createOrder(payment: Payment): Promise<void> {
    try {
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
          reference: payment.reference,
          customer: payment.customer,
          transaction: payment.transaction,
          payment_provider: payment.provider
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

  async refundPartial(order: Order): Promise<void> {
    try {
      const desiredAmount = order.transaction.shopping_cart.reduce((amount, item) => amount + (item.qty*item.price), 0);
      const posibleAmount = (order.dispatch_provider.confirmation?.product_confirmations || []).reduce((amount, pc) => {
        if (pc.type === ProductConfirmationType.UPDATE) {
          const item = order.transaction.shopping_cart.find(i => i.id === pc.id);
          if (item) {
            return amount + (pc.qty_posible*item.price)
          }
        }
        return amount;
      }, 0);
      mercadopago.configure({
        access_token: order.transaction.store.seller_credentials.access_token,
      });
      await mercadopago.payment.refundPartial({
        payment_id: order.payment_provider.data.id,
        amount: desiredAmount - posibleAmount
      })
    } catch (error) {
      functions.logger.debug({ order });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error executing a partial refund`);
    } finally {
      mercadopago.configure({
        access_token: config.get('mercado_pago.access_token'),
      });
    }
  }

  async refund(order: Order): Promise<void> {
    try {
      mercadopago.configure({
        access_token: order.transaction.store.seller_credentials.access_token,
      });
      await mercadopago.payment.refund(order.payment_provider.data.id)
    } catch (error) {
      functions.logger.debug({ order });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error executing a refund`);
    } finally {
      mercadopago.configure({
        access_token: config.get('mercado_pago.access_token'),
      });
    }
  }
}

export default new ProviderClient();
