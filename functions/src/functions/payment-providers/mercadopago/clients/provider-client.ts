import * as functions from "firebase-functions";
import { PubSub } from "@google-cloud/pubsub";

import config from "../../../../lib/config";
import mercadopago from "../../../../lib/mercadopago";
import paymentClient from "../../../../lib/clients/payment";
import { Payment } from "../../../../types";

const prefix = "[mercado pago payment provider client]";
const pubSubClient = new PubSub();

class ProviderClient {
  /**
   * Update a beast payment using the
   * payment data from mercado pago webhook
   * @param data
   */
  async updatePayment(payload: any) {
    try {
      // get payment from mercado pago
      const response = await mercadopago.payment.get(payload.data.id);
      const mpPayment = response.body;

      // find beast payment using external reference
      const result = await paymentClient.search({
        filters: { reference: mpPayment.external_reference },
        from: 0,
        size: 1,
      });
      if (!result.hits.length) {
        functions.logger.warn(
          `${prefix} Not payment found using external reference from mercadopago, reference: ${response.body.external_reference}`
        );
        return;
      }
      const payment = result.hits[0];

      // update beast payment
      const update: Partial<Payment> = {
        provider: {
          ...payment.provider,
          status: mpPayment.status,
          data: {
            id: mpPayment.id,
            status: mpPayment.status,
            status_detail: mpPayment.status_detail,
          },
        },
      };
      // update beast payment status for mapped status
      if (
        mpPayment.status === "approved" ||
        mpPayment.status === "rejected" ||
        mpPayment.status === "cancelled"
      ) {
        update.status = mpPayment.status;
      }
      await paymentClient.update(payment.id, { body: update });
      functions.logger.info(
        `${prefix} Payment was updated, payment id: ${payment.id}`
      );

      // emit payment approved if that's the case
      if (mpPayment.status === "approved") {
        const updatedPayment = {
          ...payment,
          ...update,
        };
        const event = `payment.approved`;
        const topic = `${config.get("google_pub_sub.topic_prefix")}/${event}`;
        const messageId = await pubSubClient
          .topic(topic)
          .publish(Buffer.from(JSON.stringify(updatedPayment)), {
            id: updatedPayment.id,
            time: new Date().toISOString(),
            source: "beast-functions",
          });
        functions.logger.info(
          `${prefix} Event ${event} was emitted correctly, message id: ${messageId}`
        );
      }
    } catch (error) {
      functions.logger.debug({ payload });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error updating payment`);
    }
  }
}

export default new ProviderClient();
