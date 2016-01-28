import debug from 'debug';

import ClientView from './client/clientView';

const dbg = debug('mirage:client');

dbg('initialize');
const view = new ClientView(window.location.href);
