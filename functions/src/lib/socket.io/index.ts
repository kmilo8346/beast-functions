import io from 'socket.io-client';
import * as functions from 'firebase-functions';

import config from '../config';

const prefix = '[socket client]';
const server = config.get('socket.server');
const socket = io(server);

functions.logger.info(`${prefix} Module         : Socket io client`);
functions.logger.info(`${prefix} Server         : ${server}`);
functions.logger.info('');

export default socket;
