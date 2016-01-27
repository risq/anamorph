const path = require('path');
const express = require('express');
const shortid = require('shortid');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
app.use(express.static('public'));

const port = process.env.PORT || 8080;

const clientConfig = {
  domain: 'localhost',
  port,
};

const state = {
  status: 'waitingDisplays',
  user1: {
    uid: shortid.generate(),
    display: {
      status: 'disconnected',
    },
    remote: {
      status: 'disconnected',
    },
  },
  user2: {
    uid: shortid.generate(),
    display: {
      status: 'disconnected',
    },
    remote: {
      status: 'disconnected',
    },
  },
};

app.get('/config', (req, res) => res.json(clientConfig));
app.get('/remote(/*)?', (req, res) => res.sendFile(path.join(__dirname, './public', 'remote.html')));
app.get('/display/1|2', (req, res) => res.sendFile(path.join(__dirname, './public', 'display.html')));

server.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

io.on('connection', socket => {
  console.log('connection');
  socket.emit('state', state);

  socket.on('display:register', data => registerDisplay(data.id, socket));
  socket.on('remote:register', data => registerRemote(data.uid, socket));
});

function registerDisplay(id, socket) {
  if (!displayIsConnected(id)) {
    console.log(`Registered display ${id}`);

    state[`user${id}`].display.status = `connected`,
    socket.on('disconnect', () => unregisterDisplay(id));
    socket.emit(`display:register:status`, {err: null});

    if (state.user1.display.status === 'connected' && state.user2.display.status === 'connected') {
      state.status = 'waitingUsers';
    }

  } else {
    socket.emit(`display:register:status`, {err: `Display ${id} already registered`});
  }

  emitState();
}

function unregisterDisplay(id) {
  console.log('Unregister display', id);
  state[`user${id}`].display.status = 'disconnected';
  state.status === 'waitingDisplays';
  unregisterRemote(id);
  emitState();
}

function registerRemote(uid, socket) {
  const displayId = getDisplayIdFromUid(uid);

  if (displayIsConnected(displayId)) {
    if (!remoteIsConnected(displayId)) {
      console.log(`Registered remote to display ${displayId}`);

      state[`user${displayId}`].remote.status = `connected`,
      socket.on('disconnect', () => unregisterRemote(displayId));
      socket.on('remote:auth', (authResponse) => onUserAuth(displayId, authResponse));
      socket.emit(`display:register:status`, {err: null, displayId});

    } else {
      socket.emit(`display:register:status`, {err: `Remote already registered for display ${displayId}`});
    }
  } else {
    socket.emit(`display:register:status`, {err: `Cannot find display ${displayId}`});
  }

  emitState();
}

function unregisterRemote(displayId) {
  console.log('Unregister remote for display', displayId);
  state[`user${displayId}`].remote.status = 'disconnected';
  emitState();
}

function getDisplayIdFromUid(uid) {
  return uid === state.user1.uid ? 1 :
    uid === state.user2.uid ? 2 : null;
}

function displayIsConnected(displayId) {
  return state[`user${displayId}`] &&
    state[`user${displayId}`].display.status === `connected`;
}

function remoteIsConnected(displayId) {
  return state[`user${displayId}`] &&
    state[`user${displayId}`].remote.status === `connected`;
}

function onUserAuth(displayId, authResponse) {
  console.log('onUserAuth', displayId, authResponse);
}

function emitState() {
  io.sockets.emit('state', state);
}

exports = module.exports = app;
