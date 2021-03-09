import { Expo } from "expo-server-sdk";
import * as functions from "firebase-functions";

import { Device, NotificationStatus, SearchResponse } from "../../types";
import deviceClient from "../../lib/clients/device";
import notificationClient from "../../lib/clients/notification";

const expo = new Expo();
const prefix = "[notifications]";

const onNotificationCreated = functions.pubsub
  .topic("notification.created")
  .onPublish(async (message) => {
    try {
      functions.logger.info(`${prefix} Sending notifications 🚀`);

      // check if already executed
      const notification = await notificationClient.get(message.attributes.id);
      if (notification.status === NotificationStatus.EXECUTED) {
        functions.logger.info(
          `${prefix} Notification was already executed, notification id: ${notification.id}`
        );
        return;
      }

      // getting devices
      const devices: Device[] = [];
      let response: SearchResponse<Device>;
      do {
        response = await deviceClient.search({
          from: devices.length,
          size: 30,
          source: ["token"],
          filters: {
            ...(notification.filters || {}),
            token_exists: true,
          },
        });
        devices.push(...response.hits);
      } while (response.total > devices.length);

      // send payload to expo server
      const tokens = new Set<string>();
      devices.forEach((device) => tokens.add(device.token as string));

      // TODO: remove
      functions.logger.debug({
        to: Array.from(tokens),
        sound: "default",
        ...notification.message,
        data: {
          ...(notification.message.data || {}),
          attribution: {
            notification_id: notification.id,
            ...(notification.attribution || {}),
          },
        },
      });

      const tickets = await expo.sendPushNotificationsAsync([
        {
          to: Array.from(tokens),
          sound: "default",
          ...notification.message,
          data: {
            ...(notification.message.data || {}),
            attribution: {
              notification_id: notification.id,
              ...(notification.attribution || {}),
            },
          },
        },
      ]);

      // update notification
      await notificationClient.update(notification.id, {
        body: {
          status: NotificationStatus.EXECUTED,
          stats: {
            devices_ok: tickets.filter((t) => t.status === "ok").length,
            devices_error: tickets.filter((t) => t.status === "error").length,
          } as any,
          expo_push_tickets: tickets,
        },
      });

      functions.logger.info(
        `${prefix} Sending notifications logic was executed 🎉`
      );
    } catch (error) {
      functions.logger.debug({ message });
      functions.logger.error(JSON.stringify(error));

      throw new Error(
        `${prefix} Unexpected error in on notification created handler`
      );
    }
  });

export default {
  onNotificationCreated,
};
