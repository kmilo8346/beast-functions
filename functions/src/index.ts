import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

import events from './functions/events';
import updates from './functions/updates';
import notifications from './functions/notifications';


const prefix = '[beast functions]';
admin.initializeApp();

functions.logger.info(`${prefix} Current project`, process.env.FIREBASE_CONFIG);

exports.events = events;
exports.updates = updates;
exports.notifications = notifications;




