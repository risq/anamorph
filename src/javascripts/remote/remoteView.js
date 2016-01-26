import $ from 'jquery';
import debug from 'debug';
import urlParse from 'url-parse';
import socket from 'socket.io-client';

import contentTpl from './remote.html';

const dbg = debug('outsight:remoteView');

export default class DisplayView {
  constructor(url) {
    dbg('initialize');
    this.$els = {
      content: $('.content'),
    };
    this.status = `disconnected`;
    this.io = socket('http://localhost:8080');

    this.io.on('state', this.onState.bind(this));
    this.io.on('disconnect', this.onDisconnect.bind(this));
    this.io.on('display:register:status', this.onDisplayRegisterStatus.bind(this));

    this.uid = this.getUidFromUrl(url);
    if (this.uid) {
      this.io.emit('remote:register', {uid: this.uid});
    }
  }

  onDisplayRegisterStatus({err, displayId}) {
    dbg('onDisplayRegisterStatus', err, displayId);
    if (!err) {
      this.displayId = displayId;
      this.status = `connected to display #${displayId}`;
    } else {
      this.status = 'disconnected';
      this.err = err;
    }

    this.render();
  }

  onState(state) {
    dbg(state);
    if (this.displayId) {
      this.state = state[`user${this.displayId}`];
      this.render();
    }
  }

  onDisconnect() {
    this.status = 'disconnected';
    this.render();
  }

  render() {
    this.$els.content.html(contentTpl.render({
      uid: this.uid,
      err: this.err,
      state: this.state,
    }));
  }

  getUidFromUrl(url) {
    const idTest = urlParse(window.location.href)
      .pathname
      .match(/\/remote\/(.*)/);

    return idTest ? idTest[1] : null;
  }
}
