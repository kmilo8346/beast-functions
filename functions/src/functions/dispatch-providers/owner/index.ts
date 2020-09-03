import * as functions from "firebase-functions";

import {
  Order,
  ConfirmationStatus,
  CancellationReason,
  DispatchProvider,
} from "../../../types";
import providerClient from "./clients/provider-client";

const onPaymentApproved = functions.pubsub
  .topic("payment.approved")
  .onPublish(async (message) => {
    const payment = message.json;
    if (
      payment.transaction.store.dispatch_provider !== DispatchProvider.OWNER
    ) {
      return;
    }
    await providerClient.createOrder(payment);
  });

const onOrderConfirmed = functions.pubsub
  .topic("order.confirmed")
  .onPublish(async (message) => {
    const order: Order = message.json;
    if (order.transaction.store.dispatch_provider !== DispatchProvider.OWNER) {
      return;
    }
    if (
      order.dispatch_provider.confirmation?.status ===
      ConfirmationStatus.PARTIAL_STOCK
    ) {
      await providerClient.refundPartial(order);
    }
  });

const onOrderCancelled = functions.pubsub
  .topic("order.cancelled")
  .onPublish(async (message) => {
    const order: Order = message.json;
    if (order.transaction.store.dispatch_provider !== DispatchProvider.OWNER) {
      return;
    }
    if (
      order.dispatch_provider.cancellation?.reason ===
      CancellationReason.CONFIRMATION_OUT_OF_STOCK
    ) {
      await providerClient.refund(order);
    }
  });

export default {
  onPaymentApproved,
  onOrderConfirmed,
  onOrderCancelled
};
