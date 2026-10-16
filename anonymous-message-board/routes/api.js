'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const databasePath = path.resolve(__dirname, '..', (process.env.DB || 'file:.data/boards.json').replace(/^file:/, ''));
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = fs.existsSync(databasePath) ? JSON.parse(fs.readFileSync(databasePath, 'utf8')) : { boards: [] };
function save() {
  fs.writeFileSync(databasePath + '.tmp', JSON.stringify(database));
  fs.renameSync(databasePath + '.tmp', databasePath);
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
}
function matches(password, stored) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const [salt, digest] = stored.split(':');
  return crypto.timingSafeEqual(crypto.scryptSync(password, salt, 64), Buffer.from(digest, 'hex'));
}
function publicReply(reply) {
  return { _id: reply._id, text: reply.text, created_on: reply.created_on };
}
function publicThread(thread, recentOnly = false) {
  return {
    _id: thread._id, text: thread.text, created_on: thread.created_on, bumped_on: thread.bumped_on,
    replycount: thread.replies.length,
    replies: (recentOnly ? thread.replies.slice(-3) : thread.replies).map(publicReply)
  };
}
function validPost(body) {
  return typeof body.text === 'string' && body.text.trim().length > 0 && body.text.length <= 10000 && typeof body.delete_password === 'string' && body.delete_password.length > 0 && body.delete_password.length <= 256;
}
module.exports = function (app) {
  app.param('board', (req, res, next, name) => {
    if (!/^[\w-]{1,80}$/.test(name)) return res.status(400).json({ error: 'Invalid board name' });
    let board = database.boards.find(b => b.name === name);
    if (!board) { board = { name, threads: [] }; database.boards.push(board); }
    req.board = board;
    next();
  });
  app.route('/api/threads/:board')
    .post((req, res) => {
      if (!validPost(req.body)) return res.status(400).json({ error: 'Text and delete_password are required' });
      const now = new Date().toISOString();
      const thread = { _id: crypto.randomUUID(), text: req.body.text, created_on: now, bumped_on: now, reported: false, delete_password: hashPassword(req.body.delete_password), replies: [] };
      req.board.threads.push(thread); save();
      if (req.is('application/x-www-form-urlencoded')) return res.redirect('/b/' + encodeURIComponent(req.board.name) + '/');
      res.json(publicThread(thread));
    })
    .get((req, res) => res.json(req.board.threads.slice().sort((a, b) => b.bumped_on.localeCompare(a.bumped_on)).slice(0, 10).map(t => publicThread(t, true))))
    .delete((req, res) => {
      const thread = req.board.threads.find(t => t._id === req.body.thread_id);
      if (!thread || !matches(req.body.delete_password, thread.delete_password)) return res.type('text').send('incorrect password');
      req.board.threads = req.board.threads.filter(t => t !== thread); save();
      res.type('text').send('success');
    })
    .put((req, res) => {
      const thread = req.board.threads.find(t => t._id === (req.body.thread_id || req.body.report_id));
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      thread.reported = true; save(); res.type('text').send('reported');
    });
  app.route('/api/replies/:board')
    .post((req, res) => {
      if (!validPost(req.body)) return res.status(400).json({ error: 'Text and delete_password are required' });
      const thread = req.board.threads.find(t => t._id === req.body.thread_id);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      const now = new Date().toISOString();
      const reply = { _id: crypto.randomUUID(), text: req.body.text, created_on: now, delete_password: hashPassword(req.body.delete_password), reported: false };
      thread.replies.push(reply); thread.bumped_on = now; save();
      if (req.is('application/x-www-form-urlencoded')) return res.redirect('/b/' + encodeURIComponent(req.board.name) + '/' + thread._id);
      res.json(publicReply(reply));
    })
    .get((req, res) => {
      const thread = req.board.threads.find(t => t._id === req.query.thread_id);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });
      res.json(publicThread(thread));
    })
    .delete((req, res) => {
      const thread = req.board.threads.find(t => t._id === req.body.thread_id);
      const reply = thread && thread.replies.find(r => r._id === req.body.reply_id);
      if (!reply || !matches(req.body.delete_password, reply.delete_password)) return res.type('text').send('incorrect password');
      reply.text = '[deleted]'; save(); res.type('text').send('success');
    })
    .put((req, res) => {
      const thread = req.board.threads.find(t => t._id === req.body.thread_id);
      const reply = thread && thread.replies.find(r => r._id === req.body.reply_id);
      if (!reply) return res.status(404).json({ error: 'Reply not found' });
      reply.reported = true; save(); res.type('text').send('reported');
    });
};
