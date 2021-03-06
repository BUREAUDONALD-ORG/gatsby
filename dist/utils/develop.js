'use strict';

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _server = require('react-dom/server');

var _server2 = _interopRequireDefault(_server);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _negotiator = require('negotiator');

var _negotiator2 = _interopRequireDefault(_negotiator);

var _parseFilepath = require('parse-filepath');

var _parseFilepath2 = _interopRequireDefault(_parseFilepath);

var _webpackRequire = require('webpack-require');

var _webpackRequire2 = _interopRequireDefault(_webpackRequire);

var _hapiWebpackPlugin = require('hapi-webpack-plugin');

var _hapiWebpackPlugin2 = _interopRequireDefault(_hapiWebpackPlugin);

var _opn = require('opn');

var _opn2 = _interopRequireDefault(_opn);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _startWithDynamicPort = require('./startWithDynamicPort');

var _startWithDynamicPort2 = _interopRequireDefault(_startWithDynamicPort);

var _globPages = require('./glob-pages');

var _globPages2 = _interopRequireDefault(_globPages);

var _webpack3 = require('./webpack.config');

var _webpack4 = _interopRequireDefault(_webpack3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
require('node-cjsx').transform();

var debug = require('debug')('gatsby:application');

// Display a nice noscript message in dev mode explaining that server-side rendering
// is not enabled in develop mode
var devNoScript = '<noscript>\n  The Gatsby development server does not work without JavaScript enabled.\n  If you\'d like to test how your site works without JavaScript, first build the site\n  \'gatsby build\' and then serve the built site \'gatsby serve-build\'\n</noscript>';

function startServer(program) {
  var directory = program.directory;

  // Load pages for the site.
  return (0, _globPages2.default)(directory, function (err, pages) {
    var compilerConfig = (0, _webpack4.default)(program, directory, 'develop', program.port);

    var compiler = (0, _webpack2.default)(compilerConfig.resolve());

    var HTMLPath = directory + '/html';
    // Check if we can't find an html component in root of site.
    if (_glob2.default.sync(HTMLPath + '.*').length === 0) {
      HTMLPath = '../isomorphic/html';
    }

    var htmlCompilerConfig = (0, _webpack4.default)(program, directory, 'develop-html', program.port);

    (0, _webpackRequire2.default)(htmlCompilerConfig.resolve(), require.resolve(HTMLPath), function (error, factory) {
      if (error) {
        console.log('Failed to require ' + directory + '/html.js');
        error.forEach(function (e) {
          console.log(e);
        });
        process.exit();
      }
      var HTML = factory();
      debug('Configuring develop server');

      var server = new _hapi2.default.Server();

      server.connection({
        host: program.host,
        port: program.port
      });

      server.route({
        method: 'GET',
        path: '/html/{path*}',
        handler: function handler(request, reply) {
          if (request.path === 'favicon.ico') {
            return reply(_boom2.default.notFound());
          }

          try {
            var htmlElement = _react2.default.createElement(HTML, {
              body: devNoScript
            });
            var html = _server2.default.renderToStaticMarkup(htmlElement);
            html = '<!DOCTYPE html>\n' + html;
            return reply(html);
          } catch (e) {
            console.log(e.stack);
            throw e;
          }
        }
      });

      server.route({
        method: 'GET',
        path: '/{path*}',
        handler: {
          directory: {
            path: program.directory + '/pages',
            listing: false,
            index: false
          }
        }
      });

      server.ext('onRequest', function (request, reply) {
        var negotiator = new _negotiator2.default(request.raw.req);

        // Try to map the url path to match an actual path of a file on disk.
        var parsed = (0, _parseFilepath2.default)(request.path);
        var page = (0, _find3.default)(pages, function (p) {
          return p.path === parsed.dirname + '/';
        });

        var absolutePath = program.directory + '/pages';
        var path = void 0;
        if (page) {
          path = '/' + (0, _parseFilepath2.default)(page.requirePath).dirname + '/' + parsed.basename;
          absolutePath += '/' + (0, _parseFilepath2.default)(page.requirePath).dirname + '/' + parsed.basename;
        } else {
          path = request.path;
          absolutePath += request.path;
        }
        var isFile = false;
        try {
          isFile = _fs2.default.lstatSync(absolutePath).isFile();
        } catch (e) {}
        // Ignore.


        // If the path matches a file, return that.
        if (isFile) {
          request.setUrl(path);
          reply.continue();
          // Let people load the bundle.js directly.
        } else if (request.path === '/bundle.js') {
          reply.continue();
        } else if (negotiator.mediaType() === 'text/html') {
          // If the path does not end with a slash, add it.
          if (request.path[request.path.length - 1] !== '/') {
            request.path += '/'; // eslint-disable-line no-param-reassign
          }
          request.setUrl('/html' + request.path);
          reply.continue();
        } else {
          reply.continue();
        }
      });

      var assets = {
        noInfo: true,
        reload: true,
        publicPath: compilerConfig._config.output.publicPath
      };
      var hot = {
        hot: true,
        quiet: true,
        noInfo: true,
        host: program.host,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        stats: {
          colors: true
        }
      };

      return server.register({
        register: _hapiWebpackPlugin2.default,
        options: {
          compiler: compiler,
          assets: assets,
          hot: hot
        }
      }, function (er) {
        if (er) {
          console.log(er);
          process.exit();
        }

        server.start(function (e) {
          if (e) {
            if (e.code === 'EADDRINUSE') {
              // eslint-disable-next-line max-len
              console.log(_chalk2.default.red('Unable to start Gatsby on port ' + program.port + ' as there\'s already a process listing on that port.'));
            } else {
              console.log(_chalk2.default.red(e));
            }

            process.exit();
          } else {
            if (program.open) {
              (0, _opn2.default)(server.info.uri);
            }
            console.log(_chalk2.default.green('Server started successfully!'));
            console.log();
            console.log('Listening at:');
            console.log();
            console.log('  ', _chalk2.default.cyan(server.info.uri));
          }
        });
      });
    });
  });
}

module.exports = (0, _startWithDynamicPort2.default)(startServer);