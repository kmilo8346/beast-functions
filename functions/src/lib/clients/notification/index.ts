import { Expo, ExpoPushTicket } from 'expo-server-sdk';
import * as functions from "firebase-functions";

import elastic from '../../elastic';
import {
  CreateParams,
  CreateNotification,
  Notification,
  Device,
  SearchParams,
  SearchResponse,
  MessageReceipt,
} from '../../../types';
import utils from '../../utils';
import deviceClient from '../device';
import messageReceiptClient from '../message-receipt';

const prefix = '[notification client]';
const expo = new Expo();

class NotificationClient {
  /**
   * Search notifications
   * @param params SearchParams
   * @returns Promise<SearchResponse<Notification>>
   */
  async search(params: SearchParams): Promise<SearchResponse<Notification>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
        if ('idempotency' in params.filters) {
          must.push({
            match_phrase: {
              'idempotency.keyword': {
                query: params.filters.idempotency,
              },
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] = [
        { updated_at: { order: 'desc' } },
      ];
      if (params.sort) {
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
      }

      const response = await elastic.search({
        index: 'notifications-*',
        body: {
          query: {
            bool: {
              must,
            },
          },
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
        },
      });

      return {
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error searching notifications`);
    }
  }

  /**
   * Create a notification
   * @param params
   */
  async create(
    params: CreateParams<CreateNotification>,
  ): Promise<Notification> {
    try {
      // return notification if already created
      if (params.idempotency) {
        const searchNotificationsResponse = await this.search({
          filters: { idempotency: params.idempotency },
          from: 0,
          size: 1,
        });
        if (searchNotificationsResponse.hits.length) {
          const alreadyCreated = searchNotificationsResponse.hits[0];
          functions.logger.info(
            `${prefix} Notification is already created, returning notification, id ${alreadyCreated.id}`,
          );
          return utils.mapObject(
            alreadyCreated,
            params.source,
          );
        }
      }

      // find devices to send notification
      const searchDevicesResponse = await deviceClient.search({
        filters: {
          user: params.body.filters.user,
        },
        from: 0,
        size: 100,
      });

      // send notifications using expo tokens
      const hash: { [key: string]: boolean } = {};
      searchDevicesResponse.hits.forEach((device: Device) => {
        hash[device.token] = true;
      });
      const tokens = Object.keys(hash);
      let tickets: ExpoPushTicket[] = [];
      if (tokens.length) {
        const message = {
          to: tokens,
          ...params.body.message,
        };
        tickets = await expo.sendPushNotificationsAsync([message]);
      }
      
      // save notification object
      const index = `notifications-${utils.formatDate(new Date())}`;
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
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: 'true',
        body: newNotification,
      });
      const created: Notification =  {
        ...newNotification,
        id: `${response.body._index}|${response.body._id}`,
      }

      // create message receipt for every ticket
      const promises: Promise<MessageReceipt>[] = [];
      tickets.forEach(ticket => {
        promises.push(messageReceiptClient.create({body: {
          notification: created.id,
          expo_ticket: ticket
        }}))
      })
      await Promise.all(promises);

      return utils.mapObject(
        created,
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
