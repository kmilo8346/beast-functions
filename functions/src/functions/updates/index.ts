import * as functions from "firebase-functions";

import { Store } from "../../types";
import elastic from "../../lib/elastic";

const prefix = "[updates]";

const onStoreUpdatedUpdateProducts = functions.pubsub
  .topic("store.updated")
  .onPublish(async (message) => {
    const store: Store = message.json;
    try {
      functions.logger.info(
        `${prefix} Store ${message.attributes.id} was updated, updating related products`
      );
      if ('enabled' in store || 'delivery_area' in store || 'opening_hours' in store) {
        const response = await elastic.updateByQuery({
          index: "products",
          refresh: true,
          body: {
            script: {
              lang: "painless",
              source: 'ctx._source["store_info"] = params.store',
              params: {
                store: {
                  id: message.attributes.id,
                  enabled: store.enabled,
                  delivery_area: store.delivery_area.geometry,
                  opening_hours: store.opening_hours,
                },
              },
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
      functions.logger.error(error);

      throw new Error(
        `${prefix} Unexpected error updating products on store updated`
      );
    }
  });

export default {
  onStoreUpdatedUpdateProducts,
};
