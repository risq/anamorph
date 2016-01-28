import debug from 'debug';
import $ from 'jquery';

import RemoteView from './remote/remoteView';

const dbg = debug('mirage:remote');

dbg('initialize');

$.getJSON(`/config`, config => {
  const view = new RemoteView({
    $root: $('.main'),
    url: window.location.href,
    socketUrl: `http://${config.domain}:${config.port}`,
  });
});
