import * as functions from "firebase-functions";

import elastic from "../../../lib/elastic";

const prefix = "[notification stats]";

const onNotificationOpen = functions.analytics
  .event("notification_open")
  .onLog(async (event) => {
    const data = event.params as {
      notification_id: string;
    };
    functions.logger.info(
      `${prefix} Generating notification stats 🧑‍🏫 for on notification open`
    );
    // executing request
    await elastic.update({
      index: "notifications",
      id: data.notification_id,
      body: {
        script: {
          lang: "painless",
          source: "ctx._source.stats.notification_open += 1",
        },
      },
    });
    functions.logger.info(`${prefix} Stats were generated 😊`);
  });

const onSendOrderMessage = functions.analytics
  .event("send_order_message")
  .onLog(async (event) => {
    const data = event.params as {
      store_id: string;
      store_name: string;
      stats_ammount: number;
      stats_total: number;
      notification_id?: string;
      [x: string]: any; // items_${i} = '${id}|${price}|${qty}'
    };
    functions.logger.info(
      `${prefix} Generating notification stats 🧑‍🏫 for on send order message`
    );

    // precondition
    if (!data.notification_id) {
      functions.logger.info(
        `${prefix} Event cant be processed, dont have a notification attribution`
      );
      return;
    }

    // executing request
    await elastic.update({
      index: "notifications",
      id: data.notification_id,
      body: {
        script: {
          lang: "painless",
          source: "ctx._source.stats.send_order_message += 1",
        },
      },
    });
    functions.logger.info(`${prefix} Stats were generated 😊`);
  });

const onSendProductMessage = functions.analytics
  .event("send_product_message")
  .onLog(async (event) => {
    const data = event.params as {
      store_id: string;
      store_name: string;
      product_id: string;
      product_name: string;
      product_price: string;
      notification_id?: string;
    };
    functions.logger.info(
      `${prefix} Generating notification stats 🧑‍🏫 for on send product message`
    );

    // precondition
    if (!data.notification_id) {
      functions.logger.info(
        `${prefix} Event cant be processed, dont have a notification attribution`
      );
      return;
    }

    // executing request
    await elastic.update({
      index: "notifications",
      id: data.notification_id,
      body: {
        script: {
          lang: "painless",
          source: "ctx._source.stats.send_product_message += 1",
        },
      },
    });
    functions.logger.info(`${prefix} Stats were generated 😊`);
  });

const onSendStoreQuestionMessage = functions.analytics
  .event("send_store_question_message")
  .onLog(async (event) => {
    const data = event.params as {
      store_id: string;
      store_name: string;
      notification_id?: string;
    };
    functions.logger.info(
      `${prefix} Generating notification stats 🧑‍🏫 for on send store question message`
    );

    // precondition
    if (!data.notification_id) {
      functions.logger.info(
        `${prefix} Event cant be processed, dont have a notification attribution`
      );
      return;
    }

    // executing request
    await elastic.update({
      index: "notifications",
      id: data.notification_id,
      body: {
        script: {
          lang: "painless",
          source: "ctx._source.stats.send_store_question_message += 1",
        },
      },
    });
    functions.logger.info(`${prefix} Stats were generated 😊`);
  });

// faltan 2

export default {
  onNotificationOpen,
  onSendOrderMessage,
  onSendProductMessage,
  onSendStoreQuestionMessage,
};
