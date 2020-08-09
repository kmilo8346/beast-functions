import * as functions from 'firebase-functions';
import { PubSub } from '@google-cloud/pubsub';

import config from '../../lib/config';
import orderClient from './clients/order-client';
import gatewayPaymentClient from './clients/gateway-payment-client';

const pubSubClient = new PubSub();

exports.executePayment = functions.pubsub.topic('order.payment_pending').onPublish(async (message) => {
    const prefix = '[orders execute payment]';
    try {
        const id = message.attributes.id;
        const order = message.json;
        const index = order.index;

        functions.logger.info(`${prefix} order.payment_pending received, order id: ${id}`);

        functions.logger.info(`${prefix} Checking for an order with an already executed payment`);
        const orderFromDB = await orderClient.get(id, index);
        if (orderFromDB.status !== 'payment_pending') {
            functions.logger.info(`${prefix} Order has an already executed payment, returning function, order id: ${orderFromDB.id}`);
            return;
        }
        
        functions.logger.info(`${prefix} Executing payment`);
        const executePaymentResponse = await gatewayPaymentClient.executePayment(id, order);
        functions.logger.info(`${prefix} Payment execution was ok, payment id; ${executePaymentResponse.id}`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error in executing payment function`);
        
        throw error;
      }
});

exports.updateGatewayDetails = functions.pubsub.topic('payment.updated').onPublish(async (message) => {
    const prefix = '[orders update gateway details]';
    try {
        const paymentId = message.attributes.id;

        functions.logger.info(`${prefix} payments.updated received, id: ${paymentId}`);

        functions.logger.info(`${prefix} Getting payment, payment id: ${paymentId}`);
        const gatewayData = await  gatewayPaymentClient.getPayment(paymentId);
        functions.logger.info(`${prefix} Getting payment was ok`);

        functions.logger.info(`${prefix} Getting order`);
        const [id, index] = gatewayData.external_reference.split('|');
        const order = await orderClient.get(id, index);
        functions.logger.info(`${prefix} Getting order was ok, order id: ${order.id}`);
        
        functions.logger.info(`${prefix} Executing rules to avoid invalid update`);
        if (gatewayData.status === 'in_process' && order.status !== 'payment_pending') {
            functions.logger.warn(`${prefix} Invalid status, payment status: ${gatewayData.status}, order status: ${order.status}`);
            return;
        }
        if (gatewayData.status === 'rejected' && order.status !== 'payment_pending' && order.status !== 'payment_in_process') {
            functions.logger.warn(`${prefix} Invalid status, payment status: ${gatewayData.status}, order status: ${order.status}`);
            return;
        }
        if (gatewayData.status === 'approved' && order.status !== 'payment_pending' && order.status !== 'payment_in_process') {
            functions.logger.warn(`${prefix} Invalid status, payment status: ${gatewayData.status}, order status: ${order.status}`);
            return;
        }
        functions.logger.info(`${prefix} Rules execution was ok :)`);
        
        functions.logger.info(`${prefix} Updating gateway details`);
        let status = '';
        switch (gatewayData.status) {
            case 'in_process':
                status = 'payment_in_process';
                break;
            case 'rejected':
                status = 'payment_rejected';
                break;
            case 'approved':
                status = 'confirmation_pending';
                break;
            default:
                throw new Error(`${prefix} Invalid payment status ${gatewayData.status}`)
                break;
        }
        const updatedOrder = {
            ...order,
            status,
            gateway_details: gatewayData,
            updated_at: new Date(),
        }
        await orderClient.update(order.id, order.index, updatedOrder);
        functions.logger.info(`${prefix} Gateway details was updated :)`);

        const event = `order.${status}`;
        const topic = `${config.get('google_pub_sub.topic_prefix')}/${event}`
        functions.logger.info(`${prefix} Emitting ${event}`);
        const messageId = await pubSubClient
            .topic(topic)
            .publish(Buffer.from(JSON.stringify(updatedOrder)), {
                id: updatedOrder.id,
                time: new Date(updatedOrder.updated_at).toISOString(),
                source: 'beast-functions',
            });
        functions.logger.info(`${prefix} Event ${event} was emitted correctly, message id: ${messageId}`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error in updating gateway details function`);
        
        throw error;
      }
});