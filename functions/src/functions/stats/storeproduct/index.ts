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
    }>((ps, item) => {
      const s = { ...ps };
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

const onSendOrderMessage = functions.analytics
  .event("send_order_message")
  .onLog(async (event) => {
    const order = event.params as {
      store_id: string;
      store_name: string;
      products: {
        id: string;
        name: string;
        price: number;
        qty: number;
      }[];
      stats_ammount: number;
      stats_total: number;
    };

    functions.logger.info(
      `${prefix} Generating stats from send order message event`
    );
    functions.logger.info(order);

    // // creating bulk payload
    // const payload: any[] = [];
    // order.products.forEach((p) => {
    //   payload.push({
    //     update: { _id: p.id, _index: "storeproducts" },
    //   });
    //   payload.push({
    //     script: {
    //       source: "ctx._source.stats.order_messages += 1",
    //       lang: "painless",
    //     },
    //   });
    // });

    // // executing bulk request
    // if (payload.length) {
    //   const { body } = await elastic.bulk({
    //     refresh: "true",
    //     body: payload,
    //   });

    //   if (body.errors) {
    //     functions.logger.warn("Warning updating stats in store products");
    //     functions.logger.debug(body);
    //   } else {
    //     functions.logger.info(`${prefix} Stats were generated`);
    //   }
    // } else {
    //   functions.logger.error("Nothing to update, hmm that is a posible bug");
    // }
  });

export default {
  onOrderCreated,
  onSendOrderMessage,
};
