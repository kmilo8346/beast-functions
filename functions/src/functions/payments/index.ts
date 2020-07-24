import * as functions from 'firebase-functions';
import { PubSub } from '@google-cloud/pubsub';

import paymentClient from './clients/payment-client';
import mercadopago from '../../lib/mercadopago';

const pubSubClient = new PubSub();

exports.execute = functions.pubsub.topic('payments.pending').onPublish(async (message) => {
    const prefix = '[payments execute]';
    try {
        const eventUniqueId = message.attributes.id;
        const data = message.json;
        const paymentIndex = data.index;

        functions.logger.info(`${prefix} payments.pending received, id: ${eventUniqueId}`);

        functions.logger.info(`${prefix} Checking for an already executed payment`);
        const payment = await paymentClient.get(eventUniqueId, paymentIndex);
        functions.logger.debug()
        if (payment.status !== 'pending') {
            functions.logger.info(`${prefix} Payment is already executed, returning function, payment id: ${payment.id}`);
            return;
        }
        
        functions.logger.info(`${prefix} Executing payment in mercado pago`);
        const executePaymentResponse = await paymentClient.executePayment(eventUniqueId, data);
        functions.logger.info(`${prefix} Payment execution was ok, id; ${executePaymentResponse.id}`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error in executing payment function`);
        
        throw error;
      }
});

exports.update = functions.pubsub.topic('mercadopago-payments.updated').onPublish(async (message) => {
    const prefix = '[payments update]';
    try {
        const eventUniqueId = message.attributes.id;

        functions.logger.info(`${prefix} mercadopago-payments.updated received, id: ${eventUniqueId}`);

        // busco payment en mercado pago
        functions.logger.info(`${prefix} Getting payment in mercado pago, payment id: ${eventUniqueId}`);
        const response = await  mercadopago.payment.get(eventUniqueId);
        functions.logger.info(`${prefix} Getting payment was ok`);
        const gatewayData = response.body;

        // busco payment en beast usando el unique id
        functions.logger.info(`${prefix} Getting payment in beast`);
        const [id, index] = gatewayData.external_reference.split('|');
        const payment = await paymentClient.get(id, index);
        functions.logger.info(`${prefix} Getting payment in beast was ok, payment id: ${payment.id}`);
        
        functions.logger.info(`${prefix} Executing validation rules`);
        if (payment.status === 'rejected' || payment.status === 'approved') {
            functions.logger.warn(`${prefix} Payment in db has a final status, status: ${payment.status}`);
            return;
        }
        if (payment.status === 'pending' &&
            ["in_process", "rejected", "approved"].indexOf(gatewayData.status) === -1) {
            functions.logger.warn(`${prefix} Mercado pago payment status is invalid, mercado pago payment status: ${gatewayData.status}, payment status: ${payment.status}`);
            return;
        }
        if (payment.status === 'in_process' &&
            ["rejected", "approved"].indexOf(gatewayData.status) === -1) {
            functions.logger.warn(`${prefix} Mercado pago payment status is invalid, mercado pago payment status: ${gatewayData.status}, payment status: ${payment.status}`);
            return;
        }
        functions.logger.info(`${prefix} Executing validation was ok :)`);
        
        functions.logger.info(`${prefix} Updating payment`);
        const updatedPayment = {
            ...payment,
            status: gatewayData.status,
            gateway_details: gatewayData,
            updated_at: new Date(),
        }
        await paymentClient.update(payment.index, payment.id, updatedPayment);
        functions.logger.info(`${prefix} Updating payment was ok :)`);

        const event = `payments.${gatewayData.status}`;
        const topic = `${functions.config().google_pub_sub.topic_prefix}${event}`
        functions.logger.info(`${prefix} Emitting ${event}`);
        let messageId = await pubSubClient
            .topic(topic)
            .publish(Buffer.from(JSON.stringify(updatedPayment)), {
                id: updatedPayment.id,
                time: new Date(updatedPayment.created_at).toISOString(),
                source: 'beast-functions',
            });
        functions.logger.info(`${prefix} Event ${event} was emitted correctly, message id: ${messageId}`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error in updating payment function`);
        
        throw error;
      }
});