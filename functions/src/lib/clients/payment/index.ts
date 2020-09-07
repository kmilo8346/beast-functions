import * as functions from "firebase-functions";

import elastic from "../../elastic";
import { SearchParams, SearchResponse, Payment, UpdateParams } from "../../../types";

const prefix = "[payment client]";

class PaymentClient {
  /**
   * Search payments
   * @param params SearchParams
   * @returns Promise<SearchResponse<Payment>>
   */
  async search(params: SearchParams): Promise<SearchResponse<Payment>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
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
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
      }

      const response = await elastic.search({
        index: "payments*",
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

      throw new Error(`${prefix} Unexpected error searching over payments`);
    }
  }

  /**
   * 
   * @param params
   */
  async update(id: string, params: UpdateParams<Payment>,
  ): Promise<void> {
    try {
      const [index, _id] = id.split('|');
      await elastic.update({
        index: index,
        id: _id,
        body: {
          doc: {
            ...params.body,
            updated_at: new Date(),
          },
        },
      });
    } catch (error) {
      functions.logger.debug({ id, params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error updating payment`);
    }
  }
}

export default new PaymentClient();
