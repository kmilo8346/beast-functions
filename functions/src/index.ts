import * as functions from 'firebase-functions';
import express from "express";
import cors from "cors";

import paymentProviders from './functions/payment-providers';
import dispatchProviders from './functions/dispatch-providers';
import syncToBackend from './functions/sync-to-backend';
import syncToFrontend from './functions/sync-to-frontend';

const prefix = '[beast functions]';

functions.logger.info(`${prefix} Current project`, process.env.FIREBASE_CONFIG);

const app = express();
app.use(cors({ origin: true }));
app.use(express.urlencoded());
app.use(express.json());

app.use('/payment-providers', paymentProviders.router)

exports.api = functions.https.onRequest(app);

exports.dispatchProviders = dispatchProviders.listeners;

exports.syncToBackend = syncToBackend.listeners;

exports.syncToFrontend = syncToFrontend.listeners;


