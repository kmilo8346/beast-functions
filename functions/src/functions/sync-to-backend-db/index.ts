import * as functions from "firebase-functions";
import snakeCaseKeys from "snakecase-keys";

import elastic from "../../lib/elastic";
import utils from "../../lib/utils";

exports.stores = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change) => {
    const prefix = "[sync store changes function]";

    const prevUser = change.before.data();
    const newUser = change.after.data();

    functions.logger.info(`${prefix} prev user`, prevUser);
    functions.logger.info(`${prefix} new user`, newUser);

    if (!newUser?.store) {
      functions.logger.info(`${prefix} Store must be defined`);
      return;
    }

    if (prevUser?.store?.version === newUser.store?.version) {
      functions.logger.info(`${prefix} Store version was not changed`);
      return;
    }

    functions.logger.info(
      `${prefix} Store ${newUser.store.id} have been updated to version: ${newUser.store.version}`
    );

    try {
      await utils.createIndexIfNotExist("stores", {
        mappings: {
          properties: {
            id: { type: "keyword" },
            delivery_time: { type: "integer_range" },
            delivery_area: {
              properties: {
                geometry: {
                  type: "geo_shape", "strategy" : "recursive"
                }
              }
            },
            opening_hours: { type: "nested" },
          },
        },
      });
      // converting to sanke case
      const newStore = snakeCaseKeys(newUser.store, { deep: true });

      functions.logger.info(`${prefix} Upserting store and updating products store info`, newStore);
      const results = await Promise.all([
        elastic.update({
          index: "stores",
          refresh: "true",
          id: newStore.id,
          body: {
            doc: newStore,
            doc_as_upsert: true,
          },
        }),
        elastic.updateByQuery({
          index: "products-*",
          refresh: true,
          body: {
            query: {
              bool: {
                filter: [
                  { term: { "store.id": newStore.id } },
                  { range: { "store.version": { lt: newStore.version } } },
                ],
              },
            },
            script: {
              lang: "painless",
              source: "ctx._source['store'] = params.newStore",
              params: {
                newStore,
              },
            },
          },
        })
      ]);

      functions.logger.info(
        `${prefix} ${results[1].body.updated} products were successfully updated!`
      );
    } catch (error) {
      functions.logger.error(error)
      functions.logger.error(`${prefix} Unexpected error synchronizing stores changes to elastic`);
      
      throw error;
    }
  });
