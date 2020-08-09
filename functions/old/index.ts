import * as functions from 'firebase-functions';

import * as mercadopago from './functions/mercadopago';
import * as orders from './functions/orders';
import * as syncToFrontDB from './functions/sync-to-front-db';
import * as syncToBackendDB from './functions/sync-to-backend-db';

const prefix = '[beast functions]';

functions.logger.info(`${prefix} Current project`, process.env.FIREBASE_CONFIG);

exports.webhooks = mercadopago;
exports.orders = orders;
exports.syncToFrontDB = syncToFrontDB;
exports.syncToBackendDB = syncToBackendDB;



