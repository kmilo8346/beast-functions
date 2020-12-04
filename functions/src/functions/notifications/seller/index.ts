import * as functions from "firebase-functions";

// types
import { CancellationExecuter, Order } from "../../../types";
// lib
import notificationClient from "../../../lib/clients/notification";

const prefix = "[seller notifications]";

const onOrderCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending seller order created notification, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    const notification = await notificationClient.create({
      body: {
        idempotency: context.eventId,
        filters: {
          user: order.transaction.shopping_cart.store.user,
        },
        message: {
          title: "¡Nueva orden!",
          body: "Tu cliente te espera 😅",
          data: {
            beast_require_store: true,
            beast_route: "SellerOrderDetails",
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
      `${prefix} Seller order created notification, was sent, notification id: ${notification.id}`
    );
  });

const onOrderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending seller order confirmed notification, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    const notification = await notificationClient.create({
      body: {
        idempotency: context.eventId,
        filters: {
          user: order.transaction.shopping_cart.store.user,
        },
        message: {
          title: "¡Orden confirmada!",
          body: "Hemos notificado al cliente 😜",
          data: {
            beast_require_store: true,
            beast_route: "SellerOrderDetails",
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
      `${prefix} Seller order confirmed notification, was sent, notification id: ${notification.id}`
    );
  });

const onOrderDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending seller order delivered notification, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
    );
    const notification = await notificationClient.create({
      body: {
        idempotency: context.eventId,
        filters: {
          user: order.transaction.shopping_cart.store.user,
        },
        message: {
          title: "¡Orden entregada!",
          body: "Súper, vamos por más 🤩",
          data: {
            beast_require_store: true,
            beast_route: "SellerOrderDetails",
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
      `${prefix} Seller order delivered notification, was sent, notification id: ${notification.id}`
    );
  });

const onOrderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    if (
      order.cancellation_information?.executer === CancellationExecuter.CLIENT
    ) {
      functions.logger.info(
        `${prefix} Sending seller order cancelled notification, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
      );
      const notification = await notificationClient.create({
        body: {
          idempotency: context.eventId,
          filters: {
            user: order.transaction.shopping_cart.store.user,
          },
          message: {
            title: "Orden cancelada",
            body: "El cliente cambió de parecer 🥺",
            data: {
              beast_require_store: true,
              beast_route: "SellerOrderDetails",
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
        `${prefix} Seller order cancelled notification, was sent, notification id: ${notification.id}`
      );
    } else if (
      order.cancellation_information?.executer === CancellationExecuter.SELLER
    ) {
      functions.logger.info(
        `${prefix} Sending seller order cancelled notification, order id: ${order.id}, seller id: ${order.transaction.shopping_cart.store.user}`
      );
      const notification = await notificationClient.create({
        body: {
          idempotency: context.eventId,
          filters: {
            user: order.transaction.shopping_cart.store.user,
          },
          message: {
            title: "Orden cancelada",
            body: "Listo, cancelamos tu orden correctamente",
            data: {
              beast_require_store: true,
              beast_route: "SellerOrderDetails",
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
        `${prefix} Seller order cancelled notification, was sent, notification id: ${notification.id}`
      );
    }
  });

export default {
  onOrderCreated,
  onOrderConfirmed,
  onOrderDelivered,
  onOrderCancelled,
};
