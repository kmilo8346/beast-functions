import * as functions from "firebase-functions";

// types
import { CancellationExecuter, Order } from "../../../types";
// lib
import notificationClient from "../../../lib/clients/notification";

const prefix = "[client notifications]";

const onOrderCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending client order created notification, order id: ${order.id}, client id: ${order.customer.id}`
    );
    const notification = await notificationClient.create({
      body: {
        idempotency: context.eventId,
        filters: {
          user: order.customer.id,
        },
        message: {
          title: "¡Pedido enviado!",
          body: `Tu pedido ha sido enviado a ${order.transaction.shopping_cart.store.name}`,
          data: {
            beast_route: "ClientOrderDetails",
            beast_params: {
              order: order.id,
            },
          },
          sound: "default",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Client order created notification, was sent, notification id: ${notification.id}`
    );
  });

const onOrderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending client order confirmed notification, order id: ${order.id}, client id: ${order.customer.id}`
    );
    const notification = await notificationClient.create({
      body: {
        idempotency: context.eventId,
        filters: {
          user: order.customer.id,
        },
        message: {
          title: "¡Pedido en camino!",
          body: `${order.transaction.shopping_cart.store.name} confirmó, está preparando todo y pronto te entregará tu pedido.`,
          data: {
            beast_route: "ClientOrderDetails",
            beast_params: {
              order: order.id,
            },
          },
          sound: "default",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Client order confirmed notification, was sent, notification id: ${notification.id}`
    );
  });

const onOrderDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending client order delivered notification, order id: ${order.id}, client id: ${order.customer.id}`
    );
    const notification = await notificationClient.create({
      body: {
        idempotency: context.eventId,
        filters: {
          user: order.customer.id,
        },
        message: {
          title: "¡Gracias por elegir Shop Shop!",
          body: "Con tu pedido estás apoyando a un vecino emprendedor 😍",
          data: {
            beast_route: "ClientOrderDetails",
            beast_params: {
              order: order.id,
            },
          },
          sound: "default",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Client order delivered notification, was sent, notification id: ${notification.id}`
    );
  });

const onOrderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    if (
      order.cancellation_information?.executer === CancellationExecuter.SELLER
    ) {
      functions.logger.info(
        `${prefix} Sending client order cancelled notification, order id: ${order.id}, client id: ${order.customer.id}`
      );
      const notification = await notificationClient.create({
        body: {
          idempotency: context.eventId,
          filters: {
            user: order.customer.id,
          },
          message: {
            title: "Pedido cancelado",
            body: `Lo sentimos, ${order.transaction.shopping_cart.store.name} tuvo un inconveniente y tuvo que cancelar`,
            data: {
              beast_route: "ClientOrderDetails",
              beast_params: {
                order: order.id,
              },
            },
            sound: "default",
          },
        },
        source: ["id"],
      });
      functions.logger.info(
        `${prefix} Client order cancelled notification, was sent, notification id: ${notification.id}`
      );
    } else if (
      order.cancellation_information?.executer === CancellationExecuter.CLIENT
    ) {
      functions.logger.info(
        `${prefix} Sending client order cancelled notification, order id: ${order.id}, client id: ${order.customer.id}`
      );
      const notification = await notificationClient.create({
        body: {
          idempotency: context.eventId,
          filters: {
            user: order.customer.id,
          },
          message: {
            title: "Pedido cancelado",
            body: `Listo, tu pedido fue cancelado correctamente`,
            data: {
              beast_route: "ClientOrderDetails",
              beast_params: {
                order: order.id,
              },
            },
            sound: "default",
          },
        },
        source: ["id"],
      });
      functions.logger.info(
        `${prefix} Client order cancelled notification, was sent, notification id: ${notification.id}`
      );
    }
  });

export default {
  onOrderCreated,
  onOrderConfirmed,
  onOrderDelivered,
  onOrderCancelled,
};
