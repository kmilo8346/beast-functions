import * as functions from "firebase-functions";
import camelCaseKeys from "camelcase-keys";
import * as admin from "firebase-admin";

import { Order } from "../../../types";

/**
 * Convert to camel case and remove unecesary fields to avoid overload front
 * @param order
 */
const transformOrder = (order: Order) => {
  const mapped: any = {
    id: order.id,
    status: order.status,
    customer: {
      id: order.customer.id,
    },
    transaction: {
      store: {
        id: order.transaction.store.id,
      },
    },
    created_at: order.created_at,
    updated_at: order.updated_at
  };
  return camelCaseKeys(mapped, { deep: true });
};

/**
 * Sync logic
 * @param message
 */
const syncOrderChanges = async (message: any) => {
  const prefix = "[sync to front db order change]";
  try {
    const id = message.attributes.id;
    const order = message.json;

    functions.logger.info(
      `${prefix} order.${order.status} received, id: ${id}`
    );

    functions.logger.info(`${prefix} Synchronizing to front db`);
    await admin
      .firestore()
      .collection("orders")
      .doc(id)
      .set(transformOrder(order));
    functions.logger.info(`${prefix} Synchronizing was ok :)`);
  } catch (error) {
    functions.logger.debug(message.attributes);
    functions.logger.error(error);
    functions.logger.error(
      `${prefix} Unexpected error synchronizing order change to front db`
    );

    throw error;
  }
};

const orderCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message) => {
    await syncOrderChanges(message);
  });

const orderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    await syncOrderChanges(message);
  });

const orderDelivered = functions.pubsub
  .topic("order.delivered")
  .onPublish(async (message) => {
    await syncOrderChanges(message);
  });

const orderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    await syncOrderChanges(message);
  });

export default {
  orderCreated,
  orderConfirmed,
  orderDelivered,
  orderCancelled,
};
