import * as functions from "firebase-functions";

import elastic from "../../elastic";
import { SearchParams, SearchResponse, Device } from "../../../types";

const prefix = "[device client]";

class DeviceClient {
  /**
   * Search devices
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Device>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
        if ("user" in params.filters) {
          must.push({
            match_phrase: {
              "user_id.keyword": {
                query: params.filters.user,
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
        index: "devices*",
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

      throw new Error(`${prefix} Unexpected error searching devices`);
    }
  }

  /**
   * Delete devices by token
   * @param token string
   * @returns Promise<void>
   */
  async deleteByToken(token: string): Promise<void> {
    try {
      const response = await elastic.deleteByQuery({
        index: "devices*",
        body: {
          query: {
            bool: {
              must: [
                {
                  match_phrase: {
                    "token.keyword": {
                      query: token,
                    },
                  },
                },
              ],
            },
          },
        },
      });
      functions.logger.info("deleteByToken", JSON.stringify(response));
    } catch (error) {
      functions.logger.debug({ token });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error deleting devices by token`);
    }
  }
}

export default new DeviceClient();
