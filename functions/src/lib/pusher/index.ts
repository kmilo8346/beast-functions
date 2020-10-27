import Pusher from 'pusher';

import config from '../config'

const pusher = new Pusher({
    appId: config.get('pusher.app_id'),
    key: config.get('pusher.key'),
    secret: config.get('pusher.secret'),
    cluster: config.get('pusher.cluster'),
    encrypted: config.getBoolean('pusher.encrypted'),
});

export default pusher;