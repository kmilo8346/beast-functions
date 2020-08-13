import * as functions from "firebase-functions";

import notificationClient from '../../../lib/clients/notification';
import { Order } from "../../../types";

const prefix = '[order notifications]'

const onCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;  

    functions.logger.info(`${prefix} Sending order created notification to the seller, order id: ${order.id}, user id: ${order.transaction.store.user}`)
    const response = await notificationClient.create({body: {
        filters: {
            user: order.transaction.store.user,
        },
        message: {
            title: '¡Nueva venta!',
            body: 'No hagas esperar al cliente ◑.◑',
            data: {
              navigate: {
                name: 'MainTab',
                params: {
                  screen: "SellerStack",
                  params: {
                    screen: 'MySales',
                    params: {
                      view: 'IN_PROGRESS'
                    }
                  }
                }
              }
            }
        }
    }, source: ['id']})
    functions.logger.info(`${prefix} Order created notification, was sended, notification id: ${response.id}`)
  });

const onConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;  

    functions.logger.info(`${prefix} Sending order confirmed notification to the client, order id: ${order.id}, user id: ${order.customer.id}`)
    const response = await notificationClient.create({body: {
        filters: {
            user: order.customer.id,
        },
        message: {
            title: '!Pedido en camino¡',
            body: 'Ya queda poquito (⌐■_■)',
            data: {
              navigate: {
                name: 'MainTab',
                params: {
                  screen: "MenuStack",
                  params: {
                    screen: 'Purchases'
                    // TODO: add view
                  }
                }
              }
            }
        }
    }, source: ['id']})
    functions.logger.info(`${prefix} Order confirmed notification, was sended, notification id: ${response.id}`)
  });

const onDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;  

    functions.logger.info(`${prefix} Sending delivered notification to the client, order id: ${order.id}, user id: ${order.customer.id}`)
    const response = await notificationClient.create({body: {
        filters: {
            user: order.customer.id,
        },
        message: {
            title: '!Pedido entregado¡',
            body: 'Gracias por comprar con Shop Shop ♥‿♥',
            data: {
              navigate: {
                name: 'MainTab',
                params: {
                  screen: "MenuStack",
                  params: {
                    screen: 'Purchases'
                    // TODO: add view
                  }
                }
              }
            }
        }
    }, source: ['id']})
    functions.logger.info(`${prefix} Order delivered notification, was sended, notification id: ${response.id}`)
  });


export default {
  onCreated,
  onConfirmed,
  onDelivered,
};
