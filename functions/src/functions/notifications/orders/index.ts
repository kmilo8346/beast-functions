import * as functions from "firebase-functions";

import notificationClient from "../../../lib/clients/notification";
import { Order, ConfirmationStatus, CancellationReason } from "../../../types";

const prefix = "[order notifications]";

const onCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending order created notification to the seller, order id: ${order.id}, user id: ${order.transaction.store.user}`
    );
    const response = await notificationClient.create({
      body: {
        filters: {
          user: order.transaction.store.user,
        },
        message: {
          title: "¡Nueva venta!",
          body: "No hagas esperar al cliente ◑.◑",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order created notification, was sended, notification id: ${response.id}`
    );
  });

const onConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending order confirmed notification to the client, order id: ${order.id}, user id: ${order.customer.id}`
    );
    let notificationMessage = {
      title: "!Pedido en camino¡",
      body: "Ya queda poquito (⌐■_■)",
    };
    if (
      order.dispatch_provider.confirmation?.status === ConfirmationStatus.PARTIAL_STOCK
    ) {
      notificationMessage = {
        title: "!Pedido en camino¡",
        body: "Faltaron algunas cositas, te devolveremos el $ de lo q falta",
      };
    }
    const response = await notificationClient.create({
      body: {
        filters: {
          user: order.customer.id,
        },
        message: notificationMessage,
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order confirmed notification, was sended, notification id: ${response.id}`
    );
  });

const onDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;

    functions.logger.info(
      `${prefix} Sending delivered notification to the client, order id: ${order.id}, user id: ${order.customer.id}`
    );
    const response = await notificationClient.create({
      body: {
        filters: {
          user: order.customer.id,
        },
        message: {
          title: "!Pedido entregado¡",
          body: "Gracias por comprar con Shop Shop ♥‿♥",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order delivered notification, was sended, notification id: ${response.id}`
    );
  });

  const onCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;

    if (order.dispatch_provider.cancellation?.reason === CancellationReason.CONFIRMATION_OUT_OF_STOCK) {
      functions.logger.info(
        `${prefix} Sending order cancelled notification to the client, order id: ${order.id}, client id: ${order.customer.id}`
      );
      const response = await notificationClient.create({
        body: {
          filters: {
            user: order.customer.id,
          },
          message: {
            title: "Orden cancelada",
            body: "El vendedor no tenía stock, tuvimos q cancelar",
          },
        },
        source: ["id"],
      });
      functions.logger.info(
        `${prefix} Order cancelled notification, was sended, notification id: ${response.id}`
      );
    }
    
  });  

export default {
  onCreated,
  onConfirmed,
  onDelivered,
  onCancelled
};
