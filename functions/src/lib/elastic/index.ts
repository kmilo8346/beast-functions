import * as functions from 'firebase-functions';
import { Client, ClientOptions } from '@elastic/elasticsearch';

import config from '../config';

const prefix = '[elastic client]';

const clientOptions: ClientOptions = {
  node: config.get('elastic.node'),
};
const username = config.get('elastic.username');
const password = config.get('elastic.password');
const withBasicAuth = username && password;
if (withBasicAuth) {
  clientOptions.auth = { username, password };
}


functions.logger.info(`${prefix} Creating elastic client`);
functions.logger.info(`${prefix} Elastic Node: ${clientOptions.node}`);
if (withBasicAuth) {
    functions.logger.info(`${prefix} Elastic Basic Auth: ${username} *******`);
}
functions.logger.info('');

export default new Client(clientOptions);
