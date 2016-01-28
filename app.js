const path = require('path');
const express = require('express');
const shortid = require('shortid');
const dbg = require('debug')('mirage:app');

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
  dbg(`Express server listening on port ${port}`);
});

exports = module.exports = app;
