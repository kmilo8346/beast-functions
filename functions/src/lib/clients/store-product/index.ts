import * as functions from "firebase-functions";

import {
  SearchParams,
  SearchResponse,
  CreateStoreProduct,
  CreateParams,
  StoreProduct,
  UpdateParams,
} from "../../../types";
import utils from "../../utils";
import elastic from "../../elastic";

const index = "storeproducts";
const prefix = "[store product client]";

class StoreProductClient {
  /**
   * Search store products
   * @param params SearchParams
   * @returns Promise<SearchResponse<StoreProduct>
   */
  async search(params: SearchParams): Promise<SearchResponse<StoreProduct>> {
    try {
      // filters
      const bool: any = {
        must: [],
        filter: [],
        must_not: [],
      };

      if (params.filters) {
        if ("reference" in params.filters) {
          bool.must.push({
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

      throw new Error(`${prefix} Unexpected error searching store products`);
    }
  }

  /**
   * Create a store product
   * @param params CreateParams<CreateStoreProduct>
   * @returns Promise<StoreProduct>
   */
  async create(
    params: CreateParams<CreateStoreProduct>
  ): Promise<StoreProduct> {
    try {
      // find already created store product
      const searchResponse = await this.search({
        filters: { reference: params.body.reference },
        from: 0,
        size: 1,
        source: params.source,
      });
      if (searchResponse.hits.length) {
        const alreadyCreated = searchResponse.hits[0] as StoreProduct;
        functions.logger.info(
          `${prefix} A store product is already created, store product id ${alreadyCreated.id}, reference ${alreadyCreated.reference}`
        );
        return alreadyCreated;
      }

      const { id, ...body } = params.body;
      const response = await elastic.index({
        id: utils.parseId(id),
        index,
        refresh: "true",
        body,
      });

      return utils.mapObject(
        {
          ...body,
          id: response.body._id,
        },
        params.source
      );
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error creating store product`);
    }
  }

  /**
   * Update a store product
   * @param id string
   * @param params UpdateParams<StoreProduct>
   * @returns Promise<Partial<StoreProduct>>
   */
  async update(
    id: string,
    params: UpdateParams<StoreProduct>
  ): Promise<Partial<StoreProduct>> {
    try {
      const _id = utils.parseId(id);
      await elastic.update({
        index,
        id: _id,
        body: {
          doc: params.body,
        },
      });

      return utils.mapObject(
        {
          ...params.body,
          id: _id,
        },
        params.source
      );
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error updating store product`);
    }
  }

  /**
   * Delete store product
   * @param id string
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    try {
      await elastic.delete({
        index,
        refresh: "true",
        id: utils.parseId(id),
      });
    } catch (error) {
      functions.logger.debug({ id });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error deleting store product`);
    }
  }
}

export default new StoreProductClient();
