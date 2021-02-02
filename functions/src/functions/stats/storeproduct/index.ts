import * as functions from "firebase-functions";

import { Order } from "../../../types";
import elastic from "../../../lib/elastic";

const prefix = "[stats]";

const onOrderCreated = functions.pubsub
  .topic("order.created")
  .onPublish(async (message, context) => {
    const order: Order = message.json;

    functions.logger.info(`${prefix} Generating stats from order created`);

    // generating stats
    const product_stats = order.transaction.shopping_cart.items.reduce<{
      [key: string]: { number_of_times_in_orders: number };
    }>((product_stats, item) => {
      const s = { ...product_stats };
      s[item.id] = s[item.id] || { number_of_times_in_orders: 0 };
      s[item.id].number_of_times_in_orders += 1;
      return s;
    }, {});

    // creating bulk payload
    const payload: any[] = [];
    Object.keys(product_stats).forEach((product) => {
      payload.push({
        update: { _id: product, _index: "storeproducts" },
      });
      payload.push({
        script: {
          source:
            "ctx._source.stats.number_of_times_in_orders += params.number_of_times_in_orders",
          lang: "painless",
          params: product_stats[product],
        },
      });
    });

    // executing bulk request
    if (payload.length) {
      const { body } = await elastic.bulk({
        refresh: "true",
        body: payload,
      });

      if (body.errors) {
        functions.logger.warn("Warning updating stats in store products");
        functions.logger.debug(body);
      } else {
        functions.logger.info(`${prefix} Stats were generated`);
      }
    } else {
      functions.logger.error("Nothing to update, hmm that is a posible bug");
    }
  });

export default {
  onOrderCreated,
};
