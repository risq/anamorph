import $ from 'jquery';
import debug from 'debug';
import urlParse from 'url-parse';
import socket from 'socket.io-client';
import {EventEmitter} from 'events';

import contentTpl from './remote.html';

const dbg = debug('anamorph:remoteView');

export default class RemoteView {
  constructor({url, socketUrl, $root}) {
    dbg('Initialize');

    this.$els = {
      content: $root.find('.content'),
      facebook: $root.find('.facebook'),
      twitter: $root.find('.twitter'),
    };

    $root.on('click', '.network', (e) => {
      $(e.currentTarget).addClass('check');
      $root.find('.valid-container').show();

    });
    $root.on('click', '.valid-connections', () => {
        $root.find('.valid-container').hide();
        $root.find('.networks').hide();
        $root.find('.connect-description').hide();
        $root.find('.creating').show();
    });

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
  }

  onRemoteRegisterStatus({err, id}) {
    dbg('onRemoteRegisterStatus', err, id);
    if (!err) {
      this.clientId = id;
      this.status = `connected to client #${id}`;
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

  getSyncFromUrl(url) {
    const idTest = urlParse(window.location.href)
      .pathname
      .match(/\/remote\/(.*)/);

    return idTest ? idTest[1] : null;
  }

  on() {
    this.eventEmitter.on(...arguments);
  }
}
