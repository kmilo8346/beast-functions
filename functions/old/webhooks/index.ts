import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";

import config from '../../lib/config';
import mercadopagoRoutes from './mercadopago'

const app = express();
app.use(cors({ origin: true }));
app.use(express.urlencoded());
app.use(express.json());

app.use('/mercadopago', mercadopagoRoutes)


exports.webhooks = functions.https.onRequest(app);
