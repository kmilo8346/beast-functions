import * as functions from "firebase-functions";

import elastic from "../../lib/elastic";
import { Product, Store } from "../../types";
import storeClient from "../../lib/clients/store";
import storeProductClient from "../../lib/clients/store-product";

const prefix = "[store products]";

const onStoreUpdated = functions.pubsub
  .topic("store.updated")
  .onPublish(async (message) => {
    const store: Store = message.json;
    const fields = [
      "name",
      "enabled",
      "images",
      "address",
      "delivery_area",
      "delivery_time",
      "opening_hours",
    ];
    try {
      if (fields.some((field) => field in store)) {
        functions.logger.info(
          `${prefix} Store ${message.attributes.id} was updated, updating related products`
        );
        const params = fields.reduce<{ [key: string]: any }>((p, field) => {
          if (field in store) {
            if (field === "delivery_area") {
              p.address = store.delivery_area.center;
              p.delivery_area = store.delivery_area.geometry;
            } else {
              p[field] = (store as { [key: string]: any })[field];
            }
          }
          return p;
        }, {});
        const response = await elastic.updateByQuery({
          index: "storeproducts",
          refresh: true,
          body: {
            script: {
              lang: "painless",
              source: `
                for (field in params.keySet()) {
                  ctx._source.store_info[field] = params[field];
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

      throw new Error(`${prefix} Unexpected error in on store updated handler`);
    }
  });

const onProductCreated = functions.pubsub
  .topic("product.created")
  .onPublish(async (message) => {
    const { store: storeId, ...product }: Product = message.json;

    try {
      const store = await storeClient.get(storeId, [
        "id",
        "name",
        "enabled",
        "images",
        "address",
        "delivery_area",
        "delivery_time",
        "opening_hours",
      ]);

      await storeProductClient.create({
        body: {
          ...product,
          suggest: {
            input: [product.name, ...(product.tags || [])],
            contexts: {
              store_location: [
                {
                  lat: store.delivery_area.center.location.lat,
                  lon: store.delivery_area.center.location.lon,
                },
              ],
            },
          },
          store_info: {
            id: store.id,
            name: store.name,
            enabled: store.enabled,
            images: store.images,
            address: store.delivery_area.center,
            delivery_area: store.delivery_area.geometry,
            delivery_time: store.delivery_time,
            opening_hours: store.opening_hours,
          },
        },
      });
    } catch (error) {
      functions.logger.debug({ product });
      functions.logger.error(JSON.stringify(error));

      throw new Error(
        `${prefix} Unexpected error in on product created handler`
      );
    }
  });

const onProductUpdated = functions.pubsub
  .topic("product.updated")
  .onPublish(async (message) => {
    const product: Product = message.json;

    try {
      // dont save store prop
      const { id, store, ...body } = product;
      await storeProductClient.update(id, { body });
    } catch (error) {
      functions.logger.debug({ product });
      functions.logger.error(JSON.stringify(error));

      throw new Error(
        `${prefix} Unexpected error in on product updated handler`
      );
    }
  });

const onProductDeleted = functions.pubsub
  .topic("product.deleted")
  .onPublish(async (message) => {
    const payload = message.json;

    try {
      await storeProductClient.delete(payload.id);
    } catch (error) {
      functions.logger.debug({ payload });
      functions.logger.error(JSON.stringify(error));

      throw new Error(
        `${prefix} Unexpected error in on product deleted handler`
      );
    }
  });

export default {
  onStoreUpdated,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
};
