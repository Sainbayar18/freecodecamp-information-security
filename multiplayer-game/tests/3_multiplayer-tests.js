const assert = require('chai').assert;
const connect = require('socket.io-client');
const app = require('../server');
const Collectible = require('../public/Collectible.mjs').default;
function nextState(client, predicate) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { client.off('state', listener); reject(new Error('State update timed out')); }, 5000);
    const listener = state => {
      if (predicate(state)) { clearTimeout(timeout); client.off('state', listener); resolve(state); }
    };
    client.on('state', listener);
  });
}
function open(client) {
  return new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
    client.connect();
  });
}
suite('Functional Tests - Multiplayer integration', function() {
  this.timeout(10000);
  let first, second, originalItems;
  suiteSetup(async function() {
    originalItems = new Map(app.locals.game.items);
    const url = 'http://127.0.0.1:' + app.locals.httpServer.address().port;
    const options = { autoConnect: false, forceNew: true, reconnection: false, transports: ['websocket'], forceNode: true };
    first = connect(url, options); second = connect(url, options);
    await Promise.all([open(first), open(second)]);
  });
  suiteTeardown(function() { first.close(); second.close(); app.locals.game.items.clear(); for (const [id, item] of originalItems) app.locals.game.items.set(id, item); });
  test('Two clients receive the same players and collectibles', async function() {
    const state = await nextState(first, s => s.players.some(p => p.id === first.id) && s.players.some(p => p.id === second.id));
    const other = await nextState(second, s => s.players.length === state.players.length);
    assert.deepEqual(state.players.map(p => p.id).sort(), other.players.map(p => p.id).sort());
    assert.isAtLeast(state.items.length, 1);
    assert.notEqual(first.id, second.id);
  });
  test('Server validates movement and ignores forged coordinates and score', async function() {
    const player = app.locals.game.players.get(first.id);
    player.x = 100; player.y = 100;
    first.emit('input', { right: true, x: 999999, y: -999, score: 999999 });
    const state = await nextState(first, s => s.players.find(p => p.id === first.id).x > 106);
    first.emit('input', {});
    const moved = state.players.find(p => p.id === first.id);
    assert.isAbove(moved.x, 100);
    assert.isAtMost(moved.x, 620);
    assert.equal(moved.y, 100);
    assert.isBelow(moved.score, 999999);
    const other = await nextState(second, s => s.players.find(p => p.id === first.id).x >= moved.x);
    assert.isAtMost(other.players.find(p => p.id === first.id).x, 620);
  });
  test('A shared collectible awards points once and respawns with a new ID', async function() {
    first.emit('input', {}); second.emit('input', {});
    await nextState(first, () => true);
    const game = app.locals.game;
    for (const client of [first, second]) { const player = game.players.get(client.id); player.x = 100; player.y = 100; player.score = 0; }
    game.items.clear();
    game.items.set('shared-test-gem', new Collectible({ id: 'shared-test-gem', x: 100, y: 100, value: 1 }));
    const state = await nextState(first, s => s.players.filter(p => [first.id, second.id].includes(p.id)).reduce((sum, p) => sum + p.score, 0) >= 1);
    assert.equal(state.players.filter(p => [first.id, second.id].includes(p.id)).reduce((sum, p) => sum + p.score, 0), 1);
    assert.isFalse(state.items.some(item => item.id === 'shared-test-gem'));
    assert.lengthOf(state.items, 1);
  });
  test('Disconnected players disappear and may reconnect with a new avatar', async function() {
    const oldId = second.id;
    second.disconnect();
    const state = await nextState(first, s => !s.players.some(p => p.id === oldId));
    assert.isFalse(state.players.some(p => p.id === oldId));
    await open(second);
    assert.notEqual(second.id, oldId);
    const rejoined = await nextState(first, s => s.players.some(p => p.id === second.id));
    assert.equal(rejoined.players.find(p => p.id === second.id).score, 0);
  });
});


