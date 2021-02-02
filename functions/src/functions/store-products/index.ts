import * as functions from "firebase-functions";

import elastic from "../../lib/elastic";
import { Product, Store } from "../../types";
import storeClient from "../../lib/clients/store";
import productClient from "../../lib/clients/product";
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
      "delivery_area",
      "delivery_time",
      "opening_hours",
    ];
    try {
      if (fields.some((field) => field in store)) {
        functions.logger.info(
          `${prefix} Store ${message.attributes.id} was updated, updating related store products`
        );

        // getting products in store
        let from = 0;
        let response;
        const products: Product[] = [];
        do {
          response = await productClient.search({
            from,
            size: 10,
            source: ["id"],
            filters: { store: message.attributes.id },
          });
          products.push(...response.hits);
          from += response.hits.length;
        } while (from < response.total);

        // update
        const update = fields.reduce<{ [key: string]: any }>((p, field) => {
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

        // bulk update
        const payload: any[] = [];
        products.forEach((product) => {
          payload.push({
            update: { _id: product.id, _index: "storeproducts" },
          });
          payload.push({ doc: { store_info: update } });
        });

        if (payload.length) {
          const { body } = await elastic.bulk({
            refresh: "true",
            body: payload,
          });

          if (body.errors) {
            functions.logger.warn(`${prefix} Error in bulk updates`);
            functions.logger.debug({ body });
          } else {
            functions.logger.info(`${prefix} Store products updated`);
          }
        } else {
          functions.logger.info(`${prefix} Nothing to update`);
        }
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
    const product: Product = message.json;

    try {
      const store = await storeClient.get(product.store, [
        "id",
        "name",
        "enabled",
        "images",
        "address",
        "created_at",
        "delivery_area",
        "delivery_time",
        "opening_hours",
      ]);

      await storeProductClient.create({
        body: {
          ...product,
          stats: {
            number_of_times_in_orders: 0,
          },
          store_info: {
            id: store.id,
            name: store.name,
            enabled: store.enabled,
            images: store.images,
            created_at: store.created_at,
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
      const { id, ...body } = product;
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
