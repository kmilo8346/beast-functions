import * as functions from "firebase-functions";

import elastic from "../../elastic";
import { SearchParams, SearchResponse, Product } from "../../../types";

const prefix = "[product client]";
const index = "products";

class ProductClient {
  /**
   * Search products
   * @param params SearchParams
   * @returns Promise<SearchResponse<Product>
   */
  async search(params: SearchParams): Promise<SearchResponse<Product>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
        must_not: [],
      };

      if (params.filters) {
        if ("store" in params.filters) {
          bool.must.push({
            match_phrase: {
              "store.keyword": {
                query: params.filters.store,
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
            bool,
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

      throw new Error(`${prefix} Unexpected error searching products`);
    }
  }
}

export default new ProductClient();
