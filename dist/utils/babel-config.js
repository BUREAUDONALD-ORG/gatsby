'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _startsWith2 = require('lodash/startsWith');

var _startsWith3 = _interopRequireDefault(_startsWith2);

exports.default = babelConfig;

var _resolve = require('babel-core/lib/helpers/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _json = require('json5');

var _json2 = _interopRequireDefault(_json);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*  weak */
function defaultConfig() {
  return {
    presets: ['react', 'es2015', 'stage-0'],
    plugins: ['add-module-exports', 'transform-object-assign']
  };
}

/**
 * Uses babel-core helpers to resolve the plugin given it's name. It
 * resolves plugins in the following order:
 *
 * 1. Adding babel-type prefix and checking user's local modules
 * 2. Adding babel-type prefix and checking Gatsby's modules
 * 3. Checking users's modules without prefix
 * 4. Checking Gatsby's modules without prefix
 *
 */
function resolvePlugin(pluginName, directory, type) {
  var gatsbyPath = _path2.default.resolve(__dirname, '..', '..');
  var plugin = (0, _resolve2.default)('babel-' + type + '-' + pluginName, directory) || (0, _resolve2.default)('babel-' + type + '-' + pluginName, gatsbyPath) || (0, _resolve2.default)(pluginName, directory) || (0, _resolve2.default)(pluginName, gatsbyPath);

  var name = (0, _startsWith3.default)(pluginName, 'babel') ? pluginName : 'babel-' + type + '-' + pluginName;
  var pluginInvariantMessage = '\n  You are trying to use a Babel plugin which Gatsby cannot find. You\n  can install it using "npm install --save ' + name + '".\n\n  You can use any of the Gatsby provided plugins without installing them:\n    - babel-plugin-add-module-exports\n    - babel-plugin-transform-object-assign\n    - babel-preset-es2015\n    - babel-preset-react\n    - babel-preset-stage-0\n  ';

  (0, _invariant2.default)(plugin !== null, pluginInvariantMessage);
  return plugin;
}

/**
 * Normalizes a Babel config object to include only absolute paths.
 * This way babel-loader will correctly resolve Babel plugins
 * regardless of where they are located.
 */
function normalizeConfig(config, directory) {
  var normalizedConfig = {
    presets: [],
    plugins: []
  };

  var presets = config.presets || [];
  presets.forEach(function (preset) {
    normalizedConfig.presets.push(resolvePlugin(preset, directory, 'preset'));
  });

  var plugins = config.plugins || [];
  plugins.forEach(function (plugin) {
    var normalizedPlugin = void 0;

    if ((0, _isArray3.default)(plugin)) {
      normalizedPlugin = [resolvePlugin(plugin[0], directory, 'plugin'), plugin[1]];
    } else {
      normalizedPlugin = resolvePlugin(plugin, directory, 'plugin');
    }

    normalizedConfig.plugins.push(normalizedPlugin);
  });

  return (0, _objectAssign2.default)({}, config, normalizedConfig);
}

/**
 * Locates a .babelrc in the Gatsby site root directory. Parses it using
 * json5 (what Babel uses). It throws an error if the users's .babelrc is
 * not parseable.
 */
function findBabelrc(directory) {
  try {
    var babelrc = _fs2.default.readFileSync(_path2.default.join(directory, '.babelrc'), 'utf-8');
    return _json2.default.parse(babelrc);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    } else {
      throw error;
    }
  }
}

/**
 * Reads the user's package.json and returns the "babel" section. It will
 * return undefined when the "babel" section does not exist.
 */
function findBabelPackage(directory) {
  try {
    // $FlowIssue - https://github.com/facebook/flow/issues/1975
    var packageJson = require(_path2.default.join(directory, 'package.json'));
    return packageJson.babel;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return null;
    } else {
      throw error;
    }
  }
}

/**
 * Returns a normalized Babel config to use with babel-loader. All of
 * the paths will be absolute so that Babel behaves as expected.
 */
function babelConfig(program, stage) {
  var directory = program.directory;


  var babelrc = findBabelrc(directory) || findBabelPackage(directory) || defaultConfig();

  if (stage === 'develop') {
    babelrc.presets.unshift('react-hmre');
  }

  if (!babelrc.hasOwnProperty('cacheDirectory')) {
    babelrc.cacheDirectory = true;
  }

  return normalizeConfig(babelrc, directory);
}