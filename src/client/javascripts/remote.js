import debug from 'debug';
import $ from 'jquery';

import Facebook from './facebook/facebook.js';
import Instagram from './instagram/instagram.js';
import RemoteView from './remote/remoteView';

const dbg = debug('anamorph:remote');

dbg('initialize');

$.getJSON(`/config`, config => {
  Facebook.setAppId(config.fbAppId);
  Instagram.setClientId(config.igClientId);
  Instagram.setClientSecret(config.igClientSecret);

  const view = new RemoteView({
    $root: $('.main'),
    url: window.location.href,
    socketUrl: `http://${config.socket.domain}:${config.socket.port}`,
  });
});
