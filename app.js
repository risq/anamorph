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
  global: 'waitingDisplays',
  user1: {
    display: 'disconnected',
  },
  user2: {
    display: 'disconnected',
  },
};

app.get('/config', (req, res) => res.json(clientConfig));
app.get('/remote', (req, res) => res.sendFile(path.join(__dirname, './public', 'remote.html')));
app.get('/display/1|2', (req, res) => res.sendFile(path.join(__dirname, './public', 'display.html')));

server.listen(port, function() {
  console.log(`Express server listening on port ${port}`);
});

io.on('connection', socket => {
  console.log('connection');
  socket.emit('state', state);

  socket.on('display:register', data => registerDisplay(data.id, socket));
});

function registerDisplay(id, socket) {
  if (state[`user${id}`].display !== `connected`) {
    console.log(`Registered display ${id}`);

    state[`user${id}`].display = `connected`,
    socket.on('disconnect', () => unregisterDisplay(id));
    socket.emit(`display:register:status`, {err: null});

    console.log(state.user1.display, state.user2.display);
    if (state.user1.display === 'connected' && state.user2.display === 'connected') {
      state.global = 'waitingUsers';
    }

    emitState();

  } else {
    console.log(`Display ${id} already registered`);
    socket.emit(`display:register:status`, {err: `Display ${id} already registered`});
  }
}

function unregisterDisplay(id) {
  console.log('unregister display', id);
  state[`user${id}`].display = 'disconnected';
  state.global === 'waitingDisplays';
  emitState();
}

function emitState() {
  io.sockets.emit('state', state);
}

exports = module.exports = app;
