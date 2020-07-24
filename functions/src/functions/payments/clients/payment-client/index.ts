import * as functions from "firebase-functions";

import elastic from "../../../../lib/elastic";
import mercadopago from '../../../../lib/mercadopago';
import utils from '../../../../lib/utils';

const prefix = "[payment client]";

class PaymentClient {
  /**
   * Get a payment
   * @param id
   * @param index
   * @returns Promise<Payment|null>
   */
  public async get(id: string, index: string,) {
    try {
      const response = await elastic.get({
        id,
        index,
      });
      
      return {
        ...response.body._source,
        id: response.body._id,
        index: response.body._index,
      };
    } catch (error) {
      functions.logger.debug({ index, id });
      functions.logger.error(error);
      throw new Error(`${prefix} Unexpected error getting payment`);
    }
  }

  /**
   * Execute payment in payment gateway
   * @param id 
   * @param data 
   * @returns Promise<GatewayData>
   */
  public async executePayment(id: string, data: any) {
    let createCardTokenResponse: any;
    try {
      createCardTokenResponse = await mercadopago.card_token.create(
        {
          security_code: data.transaction.payment_info.security_code,
          card_id: data.transaction.payment_info.card.id,
        },
      );
    } catch (error) {
      functions.logger.debug({id, data});
      functions.logger.error(error);
      throw new Error(`${prefix} Unexpected error creating card token`);
    }

    let createPaymentResponse: any;
    const stats = utils.getStats(data.transaction.shopping_cart);
    // TODO: improve mercado pago sended data
    const payment = {
      transaction_amount: stats.ammount,
      token: createCardTokenResponse.response.id,
      description: `${stats.total} producto(s)`,
      installments: data.transaction.payment_info.installments,
      payment_method_id:
        data.transaction.payment_info.card.payment_method.id,
      issuer_id: `${data.transaction.payment_info.card.issuer.id}`,
      payer: {
        type: "customer",
        id: data.customer.mercado_pago_customer_id,
        email: data.customer.email,
        identification: {
          type:
            data.transaction.payment_info.card.cardholder.identification
              .type,
          number:
            data.transaction.payment_info.card.cardholder.identification
              .number,
        },
        first_name: data.customer.first_name,
        last_name: data.customer.last_name,
      },
      external_reference: `${id}|${data.index}`,
      notification_url: `${functions.config().mercado_pago.notification_url}?source_news=webhooks`
    }
    try {
      // setting seller credentials to execute the payment
      mercadopago.configure({
        access_token: data.transaction.store.seller_credentials.access_token,
      });

      createPaymentResponse = await mercadopago.payment.create(payment);
      return createPaymentResponse.body;
    } catch (error) {
      functions.logger.debug({id, data});
      functions.logger.error(error);

      try {
        functions.logger.info(`${prefix} Retrying payment in mercado pago using idempotency id`);
        createPaymentResponse = await mercadopago.payment.create(payment,  {
          qs: {
            idempotency: error.idempotency,
          },
        });
        return createPaymentResponse.body;
      } catch (error) {
        functions.logger.debug({id, data});
        functions.logger.error(error);

        throw new Error(`${prefix} Unexpected error executing payment`);
      }
    } finally {
      mercadopago.configure({
        access_token: functions.config().mercado_pago.access_token,
      });
    }
  }

  /**
   * 
   * @param index 
   * @param paymentId 
   * @param data 
   */
  public async createPending(index: string, paymentId: string, data: any) {
    try {
      const payment = {
        status: 'pending',
        payment_id: paymentId,
        order_id: data.order_id,
        shop_intent_id: data.id,
        customer: data.customer,
        transaction: data.transaction,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: "true",
        body: payment,
      });
      return {
        ...payment,
        id: response.body._id,
      };
    } catch (error) {
      functions.logger.debug({ index, paymentId, data,});
      functions.logger.error(error);
      throw new Error(`${prefix} Unexpected error creating pending payment`);
    }
  }

  public async update(index: string, id: string, data: any) {
    try {
      await elastic.update({
        index,
        id,
        body: {
          doc: data,
        },
      });
    } catch (error) {
      functions.logger.debug({ index, id, data,});
      functions.logger.error(error);
      throw new Error(`${prefix} Unexpected error updating payment`);
    }
  }
}

export default new PaymentClient();
