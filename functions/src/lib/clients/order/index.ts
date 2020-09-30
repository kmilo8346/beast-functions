import * as functions from "firebase-functions";

import utils from "../../utils";
import elastic from "../../elastic";
import {
  CreateOrder,
  CreateParams,
  SearchParams,
  SearchResponse,
  Order,
} from "../../../types";

const prefix = "[order client]";

class OrderClient {
  /**
   * Search orders
   * @param params SearchParams
   * @returns Promise<SearchResponse<Order>>
   */
  async search(params: SearchParams): Promise<SearchResponse<Order>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
        if (params.filters.idempotency) {
          must.push({
            match_phrase: {
              "idempotency.keyword": {
                query: params.filters.idempotency,
              },
            },
          });
        }
        if (params.filters.reference) {
          must.push({
            match_phrase: {
              "reference.keyword": {
                query: params.filters.reference,
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
        index: "orders*",
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

      throw new Error(`${prefix} Unexpected error searching over orders`);
    }
  }

  /**
   *
   * @param params
   */
  async create(params: CreateParams<CreateOrder>): Promise<any> {
    try {
      const index = `orders`;
      // creating index if not exist
      await utils.createIndexIfNotExist(index, {
        mappings: {
          properties: {
            created_at: { type: "date" },
            updated_at: { type: "date" },
          },
        },
      });
      const newOrder = {
        ...params.body,
        
        created_at: new Date(),
        updated_at: new Date(),
      };
      const response = await elastic.index({
        index,
        refresh: "true",
        body: newOrder,
      });
      const order: Order = {
        ...newOrder,
        id: `${response.body._index}|${response.body._id}`,
      };

      return utils.mapObject(order, params.source);
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error creating order`);
    }
  }
}

export default new OrderClient();
