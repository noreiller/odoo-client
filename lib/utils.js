'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCookie = exports.warning = exports.processError = exports.formatUrl = exports.formatFilters = undefined;

var _operators = require('./operators');

var _urls = require('./urls');

var URLS = _interopRequireWildcard(_urls);

var _errors = require('./errors');

var ERRORS = _interopRequireWildcard(_errors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Merge two filters arrays using an operator
 * @param  {Array} currentFilters =             []
 * @param  {Array} newFilters     =             []
 * @param  {String} operator      =             AND
 * @return {Array}
 */
var formatFilters = exports.formatFilters = function formatFilters() {
  var currentFilters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var newFilters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var operator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _operators.AND;

  var mergedFilters = [];
  var count = 0;

  var checkFilter = function checkFilter(filter, idx) {
    if (typeof filter !== 'string') {
      mergedFilters.push(filter);
      count++;
    }
  };

  currentFilters.forEach(checkFilter);
  newFilters.forEach(checkFilter);

  for (var i = count; i > 1; i--) {
    mergedFilters.unshift(operator);
  }

  return mergedFilters;
};

var formatUrl = exports.formatUrl = function formatUrl(location, type) {
  var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var query = URLS[type.toUpperCase()] || URLS.CALL;

  var url = location + query;

  if (params.model) {
    url = url + '/' + params.model + ':' + type;
  }

  if (params.method && type !== params.method) {
    url = url + ':' + params.method;
  }

  return url;
};

/**
 * Process an error output with type and stack
 * @param  {Object} data The OpenERP Server Error
 * @return {Error}       The standard error
 */
var processError = exports.processError = function processError(data) {
  var err = void 0;

  if (data.debug && data.debug.indexOf('SessionExpiredException') !== -1) {
    err = new Error(ERRORS.SESSION_EXPIRED);
  } else {
    err = new Error(data.type);
  }

  err.stack = '' + data.debug + (data.fault_code || '');

  return err;
};

/**
 * Expose a warning if some condition is fulfilled
 * @param  {Boolean} condition
 * @param  {String(s)} ...args
 */
var warning = exports.warning = function warning(condition) {
  if (condition) {
    console.warn((arguments.length <= 1 ? undefined : arguments[1]) || '', (arguments.length <= 2 ? undefined : arguments[2]) || '', (arguments.length <= 3 ? undefined : arguments[3]) || '', (arguments.length <= 4 ? undefined : arguments[4]) || '');
  }
};

/**
 * Retrieve a cookie in the document cookie string
 * @param  {String} cookies The document.cookie
 * @param  {String} name    The name of the cookie to find
 * @return {String}         The value of the cookie
 */
var getCookie = exports.getCookie = function getCookie(cookies, name) {
  var cookie = cookies.split(';').map(function (cookie) {
    return cookie.replace(/^\s*/, '');
  }).find(function (cookie) {
    return cookie.indexOf(name) === 0;
  });

  if (cookie) {
    return cookie.split('=')[1];
  }
};