import * as functions from "firebase-functions";

import elastic from "../../../lib/elastic";

const prefix = "[store product stats]";

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
      if (!(`items_${i}` in order)) {
        break;
      }

      const [id] = order[`items_${i}`].split("|");
      items.push(id);
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
      refresh: "true",
    });

    functions.logger.info(`${prefix} Stats were generated`);
  });

export default {
  onSendOrderMessage,
  onSendProductMessage,
};
