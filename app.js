const path = require('path');
const express = require('express');
const qr = require('qr-image');
const ip = require('ip');
const dbg = require('debug')('anamorph:app');
const config = require('./config/config');

const socketManager = require('./src/server/socketManager');
const clientManager = require('./src/server/clientManager');

const app = express();
const server = require('http').Server(app);

socketManager.init(server);

app.use(express.static('public'));

const port = process.env.PORT || config.server.port || 8080;

app.get('/config', (req, res) => res.json(config.server));

app.get('/remote(/*)?', (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'remote.html'));
});

app.get('/client/\\d+', (req, res) => {
  res.sendFile(path.join(__dirname, './public', 'client.html'));
});

app.get('/facebook', (req, res) => {
    clientManager.getClient(req.query.clientId)
        .onFacebookAuthResponse(req.query.code);
    res.sendFile(path.join(__dirname, './public', 'close.html'));
});

app.get('/insta', (req, res) => {
  clientManager.getClient(req.query.clientId)
    .onInstagramAuthResponse(req.query.code);
    res.sendFile(path.join(__dirname, './public', 'close.html'));
});

app.get('/twitter', (req, res) => {
  clientManager.getClient(req.query.clientId)
    .onTwitterAuthResponse(req.query.oauth_verifier);
    res.sendFile(path.join(__dirname, './public', 'close.html'));
});

app.get('/linkedin', (req, res) => {
   clientManager.getClient(req.query.clientId)
    .onLinkedinAuthResponse(req.query.code, req.query.state);
    res.sendFile(path.join(__dirname, './public', 'close.html'));
});

app.get('/validConnections', (req, res) => {
    clientManager.getClient(req.query.clientId)
        .onValidateConnections();
});

app.get('/qr/:id', function(req, res) {
  const syncId = clientManager.getClientSyncId(req.params.id);

  if (!syncId) {
    // res.status(404).end();
    qr.image(`http://${config.server.url}/remote/84FE7`, {
      size: 24,
    }).pipe(res);
  } else {
    res.type('png');
    qr.image(`http://${config.server.url}/remote/${syncId}`, {
      size: 24,
    }).pipe(res);
  }
});


server.listen(port, () => {
  dbg(`Express server listening on port ${port}`);
});

exports = module.exports = app;
