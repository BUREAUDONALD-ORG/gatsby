'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultMessage = '\nGatsby is currently using the default _template. You can override it by\ncreating a React component at "/pages/_template.js".\n\nYou can see what this default template does by visiting:\nhttps://github.com/gatsbyjs/gatsby/blob/master/lib/isomorphic/pages/_template.js\n'; /*  weak */

console.info(defaultMessage);

function template(props) {
  return _react2.default.createElement(
    'div',
    null,
    props.children
  );
}

template.propTypes = { children: _react.PropTypes.any };

module.exports = template;