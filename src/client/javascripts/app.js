import socket from 'socket.io-client';
import $ from 'jquery';
import debug from 'debug';

import stateTemplate from '../html/shared/state.html';

const dbg = debug('anamorph:app');
const $state = $('.content');

$.getJSON(`/config`, config => {
  dbg(config);
  const io = socket(`http://${config.socket.domain}:${config.socket.port}`);

  io.on('state', state => {
    $state.html(stateTemplate.render({state}));
  });
});
