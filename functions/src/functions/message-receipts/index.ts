import * as functions from "firebase-functions";

import { MessageReceipt } from "../../types";
import deviceClient from "../../lib/clients/device";

const prefix = "[message receipt]";

const onFailed = functions.pubsub
  .topic("message-receipt.failed")
  .onPublish(async (message) => {
    const messageReceipt: MessageReceipt = message.json;

    functions.logger.info(
      `${prefix} Message receipt with state failed received, id: ${messageReceipt.id}`
    );

    let messageWithToken = "";
    if (
      messageReceipt.expo_ticket.status === "error" &&
      messageReceipt.expo_ticket.details?.error === "DeviceNotRegistered"
    ) {
      messageWithToken = messageReceipt.expo_ticket.message;
    }
    if (
      messageReceipt.expo_receipt?.status === "error" &&
      messageReceipt.expo_receipt?.details?.error === "DeviceNotRegistered"
    ) {
      messageWithToken = messageReceipt.expo_receipt.message;
    }

    const match = messageWithToken.match(/\[([^)]+)\]/);
    if (!match) {
      functions.logger.warn(
        `${prefix} Token could not be extracted from, ${messageWithToken}`
      );
      return;
    }

    functions.logger.warn(`${prefix} Deleting devices`);
    await deviceClient.deleteByToken(`ExponentPushToken[${match[1]}]`);
    functions.logger.warn(`${prefix} Devices were deleted :)`);
  });

export default {
  listeners: {
    messageReceipt: {
      onFailed,
    },
  },
};
