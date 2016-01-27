import $ from 'jquery';
import debug from 'debug';
import urlParse from 'url-parse';
import socket from 'socket.io-client';
import {EventEmitter} from 'events';

import Facebook from '../facebook/facebook.js';

import contentTpl from './remote.html';

const dbg = debug('outsight:remoteView');

export default class DisplayView {
  constructor({url, $root}) {
    dbg('Initialize');

    this.$els = {
      content: $root.find('.content'),
      facebook: $root.find('.facebook'),
    };

    this.eventEmitter = new EventEmitter();

    this.status = `disconnected`;
    this.io = socket('http://localhost:8080');

    this.io.on('state', this.onState.bind(this));
    this.io.on('disconnect', this.onDisconnect.bind(this));
    this.io.on('display:register:status', this.onDisplayRegisterStatus.bind(this));

    this.uid = this.getUidFromUrl(url);
    if (this.uid) {
      this.io.emit('remote:register', {uid: this.uid});
    }

    Facebook.on('login:status', this.onLoginStatus.bind(this));
    Facebook.on('get:name', this.onGetName.bind(this));
  }

  onDisplayRegisterStatus({err, displayId}) {
    dbg('onDisplayRegisterStatus', err, displayId);
    if (!err) {
      this.displayId = displayId;
      this.status = `connected to display #${displayId}`;
      Facebook.init();
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

  hideFacebookLogin() {
    this.$els.facebook.hide();
  }

  getUidFromUrl(url) {
    const idTest = urlParse(window.location.href)
      .pathname
      .match(/\/remote\/(.*)/);

    return idTest ? idTest[1] : null;
  }

  onLoginStatus({err, res}) {
    if (!err) {
      dbg('onLoginStatus', res);
      this.io.emit('remote:auth', res);
    } else {
      this.err = err;
    }

    this.render();
  }

  onGetName({err, name}) {
    if (!err) {
      this.state.name = name;
      Facebook.getFeed();
    } else {
      this.err = err;
    }

    this.render();
  }

  on() {
    this.eventEmitter.on(...arguments);
  }
}
