'use strict';
require('@babel/register')({ extensions: ['.js', '.mjs'] });
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const Player = require('./public/Player.mjs').default;
const Collectible = require('./public/Collectible.mjs').default;
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const app = express();
app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use(helmet.contentSecurityPolicy({ directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
  connectSrc: ["'self'", 'ws://localhost:' + (process.env.PORT || 3004), 'ws://127.0.0.1:' + (process.env.PORT || 3004)],
  objectSrc: ["'none'"], baseUri: ["'self'"], frameAncestors: ["'self'"]
} }));
app.use('/public', express.static(__dirname + '/public', { etag: false, maxAge: 0 }));
app.get('/public/socket.io.js', (req, res) => res.sendFile(require.resolve('socket.io-client/dist/socket.io.js')));
app.use(bodyParser.json({ limit: '16kb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '16kb' }));
app.use(cors({ origin: '*' }));
app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'));
// Preserve the starter helper files while exposing their intended data on modern Node.
app.get('/_api/app-info', (req, res) => {
  const headers = Object.fromEntries(Object.entries(res.getHeaders()).filter(([name]) => !/^access-control-/i.test(name)));
  delete headers['strict-transport-security'];
  res.json({ headers });
});
app.get('/_api/public/:file', (req, res, next) => {
  if (!['Player.mjs', 'Collectible.mjs'].includes(req.params.file)) return next();
  res.type('text').sendFile(__dirname + '/public/' + req.params.file);
});
fccTestingRoutes(app);
app.use((req, res) => res.status(404).type('text').send('Not Found'));
const server = app.listen(process.env.PORT || 3004, () => {
  console.log('Listening on port ' + server.address().port);
  if (process.env.NODE_ENV === 'test') setTimeout(() => runner.run(), 1500);
});
const io = socket(server, { serveClient: false, maxHttpBufferSize: 16384, pingTimeout: 10000 });
io.origins((origin, callback) => {
  if (!origin || origin === '*' || origin === '*:*') return callback(null, true);
  try {
    const url = new URL(origin);
    const allowed = ['localhost', '127.0.0.1'].includes(url.hostname) || /(^|\.)freecodecamp\.org$/.test(url.hostname) || origin === process.env.PUBLIC_ORIGIN;
    callback(allowed ? null : 'Origin not allowed', allowed);
  } catch (_) { callback('Invalid origin', false); }
});
const game = { players: new Map(), items: new Map(), width: 640, height: 480 };
const inputs = new Map();
function spawnItem() {
  let item;
  for (let attempt = 0; attempt < 100; attempt++) {
    item = new Collectible({ x: crypto.randomInt(12, 616), y: crypto.randomInt(12, 456), value: 1, id: crypto.randomUUID() });
    if (![...game.players.values()].some(player => Math.hypot(player.x - item.x, player.y - item.y) < 45)) break;
  }
  game.items.set(item.id, item);
}
for (let index = 0; index < 8; index++) spawnItem();
function snapshot() {
  return { players: [...game.players.values()], items: [...game.items.values()], width: game.width, height: game.height };
}
io.on('connection', client => {
  if (game.players.size >= 100) return client.disconnect(true);
  const player = new Player({ id: client.id, x: crypto.randomInt(20, 600), y: crypto.randomInt(20, 440), score: 0 });
  game.players.set(client.id, player);
  inputs.set(client.id, {});
  client.emit('welcome', { id: client.id });
  io.emit('state', snapshot());
  let windowStart = Date.now(), messages = 0;
  client.on('input', data => {
    if (Date.now() - windowStart >= 1000) { windowStart = Date.now(); messages = 0; }
    if (++messages > 90 || !data || typeof data !== 'object' || Array.isArray(data)) return;
    inputs.set(client.id, { up: data.up === true, down: data.down === true, left: data.left === true, right: data.right === true });
  });
  client.on('disconnect', () => {
    game.players.delete(client.id);
    inputs.delete(client.id);
    io.emit('state', snapshot());
  });
});
const tick = setInterval(() => {
  for (const player of game.players.values()) {
    const input = inputs.get(player.id) || {};
    const dx = Number(!!input.right) - Number(!!input.left);
    const dy = Number(!!input.down) - Number(!!input.up);
    const distance = 6 / (dx && dy ? Math.SQRT2 : 1);
    if (dx) player.movePlayer(dx > 0 ? 'right' : 'left', distance);
    if (dy) player.movePlayer(dy > 0 ? 'down' : 'up', distance);
    player.x = Math.max(0, Math.min(game.width - player.width, player.x));
    player.y = Math.max(0, Math.min(game.height - player.height, player.y));
    for (const item of game.items.values()) {
      if (player.collision(item)) {
        player.score += item.value;
        game.items.delete(item.id);
        spawnItem();
      }
    }
  }
  if (game.players.size) io.emit('state', snapshot());
}, 1000 / 30);
server.on('close', () => clearInterval(tick));
app.locals.httpServer = server;
app.locals.game = game;
app.locals.io = io;
module.exports = app;


