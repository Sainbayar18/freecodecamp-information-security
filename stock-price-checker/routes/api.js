'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dataDir = path.join(__dirname, '..', '.data');
fs.mkdirSync(dataDir, { recursive: true });
const databasePath = path.join(dataDir, 'stocks.json');
const database = fs.existsSync(databasePath)
  ? JSON.parse(fs.readFileSync(databasePath, 'utf8'))
  : { salt: crypto.randomBytes(32).toString('hex'), stocks: {} };
const quotes = new Map();
function save() {
  fs.writeFileSync(databasePath + '.tmp', JSON.stringify(database));
  fs.renameSync(databasePath + '.tmp', databasePath);
}
async function quote(symbol) {
  const cached = quotes.get(symbol);
  if (cached && Date.now() - cached.time < 60000) return cached.price;
  let price;
  try {
    const response = await fetch('https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + encodeURIComponent(symbol) + '/quote', { signal: AbortSignal.timeout(15000) });
    if (response.ok) price = (await response.json()).latestPrice;
  } catch (_) { /* Try the independent quote provider below. */ }
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) + '?interval=1d&range=1d', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Stock quote unavailable');
    const data = await response.json();
    price = data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta.regularMarketPrice;
  }
  if (typeof price !== 'number' || !Number.isFinite(price)) throw new Error('Unknown stock symbol');
  quotes.set(symbol, { price, time: Date.now() });
  return price;
}
module.exports = function (app) {
  app.get('/api/stock-prices', async (req, res) => {
    const symbols = (Array.isArray(req.query.stock) ? req.query.stock : [req.query.stock]).map(s => typeof s === 'string' ? s.trim().toUpperCase() : '');
    if (symbols.length > 2 || symbols.some(s => !/^[A-Z][A-Z0-9.-]{0,9}$/.test(s))) return res.status(400).json({ error: 'Provide one or two valid stock symbols' });
    try {
      const prices = await Promise.all(symbols.map(quote));
      const visitor = crypto.createHmac('sha256', database.salt).update(req.ip || req.socket.remoteAddress || '').digest('hex');
      const data = symbols.map((symbol, index) => {
        const record = database.stocks[symbol] || (database.stocks[symbol] = { voters: [] });
        if (req.query.like === 'true' && !record.voters.includes(visitor)) record.voters.push(visitor);
        return { stock: symbol, price: prices[index], likes: record.voters.length };
      });
      save();
      if (data.length === 2) {
        const difference = data[0].likes - data[1].likes;
        return res.json({ stockData: data.map((stock, i) => ({ stock: stock.stock, price: stock.price, rel_likes: i === 0 ? difference : -difference })) });
      }
      res.json({ stockData: data[0] });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });
};

