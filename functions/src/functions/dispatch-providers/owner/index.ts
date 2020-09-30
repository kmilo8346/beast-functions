import * as functions from "firebase-functions";

import {
  Order,
  ConfirmationStatus,
  CancellationReason,
  DispatchProvider, Payment
} from "../../../types";
import providerClient from "./clients/provider-client";
import notificationClient from "../../../lib/clients/notification";

const prefix = "[dispatch provider owner]";

/**
 * On payment approved create order
 */
const onPaymentApproved = functions.pubsub
  .topic("payment.approved")
  .onPublish(async (message) => {
    const payment: Payment = message.json;
    // trick to avoid break change
    payment.dispatch_provider_id = payment.dispatch_provider_id || DispatchProvider.OWNER;

    await providerClient.createOrder(payment);
  });

/**
 * Or order confirmed with partial stock
 * refund partial
 */  
const onOrderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;
    // trick to avoid break change
    order.dispatch_provider_id = order.dispatch_provider_id || DispatchProvider.OWNER;

    if (order.dispatch_provider_id !== DispatchProvider.OWNER) {
      return;
    }
    if (
      order.dispatch_provider.confirmation?.status ===
      ConfirmationStatus.PARTIAL_STOCK
    ) {
      await providerClient.refundPartial(order);
    }
  });

/**
 * On order cancelled total refund
 */
const onOrderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;
    // trick to avoid break change
    order.dispatch_provider_id = order.dispatch_provider_id || DispatchProvider.OWNER;

    if (order.dispatch_provider_id !== DispatchProvider.OWNER) {
      return;
    }
    if (
      order.dispatch_provider.cancellation?.reason ===
      CancellationReason.CONFIRMATION_OUT_OF_STOCK
    ) {
      await providerClient.refund(order);
    }
  });

/**
 * On order created send notification
 */  
const onOrderCreatedSendNotification = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    const order: Order = message.json;
    // trick to avoid break change
    order.dispatch_provider_id = order.dispatch_provider_id || DispatchProvider.OWNER;

    if (order.dispatch_provider_id !== DispatchProvider.OWNER) {
      return;
    }

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
          body: "Tu cliente te espera 😅",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order created notification, was sended, notification id: ${response.id}`
    );
  });

/**
 * On order confirmed send notification
 */
const onOrderConfirmedSendNotification = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;
    // trick to avoid break change
    order.dispatch_provider_id = order.dispatch_provider_id || DispatchProvider.OWNER;

    if (order.dispatch_provider_id !== DispatchProvider.OWNER) {
      return;
    }
    if (!order.customer) {
      functions.logger.warn(
        `${prefix} Cant send order confirmed notification, because dont have customer, order id: ${order.id}`,
      );
      return;
    }

    functions.logger.info(
      `${prefix} Sending order confirmed notification to the client, order id: ${order.id}, user id: ${order.customer.id}`
    );
    let notificationMessage = {
      title: "¡Pedido en camino!",
      body: "Ya queda poquito 🤩",
    };
    if (
      order.dispatch_provider.confirmation?.status === ConfirmationStatus.PARTIAL_STOCK
    ) {
      notificationMessage = {
        title: "¡Pedido en camino!",
        body: "Faltaron algunas cositas, te devolveremos el dinero de lo que falta",
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

/**
 * On order delivered send notification
 */
const onOrderDeliveredSendNotification = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    const order: Order = message.json;
    // trick to avoid break change
    order.dispatch_provider_id = order.dispatch_provider_id || DispatchProvider.OWNER;

    if (order.dispatch_provider_id !== DispatchProvider.OWNER) {
      return;
    }
    if (!order.customer) {
      functions.logger.warn(
        `${prefix} Cant send order delivered notification, because dont have customer, order id: ${order.id}`,
      );
      return;
    }

    functions.logger.info(
      `${prefix} Sending delivered notification to the client, order id: ${order.id}, user id: ${order.customer.id}`
    );
    const response = await notificationClient.create({
      body: {
        filters: {
          user: order.customer.id,
        },
        message: {
          title: "¡Pedido entregado!",
          body: "Gracias por comprar con Shop Shop 🤗",
        },
      },
      source: ["id"],
    });
    functions.logger.info(
      `${prefix} Order delivered notification, was sended, notification id: ${response.id}`
    );
  });

/**
 * On order cancelled send notification
 */
const onOrderCancelledSendNotification = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;
    // trick to avoid break change
    order.dispatch_provider_id = order.dispatch_provider_id || DispatchProvider.OWNER;
    
    if (order.dispatch_provider_id !== DispatchProvider.OWNER) {
      return;
    }
    if (!order.customer) {
      functions.logger.warn(
        `${prefix} Cant send order cancelled notification, because dont have customer, order id: ${order.id}`,
      );
      return;
    }

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
  onPaymentApproved,
  onOrderConfirmed,
  onOrderCancelled,
  onOrderCreatedSendNotification,
  onOrderConfirmedSendNotification,
  onOrderDeliveredSendNotification,
  onOrderCancelledSendNotification
};


