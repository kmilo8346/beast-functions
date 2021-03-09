import * as functions from "firebase-functions";

import elastic from "../../elastic";
import utils from "../../utils";
import { SearchParams, SearchResponse, Device } from "../../../types";

const index = "devices";
const prefix = "[device client]";

class DeviceClient {
  /**
   * Search devices
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Device>> {
    try {
      // filters
      const query: any = {
        bool: {
          must: [],
          filter: [],
          must_not: [],
        },
      };
      if (params.filters) {
        if ("user" in params.filters) {
          query.bool.must.push({
            match_phrase: {
              "user_id.keyword": {
                query: params.filters.user,
              },
            },
          });
        }
        if ("area" in params.filters) {
          query.bool.filter.push({
            geo_distance: {
              distance: params.filters.area.radius,
              user_location: params.filters.area.coordinates,
            },
          });
        }
        if ("token_exists" in params.filters) {
          query.bool.must.push({
            exists: {
              field: "token.keyword",
            },
          });
        }
        if ("app_version_gte" in params.filters) {
          query.bool.must.push({
            range: {
              app_version_num: {
                gte: utils.convertVersionToInt(params.filters.app_version_gte),
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
          query,
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

      throw new Error(`${prefix} Unexpected error searching devices`);
    }
  }
}

export default new DeviceClient();
