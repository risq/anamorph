import debug from 'debug';

import DisplayView from './display/displayView';

const dbg = debug('outsight:display');

dbg('initialize');
const view = new DisplayView(window.location.href);
