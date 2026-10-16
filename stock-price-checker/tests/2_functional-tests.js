const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
chai.use(chaiHttp);
suite('Functional Tests', function() {
  this.timeout(30000);
  let likedCount;
  test('Viewing one stock: GET /api/stock-prices/', function(done) {
    chai.request(server).get('/api/stock-prices/').query({ stock: 'MSFT' }).end((err, res) => {
      if (err) return done(err);
      assert.equal(res.status, 200);
      assert.equal(res.body.stockData.stock, 'MSFT');
      assert.isNumber(res.body.stockData.price);
      assert.isNumber(res.body.stockData.likes);
      done();
    });
  });
  test('Viewing one stock and liking it: GET /api/stock-prices/', function(done) {
    chai.request(server).get('/api/stock-prices/').query({ stock: 'MSFT', like: true }).end((err, res) => {
      if (err) return done(err);
      assert.equal(res.status, 200);
      assert.isAtLeast(res.body.stockData.likes, 1);
      likedCount = res.body.stockData.likes;
      done();
    });
  });
  test('Viewing the same stock and liking it again: GET /api/stock-prices/', function(done) {
    chai.request(server).get('/api/stock-prices/').query({ stock: 'MSFT', like: true }).end((err, res) => {
      if (err) return done(err);
      assert.equal(res.status, 200);
      assert.equal(res.body.stockData.likes, likedCount);
      done();
    });
  });
  test('Viewing two stocks: GET /api/stock-prices/', function(done) {
    chai.request(server).get('/api/stock-prices/').query({ stock: ['MSFT', 'GOOG'] }).end((err, res) => {
      if (err) return done(err);
      assert.equal(res.status, 200);
      assert.lengthOf(res.body.stockData, 2);
      assert.equal(res.body.stockData[0].stock, 'MSFT');
      assert.equal(res.body.stockData[1].stock, 'GOOG');
      assert.isNumber(res.body.stockData[0].rel_likes);
      assert.equal(res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes, 0);
      assert.notProperty(res.body.stockData[0], 'likes');
      done();
    });
  });
  test('Viewing two stocks and liking them: GET /api/stock-prices/', function(done) {
    chai.request(server).get('/api/stock-prices/').query({ stock: ['MSFT', 'GOOG'], like: true }).end((err, res) => {
      if (err) return done(err);
      assert.equal(res.status, 200);
      assert.lengthOf(res.body.stockData, 2);
      assert.isNumber(res.body.stockData[0].price);
      assert.isNumber(res.body.stockData[1].price);
      assert.equal(res.body.stockData[0].rel_likes + res.body.stockData[1].rel_likes, 0);
      done();
    });
  });
});
