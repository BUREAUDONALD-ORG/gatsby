'use strict';

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _globPages = require('./glob-pages');

var _globPages2 = _interopRequireDefault(_globPages);

var _webpack3 = require('./webpack.config');

var _webpack4 = _interopRequireDefault(_webpack3);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
require('node-cjsx').transform();

var debug = require('debug')('gatsby:html');

module.exports = function (program, callback) {
  var directory = program.directory;


  (0, _globPages2.default)(directory, function (err, pages) {
    debug('generating static HTML');
    var routes = pages.filter(function (page) {
      return page.path;
    }).map(function (page) {
      return page.path;
    });

    // Static site generation.
    var compilerConfig = (0, _webpack4.default)(program, directory, 'build-html', null, routes);

    (0, _webpack2.default)(compilerConfig.resolve()).run(function (e, stats) {
      if (e) {
        return callback(e, stats);
      }
      if (stats.hasErrors()) {
        return callback('Error: ' + stats.toJson().errors, stats);
      }

      // A temp file required by static-site-generator-plugin
      _fs2.default.unlinkSync(directory + '/public/render-page.js');

      return callback(null, stats);
    });
  });
};