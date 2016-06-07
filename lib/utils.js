'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.warning = exports.processError = exports.formatUrl = exports.formatFilters = undefined;

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
const formatFilters = exports.formatFilters = function formatFilters() {
  let currentFilters = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
  let newFilters = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  let operator = arguments.length <= 2 || arguments[2] === undefined ? _operators.AND : arguments[2];

  const mergedFilters = [];
  let count = 0;

  const checkFilter = (filter, idx) => {
    if (typeof filter !== 'string') {
      mergedFilters.push(filter);
      count++;
    }
  };

  currentFilters.forEach(checkFilter);
  newFilters.forEach(checkFilter);

  for (let i = count; i > 1; i--) {
    mergedFilters.unshift(operator);
  }

  return mergedFilters;
};

const formatUrl = exports.formatUrl = function formatUrl(location, type) {
  let params = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  const query = URLS[type.toUpperCase()] || URLS.CALL;

  let url = location + query;

  if (params.model) {
    url = `${ url }/${ params.model }:${ type }`;
  }

  if (params.method && type !== params.method) {
    url = `${ url }:${ params.method }`;
  }

  return url;
};

/**
 * Process an error output with type and stack
 * @param  {Object} data The OpenERP Server Error
 * @return {Error}       The standard error
 */
const processError = exports.processError = data => {
  let err;

  if (data.debug && data.debug.indexOf('SessionExpiredException') !== -1) {
    err = new Error(ERRORS.SESSION_EXPIRED);
  } else {
    err = new Error(data.type);
  }

  err.stack = `${ data.debug }${ data.fault_code || '' }`;

  return err;
};

const warning = exports.warning = function warning(condition) {
  if (condition) {
    console.warn((arguments.length <= 1 ? undefined : arguments[1]) || '', (arguments.length <= 2 ? undefined : arguments[2]) || '', (arguments.length <= 3 ? undefined : arguments[3]) || '', (arguments.length <= 4 ? undefined : arguments[4]) || '');
  }
};