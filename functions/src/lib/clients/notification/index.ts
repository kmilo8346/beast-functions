import * as functions from "firebase-functions";

import elastic from "../../elastic";
import {
  Notification,
  SearchParams,
  SearchResponse,
  UpdateParams,
} from "../../../types";
import utils from "../../utils";

const index = "notifications";
const prefix = "[notification client]";

class NotificationClient {
  /**
   * Get notification
   * @param id string
   * @param source string[]
   * @returns Promise<Notification>
   */
  public async get(id: string, source?: string[]): Promise<Notification> {
    try {
      const response = await elastic.get({
        id,
        index,
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
      };
    } catch (error) {
      functions.logger.debug({ id, source });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error getting notification`);
    }
  }

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
   * Update a notification
   * @param id string
   * @param params UpdateParams<Notification>
   * @returns Promise<Partial<Notification>>
   */
  async update(
    id: string,
    params: UpdateParams<Notification>
  ): Promise<Partial<Notification>> {
    try {
      const update = {
        ...params.body,
        updated_at: new Date(),
      };
      await elastic.update({
        id,
        index,
        body: {
          doc: update,
        },
      });

      return utils.mapObject(
        {
          ...update,
          id,
        },
        params.source
      );
    } catch (error) {
      functions.logger.debug({ id, params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error updating notification`);
    }
  }
}

export default new NotificationClient();
