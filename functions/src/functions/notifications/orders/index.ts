import * as functions from "firebase-functions";

import notificationClient from '../../../lib/clients/notification';
import { Order } from "../../../types";

const prefix = '[order notifications]'

const orderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;  

    functions.logger.info(`${prefix} Sending order confirmed notification, order id: ${order.id}, user id: ${order.customer.id}`)
    const response = await notificationClient.create({body: {
        filters: {
            user: order.customer.id,
        },
        message: {
            title: 'Tu pedido va en camino ♥‿♥'
        }
    }, source: ['id']})
    functions.logger.info(`${prefix} Order confirmed notification, was sended, notification id: ${response.id}`)
  });

const orderDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;  

    functions.logger.info(`${prefix} Sending delivered notification, order id: ${order.id}, user id: ${order.customer.id}`)
    const response = await notificationClient.create({body: {
        filters: {
            user: order.customer.id,
        },
        message: {
            title: 'Pedido entregado',
            body: 'Gracias por comprar con Shop Shop \ (•◡•) /'
        }
    }, source: ['id']})
    functions.logger.info(`${prefix} Order delivered notification, was sended, notification id: ${response.id}`)
  });


export default {
  orderConfirmed,
  orderDelivered,
};
