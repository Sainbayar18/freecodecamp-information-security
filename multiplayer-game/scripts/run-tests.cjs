process.env.PORT = process.env.TEST_PORT || '3005';
process.env.NODE_ENV = 'development';
require('@babel/register')({ extensions: ['.js', '.mjs'] });
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const mocha = new Mocha({ ui: 'tdd', timeout: 10000 });
for (const file of fs.readdirSync(path.join(__dirname, '..', 'tests')).filter(file => file.endsWith('.js'))) mocha.addFile(path.join(__dirname, '..', 'tests', file));
mocha.run(failures => {
  const app = require('../server');
  app.locals.io.close(() => process.exit(failures ? 1 : 0));
});
