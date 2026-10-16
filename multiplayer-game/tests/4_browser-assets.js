const chai = require('chai');
const assert = chai.assert;
chai.use(require('chai-http'));
const app = require('../server');
suite('Functional Tests - Browser assets', function() {
  test('Socket.io client script is reachable as JavaScript without caching', async function() {
    const res = await chai.request(app).get('/public/socket.io.js');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /javascript/);
    assert.isAbove(Number(res.headers['content-length']), 1000);
    assert.include(res.headers['cache-control'], 'no-store');
  });
  test('Browser game module is served with JavaScript MIME type', async function() {
    const res = await chai.request(app).get('/public/game.mjs');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /javascript/);
    assert.include(res.headers['cache-control'], 'no-store');
  });
});

