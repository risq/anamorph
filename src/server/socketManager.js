'use strict';
const socketio = require('socket.io');
const dbg = require('debug')('anamorph:socketManager');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));

const clientManager = require('./clientManager');
const stateManager = require('./stateManager');

module.exports = new class SocketManager {
  constructor() {
    clientManager.events.on('state:change', client => this.emitState(client));
  }

  init(server) {
    dbg('Initialize SocketManager');
    this.io = socketio(server);
    this.io.on('connection', this.onConnection.bind(this));
  }

  onConnection(socket) {
    dbg('Connection');
    socket.on('disconnect', () => dbg('socket disconnected'));
    socket.on('client:register', data => clientManager.registerClient(data.id, socket));
    socket.on('remote:register', data => clientManager.registerRemote(data.syncId, socket));
    socket.on('samples:get', () => this.emitSamples(socket));
  }

  emitState(client) {
    stateManager.getState(client.id)
      .then(state => {
        if (client.isRegistered()) {
          client.socket.emit('state', state);

          if (client.remoteIsRegistered()) {
            client.remoteSocket.emit('state', state);
          }
        }
      });
  }

  emitSamples(socket) {
    dbg('Emitting samples');
    Bluebird.props({
      sample1: fs.readFileAsync('samples/sample1.json', 'utf8'),
      sample2: fs.readFileAsync('samples/sample2.json', 'utf8'),
      sample3: fs.readFileAsync('samples/sample3.json', 'utf8'),
    }).then((samples) => {
      socket.emit('samples', {
        sample1: JSON.parse(samples.sample1),
        sample2: JSON.parse(samples.sample2),
        sample3: JSON.parse(samples.sample3),
      });
    }).catch(err => {
      dbg('Error reading file', err);
    });
  }
};
