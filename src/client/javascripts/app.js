import socket from 'socket.io-client';
import $ from 'jquery';
import stateTemplate from '../html/shared/state.html';

const io = socket('http://localhost:8080');
const $state = $('.content');

io.on('state', state => {
  $state.html(stateTemplate.render({state}));
});
