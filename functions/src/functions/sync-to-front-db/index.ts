import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import camelCaseKeys from 'camelcase-keys';

admin.initializeApp();

/**
 * Convert to camel case and remove unecesary fields to avoid overload front
 * @param order 
 */
const transformOrder = (order: any) => {
  return camelCaseKeys(order, { deep: true })
}

/**
 * Sync logic
 * @param message 
 */
const syncOrderChanges = async (message: any) => {
  const prefix = '[sync to front db order change]';
  try {
      const id = message.attributes.id;
      const order = message.json;

      functions.logger.info(`${prefix} order.${order.status} received, id: ${id}`);

      functions.logger.info(`${prefix} Synchronizing to front db`);
      await admin.firestore().collection('orders').doc(id).set(transformOrder(order));
      functions.logger.info(`${prefix} Synchronizing was ok :)`);
    } catch (error) {
      functions.logger.debug(message.attributes);
      functions.logger.error(error);
      functions.logger.error(`${prefix} Unexpected error synchronizing order change to front db`);
      
      throw error;
    }
}

exports.orderPaymentPending = functions.pubsub.topic('order.payment_pending').onPublish(async (message) => {
    await syncOrderChanges(message)
});

exports.orderPaymentInProcess = functions.pubsub.topic('order.payment_in_process').onPublish(async (message) => {
  await syncOrderChanges(message)
});

exports.orderPaymentRejected = functions.pubsub.topic('order.payment_rejected').onPublish(async (message) => {
  await syncOrderChanges(message)
});

exports.orderConfirmationPending = functions.pubsub.topic('order.confirmation_pending').onPublish(async (message) => {
  await syncOrderChanges(message)
});

exports.orderInDelivery = functions.pubsub.topic('order.in_delivery').onPublish(async (message) => {
  await syncOrderChanges(message)
});

exports.orderDelivered = functions.pubsub.topic('order.delivered').onPublish(async (message) => {
  await syncOrderChanges(message)
});