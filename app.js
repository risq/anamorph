const path = require('path');
const express = require('express');
const shortid = require('shortid');

const socketManager = require('./src/server/socketManager');

const app = express();
const server = require('http').Server(app);

socketManager.init(server);

app.use(express.static('public'));

const port = process.env.PORT || 8080;

const clientConfig = {
  domain: 'localhost',
  port,
};

const state = {
  status: 'waitingClients',
  client1: {
    syncId: shortid.generate(),
    client: {
      status: 'disconnected',
    },
    remote: {
      status: 'disconnected',
    },
  },
  client2: {
    syncId: shortid.generate(),
    client: {
      status: 'disconnected',
    },
    remote: {
      status: 'disconnected',
    },
  },
};

app.get('/config', (req, res) => res.json(clientConfig));
app.get('/remote(/*)?', (req, res) => res.sendFile(path.join(__dirname, './public', 'remote.html')));
app.get('/client/1|2', (req, res) => res.sendFile(path.join(__dirname, './public', 'client.html')));

server.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

function registerClient(id, socket) {
  if (!clientIsConnected(id)) {
    console.log(`Registered client ${id}`);

    state[`client${id}`].client.status = `connected`,
    socket.on('disconnect', () => unregisterClient(id));
    socket.emit(`client:register:status`, {err: null});

    if (state.client1.client.status === 'connected' && state.client2.client.status === 'connected') {
      state.status = 'waitingUsers';
    }

  } else {
    socket.emit(`client:register:status`, {err: `Client ${id} already registered`});
  }

  emitState();
}

function unregisterClient(id) {
  console.log('Unregister client', id);
  state[`client${id}`].client.status = 'disconnected';
  state.status === 'waitingClients';
  unregisterRemote(id);
  emitState();
}

function registerRemote(syncId, socket) {
  const clientId = getClientIdFromUid(syncId);

  if (clientIsConnected(clientId)) {
    if (!remoteIsConnected(clientId)) {
      console.log(`Registered remote to client ${clientId}`);

      state[`client${clientId}`].remote.status = `connected`,
      socket.on('disconnect', () => unregisterRemote(clientId));
      socket.on('remote:auth', (authResponse) => onUserAuth(clientId, authResponse));
      socket.emit(`client:register:status`, {err: null, clientId});

    } else {
      socket.emit(`client:register:status`, {err: `Remote already registered for client ${clientId}`});
    }
  } else {
    socket.emit(`client:register:status`, {err: `Cannot find client ${clientId}`});
  }

  emitState();
}

function unregisterRemote(clientId) {
  console.log('Unregister remote for client', clientId);
  state[`client${clientId}`].remote.status = 'disconnected';
  emitState();
}

function getClientIdFromUid(syncId) {
  return syncId === state.client1.syncId ? 1 :
    syncId === state.client2.syncId ? 2 : null;
}

function clientIsConnected(clientId) {
  return state[`client${clientId}`] &&
    state[`client${clientId}`].client.status === `connected`;
}

function remoteIsConnected(clientId) {
  return state[`client${clientId}`] &&
    state[`client${clientId}`].remote.status === `connected`;
}

function onUserAuth(clientId, authResponse) {
  console.log('onUserAuth', clientId, authResponse);
}

function emitState() {
  io.sockets.emit('state', state);
}

exports = module.exports = app;
