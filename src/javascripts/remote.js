import debug from 'debug';

import RemoteView from './remote/remoteView';

const dbg = debug('outsight:remote');

dbg('initialize');
const view = new RemoteView(window.location.href);
