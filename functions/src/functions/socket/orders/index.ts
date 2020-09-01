import * as functions from "firebase-functions";

import { Order } from "../../../types";
import socket from '../../../lib/socket.io'

const prefix = '[order notifications]'

const mapOrder = (order: Order): Partial<Order> => {
  return order;
}

const onCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json; 
    const mapped = mapOrder(order); 

    functions.logger.info(`${prefix} Sending order created to socket server, order: ${order.id}`)
    socket.emit('order.created', mapped);
    functions.logger.info(`${prefix} Order created, was sended`)
  });

const onConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;
    const mapped = mapOrder(order);  

    functions.logger.info(`${prefix} Sending order confirmed to socket server, order: ${order.id}`)
    socket.emit('order.confirmed', mapped);
    functions.logger.info(`${prefix} Order confirmed, was sended`)
  });

const onDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;
    const mapped = mapOrder(order);   

    functions.logger.info(`${prefix} Sending order delivered to socket server, order: ${order.id}`)
    socket.emit('order.delivered', mapped);
    functions.logger.info(`${prefix} Order delivered, was sended`)
  });

  const onCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;
    const mapped = mapOrder(order);   

    functions.logger.info(`${prefix} Sending order cancelled to socket server, order: ${order.id}`)
    socket.emit('order.cancelled', mapped);
    functions.logger.info(`${prefix} Order cancelled, was sended`)
  });


export default {
  onCreated,
  onConfirmed,
  onDelivered,
  onCancelled
};
