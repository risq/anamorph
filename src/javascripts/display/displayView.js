import $ from 'jquery';
import debug from 'debug';
import urlParse from 'url-parse';
import socket from 'socket.io-client';

import contentTpl from './display.html';

const dbg = debug('outsight:displayView');

export default class DisplayView {
  constructor(url) {
    dbg('initialize');
    this.id = this.getIdFromUrl(url);
    this.$els = {
      content: $('.content'),
    };
    this.status = `disconnected`;
    this.io = socket('http://localhost:8080');

    this.io.on('state', this.onState.bind(this));
    this.io.on('disconnect', this.onDisconnect.bind(this));
    this.io.on('display:register:status', this.onDisplayRegisterStatus.bind(this));
    this.io.emit('display:register', {id: this.id});
  }

  onDisplayRegisterStatus({err}) {
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
    this.state = state[`user${this.id}`];
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
      .match(/\/display\/(1|2)/);

    return idTest ? idTest[1] : null;
  }
}
