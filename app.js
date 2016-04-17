const path = require('path');
const express = require('express');
const dbg = require('debug')('anamorph:app');
const config = require('./config/config.json');

const socketManager = require('./src/server/socketManager');
const clientManager = require('./src/server/clientManager');

const app = express();
const server = require('http').Server(app);

socketManager.init(server);

app.use(express.static('public'));

const port = process.env.PORT || config.server.port || 8080;

app.get('/config', (req, res) => res.json(config.client));

app.get('/remote(/*)?', (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'remote.html'));
});

app.get('/client/\\d+', (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'client.html'));
});

app.get('/insta', (req, res) => {
  clientManager.getClient(req.query.clientId)
    .onInstagramAuthResponse(req.query.code);
});

app.get('/twitter', (req, res) => {
  clientManager.getClient(req.query.clientId)
    .onTwitterAuthResponse(req.query.oauth_verifier);
});

app.get('/linkedin', (req, res) => {
   clientManager.getClient(req.query.clientId)
    .onLinkedinAuthResponse(req.query.code, req.query.state);
});

server.listen(port, () => {
  dbg(`Express server listening on port ${port}`);
});

exports = module.exports = app;
