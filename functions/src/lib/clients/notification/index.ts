import { Expo } from "expo-server-sdk";
import * as functions from "firebase-functions";

import elastic from "../../elastic";
import {
  CreateParams,
  CreateNotification,
  Notification,
  Device,
  SearchParams,
  SearchResponse,
} from "../../../types";
import utils from "../../utils";
import deviceClient from "../device";

const expo = new Expo();
const index = "notifications";
const prefix = "[notification client]";

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
        if ("idempotency" in params.filters) {
          must.push({
            match_phrase: {
              "idempotency.keyword": {
                query: params.filters.idempotency,
              },
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: "desc" | "asc" } }[] = [
        { updated_at: { order: "desc" } },
      ];
      if (params.sort) {
        sort = Object.keys(params.sort).map((field) => ({
          [field]: { order: (params.sort as any)[field] },
        }));
      }

      const response = await elastic.search({
        index,
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
        hits: response.body.hits.hits.map(({ _source, _id }: any) => ({
          ..._source,
          id: _id,
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
    params: CreateParams<CreateNotification>
  ): Promise<Notification> {
    try {
      // return notification if already created
      if (params.body.idempotency) {
        const searchNotificationsResponse = await this.search({
          filters: { idempotency: params.body.idempotency },
          from: 0,
          size: 1,
          source: params.source,
        });
        if (searchNotificationsResponse.hits.length) {
          const alreadyCreated = searchNotificationsResponse.hits[0];
          functions.logger.info(
            `${prefix} Notification is already created, returning notification, id ${alreadyCreated.id}`
          );
          return alreadyCreated;
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
      if (tokens.length) {
        const message = {
          to: tokens,
          ...params.body.message,
        };
        await expo.sendPushNotificationsAsync([message]);
      }

      // save notification object
      const newNotification = {
        ...params.body,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: "true",
        body: newNotification,
      });
      return utils.mapObject(
        {
          ...newNotification,
          id: response.body._id,
        },
        params.source
      );
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error creating a notification`);
    }
  }
}

export default new NotificationClient();
