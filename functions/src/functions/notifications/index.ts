import * as functions from "firebase-functions";

import config from '../../lib/config'
import { Order } from "../../types";
import notificationClient from "../../lib/clients/notification";

const prefix = "[notifications]";

const onOrderCreatedSendPush = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;
    functions.logger.info(
      `${prefix} Sending order created notification to the seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    const idempotency = config.get('environment') === 'development' ? `${new Date().getTime()}`: message.attributes.id;
    const response = await notificationClient.create({
      body: {
        idempotency, 
        filters: {
          user: order.transaction.shopping_cart.store.user,
        },
        message: {
          title: "¡Nueva orden!",
          body: "Tu cliente te espera 😅",
          data: {
            order: order.id
          }
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order created notification, was sended, notification id: ${response.id}`
    );
  });

export default {
  onOrderCreatedSendPush,
};
