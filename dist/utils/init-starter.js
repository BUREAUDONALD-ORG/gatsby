'use strict';

var _child_process = require('child_process');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = console;

// Shortcut for backwards-compat fs.exists.
/*  weak */
var fsexists = _fsExtra2.default.exists || _path2.default.exists;

// Executes `npm install` and `bower install` in rootPath.
//
// rootPath - String. Path to directory in which command will be executed.
// callback - Function. Takes stderr and stdout of executed process.
//
// Returns nothing.
var install = function install(rootPath, callback) {
  var prevDir = process.cwd();
  logger.log('Installing packages...');
  process.chdir(rootPath);
  var installCmd = 'npm install';
  (0, _child_process.exec)(installCmd, function (error, stdout, stderr) {
    process.chdir(prevDir);
    if (stdout) console.log(stdout.toString());
    if (error !== null) {
      var msg = stderr.toString();
      callback(new Error(msg));
    }
    callback(null, stdout);
  });
};

var ignored = function ignored(path) {
  return !/^\.(git|hg)$/.test(_path2.default.basename(path));
};

// Copy starter from file system.
//
// starterPath   - String, file system path from which files will be taken.
// rootPath     - String, directory to which starter files will be copied.
// callback     - Function.
//
// Returns nothing.
var copy = function copy(starterPath, rootPath, callback) {
  var copyDirectory = function copyDirectory() {
    _fsExtra2.default.copy(starterPath, rootPath, { filter: ignored }, function (error) {
      if (error !== null) return callback(new Error(error));
      logger.log('Created starter directory layout');
      install(rootPath, callback);
      return false;
    });
  };

  // Chmod with 755.
  // 493 = parseInt('755', 8)
  _fsExtra2.default.mkdirp(rootPath, { mode: 493 }, function (error) {
    if (error !== null) callback(new Error(error));
    return fsexists(starterPath, function (exists) {
      if (!exists) {
        var chmodError = 'starter ' + starterPath + ' doesn\'t exist';
        return callback(new Error(chmodError));
      }
      logger.log('Copying local starter to ' + rootPath + ' ...');

      copyDirectory();
      return true;
    });
  });
};

// Clones starter from URI.
//
// address     - String, URI. https:, github: or git: may be used.
// rootPath    - String, directory to which starter files will be copied.
// callback    - Function.
//
// Returns nothing.
var clone = function clone(address, rootPath, callback) {
  var gitHubRe = /(gh|github):(?:\/\/)?/;
  var url = gitHubRe.test(address) ? 'git://github.com/' + address.replace(gitHubRe, '') + '.git' : address;
  logger.log('Cloning git repo ' + url + ' to ' + rootPath + '...');
  var cmd = 'git clone ' + url + ' ' + rootPath;
  (0, _child_process.exec)(cmd, function (error, stdout, stderr) {
    if (error !== null) {
      return callback(new Error('Git clone error: ' + stderr.toString()));
    }
    logger.log('Created starter directory layout');
    return _fsExtra2.default.remove(_path2.default.join(rootPath, '.git'), function (removeError) {
      if (error !== null) return callback(new Error(removeError));
      install(rootPath, callback);
      return true;
    });
  });
};

// Main function that clones or copies the starter.
//
// starter    - String, file system path or URI of starter.
// rootPath    - String, directory to which starter files will be copied.
// callback    - Function.
//
// Returns nothing.
var initStarter = function initStarter(starter) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var callback = arguments[2];

  var cwd = process.cwd();
  var rootPath = options.rootPath || cwd;
  if (options.logger) logger = options.logger;

  var uriRe = /(?:https?|git(hub)?|gh)(?::\/\/|@)?/;
  fsexists(_path2.default.join(rootPath, 'package.json'), function (exists) {
    if (exists) {
      return callback(new Error('Directory ' + rootPath + ' is already an npm project'));
    }
    var isGitUri = starter && uriRe.test(starter);
    var get = isGitUri ? clone : copy;
    get(starter, rootPath, callback);
    return true;
  });
};

module.exports = initStarter;