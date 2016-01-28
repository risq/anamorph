import debug from 'debug';
import $ from 'jquery';

import ClientView from './client/clientView';

const dbg = debug('mirage:client');

dbg('initialize');

$.getJSON(`/config`, config => {
  const view = new ClientView({
    url: window.location.href,
    socketUrl: `http://${config.domain}:${config.port}`,
  });
});
