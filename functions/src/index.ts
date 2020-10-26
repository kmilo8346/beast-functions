import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

import notifications from './functions/notifications';
import updates from './functions/updates';

const prefix = '[beast functions]';
admin.initializeApp();

functions.logger.info(`${prefix} Current project`, process.env.FIREBASE_CONFIG);

exports.notifications = notifications;

exports.updates = updates;


