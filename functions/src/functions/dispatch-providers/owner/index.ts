import * as functions from 'firebase-functions';

import providerClient from "./clients/provider-client";

const onPaymentApproved = functions.pubsub.topic('payment.approved').onPublish(async (message) => {
   await providerClient.createOrder(message.json);
});

export default {
    onPaymentApproved
}