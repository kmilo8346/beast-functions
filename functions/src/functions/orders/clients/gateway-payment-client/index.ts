import * as functions from "firebase-functions";

import mercadopago from '../../../../lib/mercadopago';
import utils from '../../../../lib/utils';

const prefix = "[gateway payment client]";

class GatewayPaymentClient {
  /**
   * Execute payment
   * @param externalReference 
   * @param data 
   * @returns Promise<GatewayData>
   */
  public async executePayment(externalReference: string, data: any) {
    let createCardTokenResponse: any;
    try {
      createCardTokenResponse = await mercadopago.card_token.create(
        {
          security_code: data.transaction.payment_info.security_code,
          card_id: data.transaction.payment_info.card.id,
        },
      );
    } catch (error) {
      functions.logger.debug({externalReference, data});
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
      external_reference: `${externalReference}|${data.index}`,
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
      functions.logger.debug({externalReference, data});
      functions.logger.error(error);

      try {
        functions.logger.info(`${prefix} Retrying payment using idempotency id`);
        createPaymentResponse = await mercadopago.payment.create(payment,  {
          qs: {
            idempotency: error.idempotency,
          },
        });
        return createPaymentResponse.body;
      } catch (error) {
        functions.logger.debug({externalReference, data});
        functions.logger.error(error);

        throw new Error(`${prefix} Unexpected error executing payment`);
      }
    } finally {
      mercadopago.configure({
        access_token: functions.config().mercado_pago.access_token,
      });
    }
  }

  public async getPayment(id: string) {
    try {
      const response = await mercadopago.payment.get(id);
      return response.body;
    } catch (error) {
      functions.logger.debug({id});
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error getting payment`);
    }
  }

}

export default new GatewayPaymentClient();
