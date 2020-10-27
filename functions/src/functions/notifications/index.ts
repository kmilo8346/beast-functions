import * as functions from "firebase-functions";

// types
import { Order } from "../../types";
// lib
import config from '../../lib/config';
import pusher from '../../lib/pusher';
import notificationClient from "../../lib/clients/notification";

const prefix = "[notifications]";


const onOrderCreatedSendPushNotification = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;
    functions.logger.info(
      `${prefix} Sending order created notification to seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
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

  const onOrderCreatedSendEvent = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;
    functions.logger.info(
      `${prefix} Sending order created event to seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    pusher.trigger(`seller_${order.transaction.shopping_cart.store.user}`, 'order.created', order);
    functions.logger.info(
      `${prefix} Order created event was sended`
    );
  }); 

export default {
  onOrderCreatedSendPushNotification,
  onOrderCreatedSendEvent
};
