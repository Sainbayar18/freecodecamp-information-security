const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
chai.use(chaiHttp);
suite('Functional Tests', function() {
  this.timeout(20000);
  const board = 'test-' + Date.now();
  const endpoint = '/api/threads/' + board;
  const replies = '/api/replies/' + board;
  let threadId, replyId;
  test('Creating a new thread: POST /api/threads/{board}', async function() {
    const res = await chai.request(server).post(endpoint).send({ text: '<script>alert(1)</script>', delete_password: 'thread-password' });
    assert.equal(res.status, 200);
    assert.isString(res.body._id);
    assert.equal(res.body.created_on, res.body.bumped_on);
    assert.notProperty(res.body, 'delete_password');
    threadId = res.body._id;
  });
  test('Viewing the 10 most recent threads with 3 replies each: GET /api/threads/{board}', async function() {
    for (let i = 0; i < 11; i++) await chai.request(server).post(endpoint).send({ text: 'thread ' + i, delete_password: 'test' });
    for (let i = 0; i < 4; i++) await chai.request(server).post(replies).send({ thread_id: threadId, text: 'reply ' + i, delete_password: 'test' });
    const res = await chai.request(server).get(endpoint);
    assert.equal(res.status, 200);
    assert.lengthOf(res.body, 10);
    assert.equal(res.body[0]._id, threadId);
    assert.lengthOf(res.body[0].replies, 3);
    assert.equal(res.body[0].replycount, 4);
    assert.equal(res.body[0].replies[0].text, 'reply 1');
    assert.notProperty(res.body[0], 'reported');
    assert.notProperty(res.body[0], 'delete_password');
    assert.notProperty(res.body[0].replies[0], 'delete_password');
    assert.notProperty(res.body[0].replies[0], 'reported');
  });
  test('Deleting a thread with the incorrect password: DELETE /api/threads/{board}', async function() {
    const res = await chai.request(server).delete(endpoint).send({ thread_id: threadId, delete_password: 'wrong' });
    assert.equal(res.text, 'incorrect password');
    const existing = await chai.request(server).get(replies).query({ thread_id: threadId });
    assert.equal(existing.status, 200);
  });
  test('Deleting a thread with the correct password: DELETE /api/threads/{board}', async function() {
    const created = await chai.request(server).post(endpoint).send({ text: 'Delete this test thread', delete_password: 'correct' });
    const res = await chai.request(server).delete(endpoint).send({ thread_id: created.body._id, delete_password: 'correct' });
    assert.equal(res.text, 'success');
    const missing = await chai.request(server).get(replies).query({ thread_id: created.body._id }).catch(err => err.response);
    assert.equal(missing.status, 404);
  });
  test('Reporting a thread: PUT /api/threads/{board}', async function() {
    const res = await chai.request(server).put(endpoint).send({ thread_id: threadId });
    assert.equal(res.text, 'reported');
    const stored = require('fs').readFileSync(require('path').resolve('.data/boards.json'), 'utf8');
    const record = JSON.parse(stored).boards.find(b => b.name === board).threads.find(t => t._id === threadId);
    assert.isTrue(record.reported);
    assert.notEqual(record.delete_password, 'thread-password');
  });
  test('Creating a new reply: POST /api/replies/{board}', async function() {
    const before = await chai.request(server).get(replies).query({ thread_id: threadId });
    const res = await chai.request(server).post(replies).send({ thread_id: threadId, text: 'A new reply', delete_password: 'reply-password' });
    assert.equal(res.status, 200);
    replyId = res.body._id;
    assert.isString(replyId);
    const after = await chai.request(server).get(replies).query({ thread_id: threadId });
    assert.isAtLeast(Date.parse(after.body.bumped_on), Date.parse(before.body.bumped_on));
    assert.equal(after.body.bumped_on, res.body.created_on);
  });
  test('Viewing a single thread with all replies: GET /api/replies/{board}', async function() {
    const res = await chai.request(server).get(replies).query({ thread_id: threadId });
    assert.equal(res.status, 200);
    assert.equal(res.body._id, threadId);
    assert.lengthOf(res.body.replies, 5);
    assert.notProperty(res.body, 'reported');
    assert.notProperty(res.body, 'delete_password');
    res.body.replies.forEach(r => { assert.notProperty(r, 'reported'); assert.notProperty(r, 'delete_password'); });
  });
  test('Deleting a reply with the incorrect password: DELETE /api/replies/{board}', async function() {
    const res = await chai.request(server).delete(replies).send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong' });
    assert.equal(res.text, 'incorrect password');
  });
  test('Deleting a reply with the correct password: DELETE /api/replies/{board}', async function() {
    const res = await chai.request(server).delete(replies).send({ thread_id: threadId, reply_id: replyId, delete_password: 'reply-password' });
    assert.equal(res.text, 'success');
    const thread = await chai.request(server).get(replies).query({ thread_id: threadId });
    assert.equal(thread.body.replies.find(r => r._id === replyId).text, '[deleted]');
  });
  test('Reporting a reply: PUT /api/replies/{board}', async function() {
    const res = await chai.request(server).put(replies).send({ thread_id: threadId, reply_id: replyId });
    assert.equal(res.text, 'reported');
    const stored = JSON.parse(require('fs').readFileSync(require('path').resolve('.data/boards.json'), 'utf8'));
    const reply = stored.boards.find(b => b.name === board).threads.find(t => t._id === threadId).replies.find(r => r._id === replyId);
    assert.isTrue(reply.reported);
    assert.notEqual(reply.delete_password, 'reply-password');
  });
});

