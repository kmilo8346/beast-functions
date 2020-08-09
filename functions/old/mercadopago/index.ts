import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { PubSub } from '@google-cloud/pubsub';

import config from '../../lib/config';

const app = express();
app.use(cors({ origin: true }));
app.use(express.urlencoded());
app.use(express.json());

const pubSubClient = new PubSub();

app.post("/", async (req, res) => {
  const prefix = "[mercado pago webhooks]";
  try {
    const data = req.body;
    let event = '';

    switch(req.body.type) {
        case "payment":
            if (data.action === 'payment.created' || data.action === 'payment.updated') {
                event = 'payment.updated';
            }
            if (!event) {
                functions.logger.warn(`${prefix} Webhook action not mapped, action: ${req.body.action}`);
                break;
            }
            break;
        case "mp-connect":
            // TODO: implement
            break;
        default:
            functions.logger.warn(`${prefix} Webhook type not mapped, type: ${req.body.type}`);
            break;
    }
    if (event) {
        const topic = `${config.get('google_pub_sub.topic_prefix')}${event}`
        functions.logger.info(`${prefix} Emitting ${event}`);
        const messageId = await pubSubClient
            .topic(topic)
            .publish(Buffer.from(JSON.stringify(req.body)), {
                id: req.body.data.id,
                time: new Date(data.date_created).toISOString(),
                source: 'beast-functions',
            });
        functions.logger.info(`${prefix} Event ${event} was emitted correctly, message id: ${messageId}`);
    }

    res.json({status: 'OK'});
  } catch (error) {
    functions.logger.debug(req.body);
    functions.logger.error(error);
    functions.logger.error(`${prefix} Unexpected error listening mercado pago webhooks`);
    
    res.status(500).json({
      message: error.message,
    });
  }
});

exports.webhooks = functions.https.onRequest(app);
