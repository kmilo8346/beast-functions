import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

admin.initializeApp();

exports.paymentInProcess = functions.pubsub.topic('payments.in_process').onPublish(async (message) => {
    const prefix = '[sync to front db payment in_process]';
    try {
        const eventUniqueId = message.attributes.id;
        const data = message.json;

        functions.logger.info(`${prefix} payments.in_process received, id: ${eventUniqueId}`);

        functions.logger.info(`${prefix} Synchronizing to front db`);
        await admin.firestore().collection('payments').doc(eventUniqueId).set({
            shopId: data.shop_id,
            status: data.status,
            statusDetail: data.gateway_details.status_detail
        });
        functions.logger.info(`${prefix} Synchronizing was ok :)`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error synchronizing payments in_process to front db`);
        
        throw error;
      }
});

exports.paymentApproved = functions.pubsub.topic('payments.approved').onPublish(async (message) => {
    const prefix = '[sync to front db payment approved]';
    try {
        const eventUniqueId = message.attributes.id;
        const data = message.json;

        functions.logger.info(`${prefix} payments.pending received, id: ${eventUniqueId}`);

        functions.logger.info(`${prefix} Synchronizing to front db`);
        await admin.firestore().collection('payments').doc(eventUniqueId).set({
            shopId: data.shop_id,
            status: data.status,
            statusDetail: data.gateway_details.status_detail
        });
        functions.logger.info(`${prefix} Synchronizing was ok :)`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error synchronizing payments pending to front db`);
        
        throw error;
      }
});

exports.paymentRejected = functions.pubsub.topic('payments.rejected').onPublish(async (message) => {
    const prefix = '[sync to front db payment rejected]';
    try {
        const eventUniqueId = message.attributes.id;
        const data = message.json;

        functions.logger.info(`${prefix} payments.rejected received, id: ${eventUniqueId}`);

        functions.logger.info(`${prefix} Synchronizing to front db`);
        await admin.firestore().collection('payments').doc(eventUniqueId).set({
            shopId: data.shop_id,
            status: data.status,
            statusDetail: data.gateway_details.status_detail
        });
        functions.logger.info(`${prefix} Synchronizing was ok :)`);
      } catch (error) {
        functions.logger.debug(message.attributes);
        functions.logger.error(error);
        functions.logger.error(`${prefix} Unexpected error synchronizing payments rejected to front db`);
        
        throw error;
      }
});