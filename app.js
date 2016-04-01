const path = require('path');
const express = require('express');
const shortid = require('shortid');
const dbg = require('debug')('anamorph:app');
const config = require('./config/config.json');

const socketManager = require('./src/server/socketManager');

const app = express();
const server = require('http').Server(app);

socketManager.init(server);

app.use(express.static('public'));

const port = process.env.PORT || config.server.port || 8080;

app.get('/config', (req, res) => res.json(config.client));
app.get('/remote(/*)?', (req, res) => res.sendFile(path.join(__dirname, './public', 'remote.html')));
app.get('/client/\\d+', (req, res) => res.sendFile(path.join(__dirname, './public', 'client.html')));

server.listen(port, () => {
  dbg(`Express server listening on port ${port}`);
});

exports = module.exports = app;
