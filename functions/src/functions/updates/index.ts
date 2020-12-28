import * as functions from "firebase-functions";

import { Store } from "../../types";
import elastic from "../../lib/elastic";

const prefix = "[updates]";

const onStoreUpdatedUpdateProducts = functions.pubsub
  .topic("store.updated")
  .onPublish(async (message) => {
    const store: Store = message.json;

    try {
      if ("enabled" in store || "delivery_area" in store) {
        functions.logger.info(
          `${prefix} Store ${message.attributes.id} was updated, updating related products`
        );
        const params: { [key: string]: any } = {};
        if ("enabled" in store) {
          params.enabled = store.enabled;
        }
        if ("delivery_area" in store) {
          params.delivery_area = store.delivery_area.geometry;
        }
        const response = await elastic.updateByQuery({
          index: "products",
          refresh: true,
          body: {
            script: {
              lang: "painless",
              source: `
                if(params.containsKey('enabled')) {
                  ctx._source.store_info.enabled = params.enabled;
                }
                if(params.containsKey('delivery_area')) {
                  ctx._source.store_info.delivery_area = params.delivery_area;
                }
              `,
              params,
            },
            query: {
              bool: {
                must: [
                  {
                    match_phrase: {
                      "store_info.id.keyword": {
                        query: message.attributes.id,
                      },
                    },
                  },
                ],
              },
            },
          },
        });
        functions.logger.info(
          `${prefix} Products updated ${response.body.updated}`
        );
      }
    } catch (error) {
      functions.logger.debug({ store });
      functions.logger.error(JSON.stringify(error));

      throw new Error(
        `${prefix} Unexpected error updating products on store updated`
      );
    }
  });

export default {
  onStoreUpdatedUpdateProducts,
};
