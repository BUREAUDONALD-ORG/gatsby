'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _reactRouter = require('react-router');

var _useScroll = require('react-router-scroll/lib/useScroll');

var _useScroll2 = _interopRequireDefault(_useScroll);

var _createRoutes = require('create-routes');

var _createRoutes2 = _interopRequireDefault(_createRoutes);

var _gatsbyBrowser = require('gatsby-browser');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var loadContext = require('.gatsby-context'); /*  weak */


function loadConfig(cb) {
  var stuff = require('config');
  if (module.hot) {
    module.hot.accept(stuff.id, function () {
      return cb();
    });
  }
  return cb();
}

var currentLocation = null;

_reactRouter.browserHistory.listen(function (location) {
  currentLocation = location;
  if (_gatsbyBrowser.onRouteChange) {
    console.warn('onRouteChange is now deprecated and will be removed in the next major Gatsby release (0.13). Please use onRouteUpdate instead. See the PR for more info (https://github.com/gatsbyjs/gatsby/pull/321).');
    (0, _gatsbyBrowser.onRouteChange)(location);
  }
});

function onUpdate() {
  if (_gatsbyBrowser.onRouteUpdate) {
    (0, _gatsbyBrowser.onRouteUpdate)(currentLocation);
  }
}

function shouldUpdateScroll(prevRouterProps, _ref) {
  var pathname = _ref.location.pathname;

  if (prevRouterProps) {
    var oldPathname = prevRouterProps.location.pathname;

    if (oldPathname === pathname) {
      return false;
    }
  }
  return false;
}

var routes = void 0;
loadConfig(function () {
  return loadContext(function (pagesReq) {
    var _require = require('config'),
        pages = _require.pages;

    if (!routes) {
      routes = (0, _createRoutes2.default)(pages, pagesReq);
    } else {
      (0, _createRoutes2.default)(pages, pagesReq);
    }

    _reactDom2.default.render(_react2.default.createElement(_reactRouter.Router, {
      history: _reactRouter.browserHistory,
      routes: routes,
      render: (0, _reactRouter.applyRouterMiddleware)((0, _useScroll2.default)(shouldUpdateScroll)),
      onUpdate: onUpdate
    }), typeof window !== 'undefined' ? document.getElementById('react-mount') : void 0);
  });
});