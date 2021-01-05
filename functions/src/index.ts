import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import events from "./functions/events";
import notifications from "./functions/notifications";
import storeproducts from "./functions/store-products";

const prefix = "[beast functions]";
admin.initializeApp();

functions.logger.info(`${prefix} Current project`, process.env.FIREBASE_CONFIG);

exports.events = events;
exports.notifications = notifications;
exports.storeproducts = storeproducts;
