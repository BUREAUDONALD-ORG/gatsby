'use strict';

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var program = require('commander');
var packageJson = require('../../package.json');
var fs = require('fs-extra');
var path = require('path');


// Copy our load-context function to root of site in a dot file.
var gatsbyFile = __dirname + '/../utils/load-context.js';
var siteDirectory = path.resolve('.');
var fileName = siteDirectory + '/.gatsby-context.js';
fs.copy(gatsbyFile, fileName);

var defaultHost = process.platform === 'win32' ? 'localhost' : '0.0.0.0';

var directory = path.resolve('.');

program.version(packageJson.version).usage('[command] [options]');

program.command('develop').description('Start development server. Watches files and rebuilds and hot reloads if something changes') // eslint-disable-line max-len
.option('-H, --host <url>', 'Set host. Defaults to ' + defaultHost, defaultHost).option('-p, --port <port>', 'Set port. Defaults to 8000', '8000').option('-o, --open', 'Open the site in your browser for you.').action(function (command) {
  var develop = require('../utils/develop');
  var p = _extends({}, command, {
    directory: directory
  });
  develop(p);
});

program.command('build').description('Build a Gatsby project.').option('--prefix-links', 'Build site with links prefixed (set prefix in your config).').action(function (command) {
  // Set NODE_ENV to 'production'
  process.env.NODE_ENV = 'production';

  var build = require('../utils/build');
  var p = _extends({}, command, {
    directory: directory
  });
  build(p, function (err) {
    if (err) {
      throw err;
    } else {
      console.log('Done');
    }
  });
});

program.command('serve-build').description('Serve built site.').option('-H, --host <url>', 'Set host. Defaults to ' + defaultHost, defaultHost).option('-p, --port <port>', 'Set port. Defaults to 8000', '8000').option('-o, --open', 'Open the site in your browser for you.').action(function (command) {
  var serve = require('../utils/serve-build');
  var p = _extends({}, command, {
    directory: directory
  });
  serve(p);
});

program.command('new [rootPath] [starter]').description('Create new Gatsby project.').action(function (rootPath, starter) {
  var newCommand = require('../utils/new');
  newCommand(rootPath, starter);
});

program.on('--help', function () {
  console.log('To show subcommand help:\n\n    gatsby [command] -h\n');
});

// If the user types an unknown sub-command, just display the help.
var subCmd = process.argv.slice(2, 3)[0];
var cmds = (0, _map3.default)(program.commands, '_name');
cmds = cmds.concat(['--version', '-V']);

if (!(0, _includes3.default)(cmds, subCmd)) {
  program.help();
} else {
  program.parse(process.argv);
}