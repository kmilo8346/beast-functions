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
      stats_ammount: number;
      stats_total: number;
      [x: string]: any; // items_${i} = '${id}|${price}|${qty}'
    };
    const items: string[] = [];
    let i = 0;
    while (true) {
      if (`items_${i}` in order) {
        const [id] = order[`items_${i}`].split("|");
        items.push(id);
        break;
      }
      i++;
    }

    functions.logger.info(
      `${prefix} Generating stats from send order message event`
    );

    // creating bulk payload
    const payload: any[] = [];
    items.forEach((id) => {
      payload.push({
        update: { _id: id, _index: "storeproducts" },
      });
      payload.push({
        script: {
          source: "ctx._source.stats.order_messages += 1",
          lang: "painless",
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

const onSendProductMessage = functions.analytics
  .event("send_product_message")
  .onLog(async (event) => {
    // TODO: removing debug code
    functions.logger.debug(`${prefix}`, event.params);

    const request = event.params as {
      store_id: string;
      store_name: string;
      product_id: string;
      product_name: string;
      product_price: string;
    };

    functions.logger.info(
      `${prefix} Generating stats from send product message event`
    );

    // executing request
    await elastic.update({
      index: "storeproducts",
      id: request.product_id,
      body: {
        script: {
          lang: "painless",
          source: "ctx._source.stats.product_messages += 1",
        },
      },
    });

    functions.logger.info(`${prefix} Stats were generated`);
  });

export default {
  onOrderCreated,
  onSendOrderMessage,
  onSendProductMessage,
};
