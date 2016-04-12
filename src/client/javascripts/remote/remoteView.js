import $ from 'jquery';
import debug from 'debug';
import urlParse from 'url-parse';
import socket from 'socket.io-client';
import {EventEmitter} from 'events';

import Facebook from '../facebook/facebook.js';

import contentTpl from './remote.html';

const dbg = debug('anamorph:remoteView');

export default class RemoteView {
  constructor({url, socketUrl, $root}) {
    dbg('Initialize');

    this.$els = {
      content: $root.find('.content'),
      facebook: $root.find('.facebook'),
    };

    this.eventEmitter = new EventEmitter();

    this.status = `disconnected`;
    this.io = socket(socketUrl);

    this.io.on('state', this.onState.bind(this));
    this.io.on('disconnect', this.onDisconnect.bind(this));
    this.io.on('remote:register:status', this.onRemoteRegisterStatus.bind(this));

    this.syncId = this.getSyncFromUrl(url);

    if (this.syncId) {
      this.io.emit('remote:register', {syncId: this.syncId});
    }

    Facebook.on('login:status', this.onLoginStatus.bind(this));
    Facebook.on('get:name', this.onGetName.bind(this));
  }

  onRemoteRegisterStatus({err, id}) {
    dbg('onRemoteRegisterStatus', err, id);
    if (!err) {
      this.clientId = id;
      this.status = `connected to client #${id}`;
      Facebook.init();

      var accessToken    = window.location.href.substring(window.location.href.lastIndexOf( "?code=" )+6 );

      this.io.emit('remote:auth:instagram', accessToken);
    } else {
      this.status = 'disconnected';
      this.err = err;
    }

    this.render();
  }

  onState(state) {
    dbg(state);
    if (this.clientId) {
      this.state = state;
      this.render();
    }
  }

  onDisconnect() {
    this.status = 'disconnected';
    this.render();
  }

  render() {
    this.$els.content.html(contentTpl.render({
      err: this.err,
      state: this.state,
      clientId: this.clientId,
      rootUrl: window.location.origin
    }));
  }

  hideFacebookLogin() {
    this.$els.facebook.hide();
  }

  getSyncFromUrl(url) {
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
