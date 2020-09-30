import * as functions from "firebase-functions";

import {
  Order,
  DispatchProvider,
} from "../../../types";
import notificationClient from "../../../lib/clients/notification";
import providerClient from "./clients/provider-client";

const prefix = "[dispatch provider owner]";

/**
 * On payment approved create order
 * with state delivered
 */
const onPaymentApproved = functions.pubsub
  .topic("payment.approved")
  .onPublish(async (message) => {
    const payment = message.json;
    await providerClient.createOrder(payment);
  });



/**
 * On order delivered send notification
 */
const onOrderDeliveredSendNotification = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;
    if (
      order.dispatch_provider_id !== DispatchProvider.OWNER_RRSS
    ) {
      return;
    }

    functions.logger.info(
      `${prefix} Sending delivered notification to the owner, order id: ${order.id}, owner id: ${order.transaction.store.user}`
    );
    const response = await notificationClient.create({
      body: {
        filters: {
          user: order.transaction.store.user,
        },
        message: {
          title: "¡Venta en redes sociales!",
          body: "Tuvistes una nueva venta, vamos por más 🤩",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order delivered notification, was sended, notification id: ${response.id}`
    );
  });

export default {
  onPaymentApproved,
  onOrderDeliveredSendNotification,
};


