import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

import paymentProviders from './functions/payment-providers';
import dispatchProviders from './functions/dispatch-providers';
import beastStuff from './functions/beast-stuff';

const prefix = '[beast functions]';
admin.initializeApp();

functions.logger.info(`${prefix} Current project`, process.env.FIREBASE_CONFIG);

const app = express();
app.use(cors({ origin: true }));
app.use(express.urlencoded());
app.use(express.json());

app.use('/payment-providers', paymentProviders.router)

exports.beast = functions.https.onRequest(app);

exports.dispatchProviders = dispatchProviders.listeners;

exports.beastStuff = beastStuff;


