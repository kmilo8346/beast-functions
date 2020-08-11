import { Expo } from 'expo-server-sdk';
import * as functions from "firebase-functions";

import elastic from '../../elastic';
import {
  CreateParams,
  CreateNotification,
  Notification,
  Device,
  NotificationStatus,
} from '../../../types';
import utils from '../../utils';
import deviceClient from '../device';

const prefix = '[notification client]';
const expo = new Expo();

class NotificationClient {
  /**
   * Create a notification
   * @param params
   */
  async create(
    params: CreateParams<CreateNotification>,
  ): Promise<Notification> {
    try {
      // send notifications
      const result = await deviceClient.search({
        filters: {
          user: params.body.filters.user,
        },
        from: 0,
        size: 100,
      });
      // reduce to unique tokens
      const hash: { [key: string]: boolean } = {};
      result.hits.forEach((device: Device) => {
        hash[device.token] = true;
      });
      const tokens = Object.keys(hash);
      const message = {
        to: tokens,
        ...params.body.message,
      };
      const tikets = await expo.sendPushNotificationsAsync([message]);

      // save notification object
      const index = `notification-${utils.formatDate(new Date())}`;
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      });

      const newNotification = {
        ...params.body,
        status: NotificationStatus.CREATED,
        tikets,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newNotification,
      });
      return utils.mapObject(
        {
          ...newNotification,
          id: `${response.body._index}|${response.body._id}`,
        },
        params.source,
      );
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error creating a notification`);
    }
  }
}

export default new NotificationClient();
