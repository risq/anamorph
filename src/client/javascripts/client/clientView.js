import $ from 'jquery';
import debug from 'debug';
import urlParse from 'url-parse';
import socket from 'socket.io-client';

import contentTpl from './client.html';

const dbg = debug('mirage:clientView');

export default class ClientView {
  constructor({url, socketUrl}) {
    dbg('initialize');
    this.id = this.getIdFromUrl(url);
    this.$els = {
      content: $('.content'),
    };
    this.status = `disconnected`;
    this.io = socket(socketUrl);

    this.io.on('state', this.onState.bind(this));
    this.io.on('disconnect', this.onDisconnect.bind(this));
    this.io.on('client:register:status', this.onClientRegisterStatus.bind(this));
    this.io.emit('client:register', {id: this.id});
  }

  onClientRegisterStatus({err}) {
    if (!err) {
      this.status = 'connected';
    } else {
      this.status = 'disconnected';
      this.err = err;
    }

    this.render();
  }

  onState(state) {
    dbg(state);
    this.state = state;
    this.render();
  }

  onDisconnect() {
    this.status = 'disconnected';
    this.render();
  }

  render() {
    this.$els.content.html(contentTpl.render({
      id: this.id,
      err: this.err,
      state: this.state,
    }));
  }

  getIdFromUrl(url) {
    const idTest = urlParse(window.location.href)
      .pathname
      .match(/\/client\/(1|2)/);

    return idTest ? idTest[1] : null;
  }
}
