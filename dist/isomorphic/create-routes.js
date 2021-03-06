'use strict';

var _last2 = require('lodash/last');

var _last3 = _interopRequireDefault(_last2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _gatsbyHelpers = require('./gatsby-helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function requireComponent(moduleReq) {
  // Minor differences in `require` behavior across languages
  // are handled by this wrapper.
  //
  // If `moduleReq` is a typescript module (versus javascript/coffeescript)
  // an object with a `default` property is returned rather than the
  // default export.
  var module = moduleReq;
  if (module.default) {
    module = module.default;
  }
  return module;
} /*  weak */


module.exports = function (files, pagesReq) {
  // Remove files that start with an underscore as this indicates
  // the file shouldn't be turned into a page.
  var pages = (0, _filter3.default)(files, function (file) {
    return file.file.name.slice(0, 1) !== '_';
  });
  var templates = (0, _filter3.default)(files, function (file) {
    return file.file.name === '_template';
  });

  var routes = {
    path: (0, _gatsbyHelpers.prefixLink)('/'),
    component: requireComponent(require('pages/_template')),
    childRoutes: [],
    indexRoute: {},
    pages: pages,
    templates: templates
  };
  var notFound = null;
  var templatesHash = {};
  templatesHash.root = routes;
  templatesHash['/'] = routes;

  // Arrange pages in data structure according to their position
  // on the file system. Then use this to create routes.
  //
  // Algorithm
  // 1. Find all templates.
  // 2. Create routes for each template russian-doll style.
  // 3. For each index file paired with a template, create a default route
  // 4. Create normal routes for each remaining file under the appropriate
  // template
  var templatesWithoutRoot = (0, _filter3.default)(files, function (file) {
    return file.file.name === '_template' && file.file.dirname !== '';
  });

  // Find the parent template for each template file and create a route
  // with it.
  templatesWithoutRoot.forEach(function (templateFile) {
    var parentTemplates = (0, _filter3.default)(templatesWithoutRoot, function (template) {
      return templateFile.requirePath.indexOf(template.file.dirname) === 0;
    });
    // Sort parent templates by directory length. In cases
    // where a template has multiple parents
    // e.g. /_template.js/blog/_template.js/archive/_template.js
    // we want to nest this template under its most immediate parent.
    parentTemplates = (0, _sortBy3.default)(parentTemplates, function (template) {
      if (template) {
        return template.file.dirname.length;
      } else {
        return 0;
      }
    });
    var parentTemplateFile = (0, _last3.default)(parentTemplates);
    var parentRoute = void 0;
    if (parentTemplateFile) {
      parentRoute = templatesHash[parentTemplateFile.file.dirname];
    }
    if (!parentRoute) {
      parentRoute = templatesHash.root;
    }

    // Create new route for the template.
    var route = {
      path: (0, _gatsbyHelpers.prefixLink)(templateFile.templatePath),
      component: requireComponent(pagesReq('./' + templateFile.requirePath)),
      childRoutes: [],
      indexRoute: {},
      pages: pages,
      templates: templates,
      parentTemplateFile: parentTemplateFile
    };

    // Add route to the templates object for easy access.
    templatesHash[templateFile.file.dirname] = route;

    // Push new route onto its parent.
    parentRoute.childRoutes.push(route);
  });

  var staticFileTypes = ['ipynb', 'md', 'markdown', 'html', 'json', 'yaml', 'toml'];
  var reactComponentFileTypes = ['js', 'ts', 'jsx', 'tsx', 'cjsx'];
  var wrappers = {};
  staticFileTypes.forEach(function (type) {
    try {
      // $FlowIssue - https://github.com/facebook/flow/issues/1975
      wrappers[type] = require('wrappers/' + type);
    } catch (e) {
      // Ignore module not found errors; show others on console
      if (e.code !== 'MODULE_NOT_FOUND' && e.message && !e.message.match(/^Cannot find module/) && typeof console !== 'undefined') {
        console.error('Error requiring wrapper', type, ':', e);
      }
    }
  });

  pages.forEach(function (p) {
    var page = p;
    var handler = void 0;
    if (staticFileTypes.indexOf(page.file.ext) !== -1) {
      handler = wrappers[page.file.ext];
      page.data = pagesReq('./' + page.requirePath);
    } else if (reactComponentFileTypes.indexOf(page.file.ext) !== -1) {
      handler = pagesReq('./' + page.requirePath);
      page.data = page.data = page.data === undefined ? {} : page.data;
    }

    // Determine parent template for page.
    var parentTemplates = (0, _filter3.default)(templatesWithoutRoot, function (templateFile) {
      return page.requirePath.indexOf(templateFile.file.dirname) === 0;
    });

    var sortedParentTemplates = (0, _sortBy3.default)(parentTemplates, function (route) {
      return route.file.dirname.length;
    });

    var parentTemplateFile = (0, _last3.default)(sortedParentTemplates);
    var parentRoute = void 0;
    if (parentTemplateFile) {
      parentRoute = templatesHash[parentTemplateFile.file.dirname];
    }

    if (!parentRoute) {
      parentRoute = templatesHash.root;
    }

    // If page is an index page *and* has the same path as its parentRoute,
    // it is the index route (for that template).
    if (page.file.name === 'index' && (0, _gatsbyHelpers.prefixLink)(page.path) === parentRoute.path) {
      parentRoute.indexRoute = {
        component: handler,
        page: page,
        pages: pages,
        templates: templates,
        parentTemplateFile: parentTemplateFile
      };
    } else {
      parentRoute.childRoutes.push({
        path: (0, _gatsbyHelpers.prefixLink)(page.path),
        component: handler,
        page: page,
        pages: pages,
        templates: templates,
        parentTemplateFile: parentTemplateFile
      });
    }

    if (page.path.indexOf('/404') !== -1) {
      notFound = {
        path: '*',
        component: handler,
        page: page,
        pages: pages,
        templates: templates,
        parentTemplateFile: parentTemplateFile
      };
    }
  });

  if (notFound) {
    routes.childRoutes.push(notFound);
  }

  return routes;
};