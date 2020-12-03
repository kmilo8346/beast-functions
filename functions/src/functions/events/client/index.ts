import * as functions from "firebase-functions";

// types
import { Order } from "../../../types";
// lib
import pusher from "../../../lib/pusher";

const prefix = "[client events]";

const onOrderCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;
  
    functions.logger.info(
      `${prefix} Sending order created event to client, order id: ${order.id}, client id: ${order.customer.id}`
    );
    await pusher.trigger(`client_${order.customer.id}`, "order.created", order);
    functions.logger.info(`${prefix} Client order created event was sent`);
  });

const onOrderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;
    
    functions.logger.info(
      `${prefix} Sending order confirmed event to client, order id: ${order.id}, client id: ${order.customer.id}`
    );
    await pusher.trigger(`client_${order.customer.id}`, "order.confirmed", order);
    functions.logger.info(`${prefix} Client order confirmed event was sent`);
  });

const onOrderDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;
    
    functions.logger.info(
      `${prefix} Sending order delivered event to client, order id: ${order.id}, client id: ${order.customer.id}`
    );
    await pusher.trigger(`client_${order.customer.id}`, "order.delivered", order);
    functions.logger.info(`${prefix} Client order delivered event was sent`);
  });

const onOrderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;
    
    functions.logger.info(
      `${prefix} Sending order cancelled event to client, order id: ${order.id}, client id: ${order.customer.id}`
    );
    await pusher.trigger(`client_${order.customer.id}`, "order.cancelled", order);
    functions.logger.info(`${prefix} Client order cancelled event was sent`);
  });  


export default {
  onOrderCreated,
  onOrderConfirmed,
  onOrderDelivered,
  onOrderCancelled
};
