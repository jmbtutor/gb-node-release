const packageJson  = require('../package.json');
const bunyan       = require('bunyan');
const PrettyStream = require('bunyan-prettystream');
const prettyStdOut = new PrettyStream({mode: 'dev'});
prettyStdOut.pipe(process.stdout);

module.exports = bunyan.createLogger({
  name:    packageJson.name,
  streams: [
    {
      type:   'raw',
      level:  'warn',
      stream: prettyStdOut
    }
  ]
});