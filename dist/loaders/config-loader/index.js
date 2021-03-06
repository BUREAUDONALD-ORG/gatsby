'use strict';

/*  weak */
var toml = require('toml');
var loaderUtils = require('loader-utils');
var path = require('path');
var globPages = require('../../utils/glob-pages');

module.exports = function (source) {
  this.cacheable();
  var callback = this.async();
  var directory = loaderUtils.parseQuery(this.query).directory;
  var config = toml.parse(source);

  var value = {};
  value.config = config;
  value.relativePath = path.relative('.', directory);
  globPages(directory, function (err, pagesData) {
    value.pages = pagesData;
    return callback(null, 'module.exports = ' + JSON.stringify(value, void 0, '\t'));
  });
};