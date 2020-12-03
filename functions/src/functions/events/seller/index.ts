import * as functions from "firebase-functions";

// types
import { Order } from "../../../types";
// lib
import pusher from "../../../lib/pusher";

const prefix = "[seller events]";

const onOrderCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json; 
    
    functions.logger.info(
      `${prefix} Sending order created event to seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    await pusher.trigger(
      `seller_${order.transaction.shopping_cart.store.user}`,
      "order.created",
      order
    );
    functions.logger.info(`${prefix} Seller order created event was sent`);
  });

const onOrderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json; 
    
    functions.logger.info(
      `${prefix} Sending order confirmed event to seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    await pusher.trigger(
      `seller_${order.transaction.shopping_cart.store.user}`,
      "order.confirmed",
      order
    );
    functions.logger.info(`${prefix} Seller order confirmed event was sent`);
  });

const onOrderDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;
   
    functions.logger.info(
      `${prefix} Sending order delivered event to seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    await pusher.trigger(
      `seller_${order.transaction.shopping_cart.store.user}`,
      "order.delivered",
      order
    );
    functions.logger.info(`${prefix} Seller order delivered event was sent`);
  });

const onOrderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;
    
    functions.logger.info(
      `${prefix} Sending order cancelled event to seller, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    await pusher.trigger(
      `seller_${order.transaction.shopping_cart.store.user}`,
      "order.cancelled",
      order
    );
    functions.logger.info(`${prefix} Seller order cancelled event was sent`);
  });  


export default {
  onOrderCreated,
  onOrderConfirmed,
  onOrderDelivered,
  onOrderCancelled
};
