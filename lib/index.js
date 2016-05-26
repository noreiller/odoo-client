'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createClient = exports.TYPES = exports.OPERATORS = exports.OdooClient = undefined;

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _operators = require('./operators');

var OPERATORS = _interopRequireWildcard(_operators);

var _types = require('./types');

var TYPES = _interopRequireWildcard(_types);

var _urls = require('./urls');

var URLS = _interopRequireWildcard(_urls);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.OdooClient = _client2.default;
exports.OPERATORS = OPERATORS;
exports.TYPES = TYPES;
const createClient = exports.createClient = values => {
  return new _client2.default(values);
};