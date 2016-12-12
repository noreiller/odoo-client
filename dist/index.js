/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.createClient = exports.formatFilters = exports.URLS = exports.TYPES = exports.OPERATORS = exports.OdooClient = undefined;

	var _client = __webpack_require__(1);

	var _client2 = _interopRequireDefault(_client);

	var _operators = __webpack_require__(5);

	var OPERATORS = _interopRequireWildcard(_operators);

	var _types = __webpack_require__(9);

	var TYPES = _interopRequireWildcard(_types);

	var _urls = __webpack_require__(6);

	var URLS = _interopRequireWildcard(_urls);

	var _utils = __webpack_require__(7);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.OdooClient = _client2.default;
	exports.OPERATORS = OPERATORS;
	exports.TYPES = TYPES;
	exports.URLS = URLS;
	exports.formatFilters = _utils.formatFilters;
	var createClient = exports.createClient = function createClient(values) {
	  return new _client2.default(values);
	};

	if (typeof window !== 'undefined') {
	  window.OdooClient = _client2.default;
	}

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _isomorphicFetch = __webpack_require__(2);

	var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

	var _errors = __webpack_require__(4);

	var ERRORS = _interopRequireWildcard(_errors);

	var _operators = __webpack_require__(5);

	var OPERATORS = _interopRequireWildcard(_operators);

	var _urls = __webpack_require__(6);

	var URLS = _interopRequireWildcard(_urls);

	var _utils = __webpack_require__(7);

	var _resolver = __webpack_require__(8);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var isBrowser = typeof document !== 'undefined';
	var _counter = 0;
	var _queue = [];
	var _sessions = {};
	var _defaultSession = {
	  location: null,
	  db: null,
	  login: null,
	  password: null,
	  sid: null,
	  session_id: null,
	  context: {},
	  autologin: false,
	  dependencies: {}
	};

	var OdooClient = function () {
	  function OdooClient() {
	    var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    _classCallCheck(this, OdooClient);

	    this.instanceId = 's_' + ++_counter + '_' + Date.now();
	    this.counter = 0;
	    this.session = {};

	    this._saveSession(_extends({}, _defaultSession, values));

	    return this;
	  }

	  _createClass(OdooClient, [{
	    key: '_saveSession',
	    value: function _saveSession(session) {
	      var values = _extends({}, session);

	      (0, _utils.warning)(values.password && isBrowser, 'You provided a "password", use with caution in the browser since it can be exposed. Prefer use it only on the server.');

	      (0, _utils.warning)(values.autologin && !values.password, '"autologin" is enabled but you didn\'t provide a "password", so any autologin request will fail.');

	      if (!values.autologin && values.password) {
	        values.password = _defaultSession.password;
	      }

	      this.session = _extends({}, this.session, values);

	      _sessions[this.instanceId] = _extends({}, this.session);
	    }
	  }, {
	    key: '_request',
	    value: function _request() {
	      var _this = this;

	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }

	      return new Promise(function (resolve, reject) {
	        var callback = function callback() {
	          _this._performRequest.apply(_this, args).then(resolve).catch(reject);
	        };

	        if (args[0] !== 'login' && !_this.session.session_id && _this.session.autologin && _this.session.password) {
	          _this.login().then(callback).catch(reject);
	        } else {
	          callback.apply(_this);
	        }
	      });
	    }
	  }, {
	    key: '_performRequest',
	    value: function _performRequest(type) {
	      var _this2 = this;

	      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	      var params = _extends({}, data);

	      return new Promise(function (resolve, reject) {
	        if (_this2.session.session_id) {
	          params.session_id = _this2.session.session_id;
	        }

	        // If this request has already been performed, cancel it.
	        if (_queue.indexOf(JSON.stringify(params)) !== -1) {
	          reject(new Error(ERRORS.PENDING_REQUEST));
	        }
	        // Or add it to the queue.
	        else {
	            _queue.push(JSON.stringify(params));
	          }

	        var onComplete = function onComplete() {
	          _queue.splice(_queue.indexOf(JSON.stringify(params)), 1);
	        };

	        var onSuccess = function onSuccess(body) {
	          onComplete();

	          // Handle error
	          if (body.error) {
	            return reject((0, _utils.processError)(body.error.data));
	          } else if (body.result && body.result.uid === false) {
	            return reject(new Error(ERRORS.LOGIN_FAILED));
	          }

	          // User infos
	          if (body.result && body.result.session_id) {
	            _this2._saveSession({
	              session_id: body.result.session_id,
	              context: body.result.user_context
	            });
	          } else if (body.result && body.result.user_context) {
	            _this2._saveSession({
	              context: body.result.user_context
	            });
	          }

	          var result = void 0;
	          var length = void 0;
	          if (body.result) {
	            // list
	            if (body.result && typeof body.result.records !== 'undefined') {
	              result = body.result.records;
	              length = body.result.length;
	            } else {
	              result = typeof body.result[0] !== 'undefined' ? body.result[0] : body.result;

	              // single
	              if (result.value) {
	                result = result.value;
	              }

	              // boolean
	              if (typeof result === 'boolean') {
	                result = {
	                  value: result
	                };
	              }

	              if (typeof options.fill !== 'undefined') {
	                options.fill.forEach(function (field) {
	                  if (!result[field.name]) {
	                    result[field.name] = field.value;
	                  }
	                });
	              }
	            }
	          } else {
	            result = body.result;
	          }

	          var response = {
	            result: result,
	            model: params.model
	          };

	          if (length && !options.avoidPager) {
	            response.length = length;
	          }

	          if (params.offset && !options.avoidPager) {
	            response.offset = params.offset;
	          }

	          var resultIsList = _typeof(response.result) === 'object' && typeof response.length !== 'undefined';
	          var responseWithModel = _defineProperty({}, params.model, resultIsList ? response.result : [response.result]);

	          (0, _resolver.resolveDependencies)(_this2, responseWithModel).then(function (dependencies) {
	            // If the request is a READ one, exclude the model from the dependencies.
	            if (type === 'read') {
	              dependencies[params.model] = dependencies[params.model].filter(function (obj) {
	                return obj.id !== response.result.id;
	              });
	            }

	            response.dependencies = dependencies;

	            resolve(response);
	          });
	        };

	        var onError = function onError(err) {
	          onComplete();
	          reject(err);
	        };

	        var headers = void 0;

	        if (isBrowser) {
	          headers = new Headers();
	          headers.append("Content-Type", "application/json");
	          headers.append("Cookie", _this2.session.sid + ';');
	        } else {
	          headers = {};
	          headers["Content-Type"] = "application/json";
	          headers["Cookie"] = _this2.session.sid + ';';
	        }

	        (0, _isomorphicFetch2.default)((0, _utils.formatUrl)(_this2.session.location, type, params), {
	          method: "POST",
	          body: JSON.stringify({
	            id: 'r' + ++_this2.counter,
	            jsonrpc: '2.0',
	            method: 'call',
	            params: params
	          }),
	          headers: headers,
	          credentials: 'include'
	        }).then(function (req) {
	          if (req.headers.get('set-cookie')) {
	            var sid = req.headers.get('set-cookie').split(';')[0];

	            if (sid) {
	              _this2._saveSession({
	                sid: sid
	              });
	            }
	          }

	          return req;
	        }).then(function (req) {
	          return req.json();
	        }).then(onSuccess).catch(onError);
	      });
	    }

	    /**
	     * @todo server alternative
	     */

	  }, {
	    key: '_download',
	    value: function _download(type, params) {
	      var _this3 = this;

	      return new Promise(function (resolve, reject) {
	        if (isBrowser) {
	          (function () {
	            var iframeLoadListener = function iframeLoadListener() {
	              // Should occur only with a response error
	              try {
	                var statusText;

	                if (!this.contentDocument.body.childNodes[1]) {
	                  statusText = this.contentDocument.body.childNodes;
	                } else {
	                  statusText = JSON.parse(this.contentDocument.body.childNodes[1].textContent).message;
	                }
	              } finally {
	                iframe.removeEventListener('load', iframeLoadListener);
	                document.body.removeChild(iframe);
	                document.body.removeChild(form);

	                reject(new Error(statusText));
	              }
	            };

	            // We use the method of Odoo to check that the iframe has been loaded: a cookie will be set
	            // with the value of the token parameter we set in the form.
	            // The form targets an iframe, so no new page will be opened to trigger the download.

	            var id = 'id' + Date.now();
	            var url = (0, _utils.formatUrl)(_this3.session.location, type);

	            var method = params.method,
	                paramsToSend = _objectWithoutProperties(params, ['method']);

	            paramsToSend.token = id;

	            // COOKIE CATCHER
	            var cookieName = 'fileToken';
	            var delay = 1500;
	            var start = null;
	            var tick = function tick(timestamp) {
	              if (!start) {
	                start = timestamp;
	              }

	              var progress = timestamp - start;
	              if (progress < delay) {
	                requestAnimationFrame(tick);
	              } else {
	                var cookie = (0, _utils.getCookie)(document.cookie, cookieName);

	                if (cookie === id) {
	                  document.cookie = cookieName + '=;expires=' + new Date().toGMTString() + ';path=/';

	                  document.body.removeChild(iframe);
	                  document.body.removeChild(form);

	                  resolve({
	                    result: true
	                  });
	                } else {
	                  requestAnimationFrame(tick);
	                }
	              }
	            };

	            // IFRAME
	            var iframe = document.createElement("iframe");
	            iframe.setAttribute('id', id);
	            iframe.setAttribute('name', id);
	            iframe.setAttribute('hidden', 'hidden');

	            iframe.addEventListener('load', iframeLoadListener, false);

	            document.body.appendChild(iframe);

	            // FORM
	            var form = document.createElement('form');
	            form.setAttribute('method', params.method || 'post');
	            form.setAttribute('action', url);
	            form.setAttribute('target', id);
	            form.setAttribute('hidden', 'hidden');

	            Object.keys(paramsToSend).forEach(function (key) {
	              var hiddenField = document.createElement('input');

	              hiddenField.setAttribute('type', 'hidden');
	              hiddenField.setAttribute('name', key);
	              hiddenField.setAttribute('value', paramsToSend[key]);

	              form.appendChild(hiddenField);
	            });

	            document.body.appendChild(form);

	            // SUBMIT AND WAIT
	            form.submit();
	            requestAnimationFrame(tick);
	          })();
	        } else {
	          reject(new Error('Download for Node.js is not yet implemented'));
	        }
	      });
	    }
	  }, {
	    key: 'login',
	    value: function login() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      this._saveSession(values);

	      var params = {
	        base_location: this.session.location,
	        db: this.session.db,
	        login: this.session.login,
	        password: this.session.autologin ? this.session.password : values.password
	      };

	      return this._request('login', params);
	    }
	  }, {
	    key: 'logout',
	    value: function logout() {
	      var _this4 = this;

	      return this._request('logout').then(function () {
	        _this4._saveSession({
	          session_id: null,
	          sid: null
	        });
	      });
	    }
	  }, {
	    key: 'list',
	    value: function list() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      var params = {
	        model: values.model,
	        fields: values.fields || ['id', 'name'],
	        domain: values.filters || [],
	        sort: values.sort || '',
	        limit: values.limit || false,
	        offset: values.offset || 0,
	        context: _extends({}, this.session.context, values.context)
	      };

	      var options = {
	        avoidPager: values.avoidPager || false
	      };

	      return this._request('list', params, options);
	    }
	  }, {
	    key: 'read',
	    value: function read() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      var params = {
	        model: values.model,
	        method: values.method || 'read',
	        args: [values.id ? [Number(values.id)] : [], values.fields || ['id', 'name']],
	        kwargs: {
	          context: _extends({}, this.session.context, values.context)
	        },
	        context: _extends({}, this.session.context, values.context)
	      };

	      return this._request(params.method, params);
	    }
	  }, {
	    key: 'save',
	    value: function save() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      var options = {
	        fill: []
	      };

	      var params = {
	        model: values.model,
	        method: values.method || (values.id ? 'write' : 'create'),
	        args: [],
	        kwargs: {
	          context: _extends({}, this.session.context, values.context)
	        },
	        context: _extends({}, this.session.context, values.context)
	      };

	      if (values.id) {
	        params.args.push([Number(values.id)]);

	        // /!\ WARNING /!\
	        // If the ID is sent, so we send it back.
	        options.fill.push({
	          name: 'id',
	          value: values.id
	        });
	      }

	      params.args.push(values.data || {});

	      return this._request(params.method, params, options);
	    }
	  }, {
	    key: 'button',
	    value: function button() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      var params = {
	        args: [],
	        domain_id: null
	      };

	      if (values.method) {
	        params.method = values.method;
	      } else if (values.type) {
	        params.type = values.type;
	      }

	      if (values.model) {
	        params.model = values.model;
	      }

	      if (values.id) {
	        params.args.push([Number(values.id)]);
	      }

	      params.context_id = params.args.length - 1;

	      return this._request('button', params);
	    }
	  }, {
	    key: 'report',
	    value: function report() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      var context = _extends({}, this.session.context, {
	        active_model: values.datas && values.datas.model,
	        active_id: values.datas && values.datas.ids && values.datas.ids[0],
	        active_ids: [values.datas && values.datas.ids && values.datas.ids[0]],
	        type: values.datas && values.datas.form && values.datas.form.type
	      });

	      var params = {
	        session_id: this.session.session_id,
	        token: new Date().getTime(),
	        action: JSON.stringify(_extends({}, values, {
	          context: context
	        }))
	      };

	      return this._download('report', params);
	    }
	  }, {
	    key: 'custom',
	    value: function custom() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	      var params = {
	        model: values.model,
	        method: values.method,
	        args: values.data ? [values.data] : [],
	        kwargs: {
	          context: _extends({}, this.session.context, values.context)
	        },
	        context: _extends({}, this.session.context, values.context)
	      };

	      return this._request(params.method, params, options);
	    }
	  }, {
	    key: 'imageLocation',
	    value: function imageLocation() {
	      var values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      var params = ['session_id=' + this.session.session_id, 'model=' + (values.model || ''), 'field=' + (values.field || ''), 'id=' + (values.id || '')];

	      return this.session.location + URLS.IMAGE + '?' + params.join('&');
	    }
	  }]);

	  return OdooClient;
	}();

	exports.default = OdooClient;
	module.exports = exports['default'];

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// the whatwg-fetch polyfill installs the fetch() function
	// on the global object (window or self)
	//
	// Return that as the export for use in Webpack, Browserify etc.
	__webpack_require__(3);
	module.exports = self.fetch.bind(self);


/***/ },
/* 3 */
/***/ function(module, exports) {

	(function(self) {
	  'use strict';

	  if (self.fetch) {
	    return
	  }

	  var support = {
	    searchParams: 'URLSearchParams' in self,
	    iterable: 'Symbol' in self && 'iterator' in Symbol,
	    blob: 'FileReader' in self && 'Blob' in self && (function() {
	      try {
	        new Blob()
	        return true
	      } catch(e) {
	        return false
	      }
	    })(),
	    formData: 'FormData' in self,
	    arrayBuffer: 'ArrayBuffer' in self
	  }

	  function normalizeName(name) {
	    if (typeof name !== 'string') {
	      name = String(name)
	    }
	    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
	      throw new TypeError('Invalid character in header field name')
	    }
	    return name.toLowerCase()
	  }

	  function normalizeValue(value) {
	    if (typeof value !== 'string') {
	      value = String(value)
	    }
	    return value
	  }

	  // Build a destructive iterator for the value list
	  function iteratorFor(items) {
	    var iterator = {
	      next: function() {
	        var value = items.shift()
	        return {done: value === undefined, value: value}
	      }
	    }

	    if (support.iterable) {
	      iterator[Symbol.iterator] = function() {
	        return iterator
	      }
	    }

	    return iterator
	  }

	  function Headers(headers) {
	    this.map = {}

	    if (headers instanceof Headers) {
	      headers.forEach(function(value, name) {
	        this.append(name, value)
	      }, this)

	    } else if (headers) {
	      Object.getOwnPropertyNames(headers).forEach(function(name) {
	        this.append(name, headers[name])
	      }, this)
	    }
	  }

	  Headers.prototype.append = function(name, value) {
	    name = normalizeName(name)
	    value = normalizeValue(value)
	    var list = this.map[name]
	    if (!list) {
	      list = []
	      this.map[name] = list
	    }
	    list.push(value)
	  }

	  Headers.prototype['delete'] = function(name) {
	    delete this.map[normalizeName(name)]
	  }

	  Headers.prototype.get = function(name) {
	    var values = this.map[normalizeName(name)]
	    return values ? values[0] : null
	  }

	  Headers.prototype.getAll = function(name) {
	    return this.map[normalizeName(name)] || []
	  }

	  Headers.prototype.has = function(name) {
	    return this.map.hasOwnProperty(normalizeName(name))
	  }

	  Headers.prototype.set = function(name, value) {
	    this.map[normalizeName(name)] = [normalizeValue(value)]
	  }

	  Headers.prototype.forEach = function(callback, thisArg) {
	    Object.getOwnPropertyNames(this.map).forEach(function(name) {
	      this.map[name].forEach(function(value) {
	        callback.call(thisArg, value, name, this)
	      }, this)
	    }, this)
	  }

	  Headers.prototype.keys = function() {
	    var items = []
	    this.forEach(function(value, name) { items.push(name) })
	    return iteratorFor(items)
	  }

	  Headers.prototype.values = function() {
	    var items = []
	    this.forEach(function(value) { items.push(value) })
	    return iteratorFor(items)
	  }

	  Headers.prototype.entries = function() {
	    var items = []
	    this.forEach(function(value, name) { items.push([name, value]) })
	    return iteratorFor(items)
	  }

	  if (support.iterable) {
	    Headers.prototype[Symbol.iterator] = Headers.prototype.entries
	  }

	  function consumed(body) {
	    if (body.bodyUsed) {
	      return Promise.reject(new TypeError('Already read'))
	    }
	    body.bodyUsed = true
	  }

	  function fileReaderReady(reader) {
	    return new Promise(function(resolve, reject) {
	      reader.onload = function() {
	        resolve(reader.result)
	      }
	      reader.onerror = function() {
	        reject(reader.error)
	      }
	    })
	  }

	  function readBlobAsArrayBuffer(blob) {
	    var reader = new FileReader()
	    reader.readAsArrayBuffer(blob)
	    return fileReaderReady(reader)
	  }

	  function readBlobAsText(blob) {
	    var reader = new FileReader()
	    reader.readAsText(blob)
	    return fileReaderReady(reader)
	  }

	  function Body() {
	    this.bodyUsed = false

	    this._initBody = function(body) {
	      this._bodyInit = body
	      if (typeof body === 'string') {
	        this._bodyText = body
	      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
	        this._bodyBlob = body
	      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
	        this._bodyFormData = body
	      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	        this._bodyText = body.toString()
	      } else if (!body) {
	        this._bodyText = ''
	      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
	        // Only support ArrayBuffers for POST method.
	        // Receiving ArrayBuffers happens via Blobs, instead.
	      } else {
	        throw new Error('unsupported BodyInit type')
	      }

	      if (!this.headers.get('content-type')) {
	        if (typeof body === 'string') {
	          this.headers.set('content-type', 'text/plain;charset=UTF-8')
	        } else if (this._bodyBlob && this._bodyBlob.type) {
	          this.headers.set('content-type', this._bodyBlob.type)
	        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8')
	        }
	      }
	    }

	    if (support.blob) {
	      this.blob = function() {
	        var rejected = consumed(this)
	        if (rejected) {
	          return rejected
	        }

	        if (this._bodyBlob) {
	          return Promise.resolve(this._bodyBlob)
	        } else if (this._bodyFormData) {
	          throw new Error('could not read FormData body as blob')
	        } else {
	          return Promise.resolve(new Blob([this._bodyText]))
	        }
	      }

	      this.arrayBuffer = function() {
	        return this.blob().then(readBlobAsArrayBuffer)
	      }

	      this.text = function() {
	        var rejected = consumed(this)
	        if (rejected) {
	          return rejected
	        }

	        if (this._bodyBlob) {
	          return readBlobAsText(this._bodyBlob)
	        } else if (this._bodyFormData) {
	          throw new Error('could not read FormData body as text')
	        } else {
	          return Promise.resolve(this._bodyText)
	        }
	      }
	    } else {
	      this.text = function() {
	        var rejected = consumed(this)
	        return rejected ? rejected : Promise.resolve(this._bodyText)
	      }
	    }

	    if (support.formData) {
	      this.formData = function() {
	        return this.text().then(decode)
	      }
	    }

	    this.json = function() {
	      return this.text().then(JSON.parse)
	    }

	    return this
	  }

	  // HTTP methods whose capitalization should be normalized
	  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

	  function normalizeMethod(method) {
	    var upcased = method.toUpperCase()
	    return (methods.indexOf(upcased) > -1) ? upcased : method
	  }

	  function Request(input, options) {
	    options = options || {}
	    var body = options.body
	    if (Request.prototype.isPrototypeOf(input)) {
	      if (input.bodyUsed) {
	        throw new TypeError('Already read')
	      }
	      this.url = input.url
	      this.credentials = input.credentials
	      if (!options.headers) {
	        this.headers = new Headers(input.headers)
	      }
	      this.method = input.method
	      this.mode = input.mode
	      if (!body) {
	        body = input._bodyInit
	        input.bodyUsed = true
	      }
	    } else {
	      this.url = input
	    }

	    this.credentials = options.credentials || this.credentials || 'omit'
	    if (options.headers || !this.headers) {
	      this.headers = new Headers(options.headers)
	    }
	    this.method = normalizeMethod(options.method || this.method || 'GET')
	    this.mode = options.mode || this.mode || null
	    this.referrer = null

	    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
	      throw new TypeError('Body not allowed for GET or HEAD requests')
	    }
	    this._initBody(body)
	  }

	  Request.prototype.clone = function() {
	    return new Request(this)
	  }

	  function decode(body) {
	    var form = new FormData()
	    body.trim().split('&').forEach(function(bytes) {
	      if (bytes) {
	        var split = bytes.split('=')
	        var name = split.shift().replace(/\+/g, ' ')
	        var value = split.join('=').replace(/\+/g, ' ')
	        form.append(decodeURIComponent(name), decodeURIComponent(value))
	      }
	    })
	    return form
	  }

	  function headers(xhr) {
	    var head = new Headers()
	    var pairs = (xhr.getAllResponseHeaders() || '').trim().split('\n')
	    pairs.forEach(function(header) {
	      var split = header.trim().split(':')
	      var key = split.shift().trim()
	      var value = split.join(':').trim()
	      head.append(key, value)
	    })
	    return head
	  }

	  Body.call(Request.prototype)

	  function Response(bodyInit, options) {
	    if (!options) {
	      options = {}
	    }

	    this.type = 'default'
	    this.status = options.status
	    this.ok = this.status >= 200 && this.status < 300
	    this.statusText = options.statusText
	    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
	    this.url = options.url || ''
	    this._initBody(bodyInit)
	  }

	  Body.call(Response.prototype)

	  Response.prototype.clone = function() {
	    return new Response(this._bodyInit, {
	      status: this.status,
	      statusText: this.statusText,
	      headers: new Headers(this.headers),
	      url: this.url
	    })
	  }

	  Response.error = function() {
	    var response = new Response(null, {status: 0, statusText: ''})
	    response.type = 'error'
	    return response
	  }

	  var redirectStatuses = [301, 302, 303, 307, 308]

	  Response.redirect = function(url, status) {
	    if (redirectStatuses.indexOf(status) === -1) {
	      throw new RangeError('Invalid status code')
	    }

	    return new Response(null, {status: status, headers: {location: url}})
	  }

	  self.Headers = Headers
	  self.Request = Request
	  self.Response = Response

	  self.fetch = function(input, init) {
	    return new Promise(function(resolve, reject) {
	      var request
	      if (Request.prototype.isPrototypeOf(input) && !init) {
	        request = input
	      } else {
	        request = new Request(input, init)
	      }

	      var xhr = new XMLHttpRequest()

	      function responseURL() {
	        if ('responseURL' in xhr) {
	          return xhr.responseURL
	        }

	        // Avoid security warnings on getResponseHeader when not allowed by CORS
	        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
	          return xhr.getResponseHeader('X-Request-URL')
	        }

	        return
	      }

	      xhr.onload = function() {
	        var options = {
	          status: xhr.status,
	          statusText: xhr.statusText,
	          headers: headers(xhr),
	          url: responseURL()
	        }
	        var body = 'response' in xhr ? xhr.response : xhr.responseText
	        resolve(new Response(body, options))
	      }

	      xhr.onerror = function() {
	        reject(new TypeError('Network request failed'))
	      }

	      xhr.ontimeout = function() {
	        reject(new TypeError('Network request failed'))
	      }

	      xhr.open(request.method, request.url, true)

	      if (request.credentials === 'include') {
	        xhr.withCredentials = true
	      }

	      if ('responseType' in xhr && support.blob) {
	        xhr.responseType = 'blob'
	      }

	      request.headers.forEach(function(value, name) {
	        xhr.setRequestHeader(name, value)
	      })

	      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
	    })
	  }
	  self.fetch.polyfill = true
	})(typeof self !== 'undefined' ? self : this);


/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var SESSION_EXPIRED = exports.SESSION_EXPIRED = 'SESSION_EXPIRED';
	var PENDING_REQUEST = exports.PENDING_REQUEST = 'PENDING_REQUEST';
	var LOGIN_FAILED = exports.LOGIN_FAILED = 'LOGIN_FAILED';

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	// @TODO '=?', '=like', '=ilike'

	var NOT = exports.NOT = '!';
	var OR = exports.OR = '|';
	var AND = exports.AND = '&';
	var LIKE = exports.LIKE = 'like';
	var ILIKE = exports.ILIKE = 'ilike';
	var NOT_ILIKE = exports.NOT_ILIKE = 'not ilike';
	var NOT_LIKE = exports.NOT_LIKE = 'not like';
	var IN = exports.IN = 'in';
	var NOT_IN = exports.NOT_IN = 'not in';
	var CHILD_OF = exports.CHILD_OF = 'child_of';
	var EQUAL = exports.EQUAL = '=';
	var NOT_EQUAL = exports.NOT_EQUAL = '!=';
	var GT = exports.GT = '>';
	var GTE = exports.GTE = '>=';
	var LT = exports.LT = '<';
	var LTE = exports.LTE = '<=';

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var CALL = exports.CALL = '/web/dataset/call_kw';
	var LIST = exports.LIST = '/web/dataset/search_read';
	var BUTTON = exports.BUTTON = '/web/dataset/call_button';
	var LOGIN = exports.LOGIN = '/web/session/authenticate';
	var LOGOUT = exports.LOGOUT = '/web/session/destroy';
	var REPORT = exports.REPORT = '/web/report';
	var ACTION_LOAD = exports.ACTION_LOAD = '/web/action/load';
	var IMAGE = exports.IMAGE = '/web/binary/image';

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getCookie = exports.warning = exports.processError = exports.formatUrl = exports.formatFilters = undefined;

	var _operators = __webpack_require__(5);

	var _urls = __webpack_require__(6);

	var URLS = _interopRequireWildcard(_urls);

	var _errors = __webpack_require__(4);

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

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.resolvePromises = exports.resolveDependencies = exports.checkDependencies = exports.getDependencies = exports.deepMerge = exports.removeDuplicatesFromList = undefined;

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _operators = __webpack_require__(5);

	var _utils = __webpack_require__(7);

	var removeDuplicatesFromList = exports.removeDuplicatesFromList = function removeDuplicatesFromList(list) {
	  return list.reduce(function (prev, next) {
	    if (prev.indexOf(next) === -1) {
	      prev.push(next);
	    }

	    return prev;
	  }, []);
	};

	/**
	 * Merge collections of objects
	 * @param  {Object} target     An object which key is the model name, the value is an array
	 * @param  {Object} newObjects Same as target
	 * @return {Object}            Target updated
	 */
	var deepMerge = exports.deepMerge = function deepMerge(target, newObjects) {
	  var _loop = function _loop(modelName) {
	    newObjects[modelName].forEach(function (newObject) {
	      // Create the model list if it not exists
	      if (!target[modelName]) {
	        target[modelName] = [];
	      }

	      // Find an existing ID
	      var existingTarget = target[modelName].find(function (targetModel) {
	        return targetModel.id === newObject.id;
	      });

	      if (existingTarget) {
	        target[modelName][target[modelName].indexOf(existingTarget)] = _extends({}, existingTarget, newObject);
	      } else {
	        target[modelName].push(newObject);
	      }
	    });
	  };

	  for (var modelName in newObjects) {
	    _loop(modelName);
	  }

	  return target;
	};

	/**
	 * Get dependency list of a model among a list of models
	 * @param  {Object} obj     The object which has a dependencies key
	 * @param  {Array} models   The list of models to search in
	 * @return {Array}
	 */
	var getDependencies = exports.getDependencies = function getDependencies(obj, models) {
	  var deps = obj.dependencies || [];
	  var dependencies = [];

	  // For each dependency model

	  var _loop2 = function _loop2(i) {
	    var ids = [];

	    // We loop in each model collection
	    for (var k in models) {
	      // If the dependency key is found, we get the id
	      if (models[k][deps[i].key]) {
	        // If multiple, we merge the list of ids
	        if (deps[i].multiple) {
	          ids = ids.concat(models[k][deps[i].key]);
	        }
	        // Or we add the id to the list
	        else {
	            ids.push(typeof models[k][deps[i].key] === 'number' ? models[k][deps[i].key] : models[k][deps[i].key][0]);
	          }
	      }
	    }

	    if (ids.length) {
	      // We remove the duplicates
	      ids = removeDuplicatesFromList(ids);

	      var dependency = dependencies.find(function (dep) {
	        return dep.model === deps[i].model;
	      });

	      // If the dependency already exists, we merge and remove the duplicates
	      if (dependency) {
	        dependency.ids = removeDuplicatesFromList(dependency.ids.concat(ids));
	      }
	      // Or we add it
	      else {
	          var _obj = _extends({}, deps[i], {
	            ids: ids
	          });

	          _obj.key && delete _obj.key;
	          _obj.multiple && delete _obj.multiple;

	          dependencies.push(_obj);
	        }
	    }
	  };

	  for (var i in deps) {
	    _loop2(i);
	  }

	  return dependencies;
	};

	var checkDependencies = exports.checkDependencies = function checkDependencies(obj, models) {
	  var deps = obj.dependencies || [];
	  var hasDependencies = false;

	  for (var i in deps) {
	    for (var k in models) {
	      if (models[k][deps[i].key]) {
	        hasDependencies = true;
	        break;
	      }
	    }

	    if (hasDependencies) {
	      break;
	    }
	  }

	  return hasDependencies;
	};

	var resolveDependencies = exports.resolveDependencies = function resolveDependencies(client, response) {
	  return new Promise(function (resolve, reject) {
	    var deps = [];
	    for (var i in client.session.dependencies) {
	      for (var name in response) {
	        if (client.session.dependencies[i].name === name && checkDependencies(client.session.dependencies[i], response[name])) {
	          deps.push(getDependencies(client.session.dependencies[i], response[name]));
	        }
	      }
	    }

	    var mergedDeps = [];
	    if (deps.length) {
	      (function () {
	        // De-duplicate dependencies from model name
	        for (var _i in deps) {
	          var _loop3 = function _loop3(j) {
	            var dep = deps[_i][j];
	            var deepSearch = mergedDeps.filter(function (mergedDep) {
	              return mergedDep.model === dep.model;
	            });
	            var idx = deepSearch.length ? mergedDeps.indexOf(deepSearch[0]) : -1;

	            if (idx === -1) {
	              mergedDeps.push(dep);
	            } else {
	              mergedDeps[idx].ids = mergedDeps[idx].ids.concat(dep.ids);
	            }
	          };

	          for (var j in deps[_i]) {
	            _loop3(j);
	          }
	        }

	        // De-duplicate dependencies from model ids and create promises
	        var promises = [];
	        mergedDeps.forEach(function (dep) {
	          if (response[dep.model]) {
	            var _ids = dep.ids.filter(function (id) {
	              var search = response[dep.model].reduce(function (prev, current) {
	                return current.id === id ? current : prev;
	              }, {});

	              return search.id !== id;
	            });

	            dep.ids = _ids;
	          }

	          if (dep.ids.length) {
	            dep.filters = (0, _utils.formatFilters)([], [["id", _operators.IN, dep.ids]]);
	            delete dep.ids;

	            promises.push(client.list(dep));
	          }
	        });

	        if (promises.length) {
	          resolvePromises(client, promises, response).then(function (responseWithDependencies) {
	            resolve(deepMerge(response, responseWithDependencies));
	          }).catch(function (error) {
	            return reject(error);
	          });
	        } else {
	          resolve(response);
	        }
	      })();
	    } else {
	      resolve(response);
	    }
	  });
	};

	var resolvePromises = exports.resolvePromises = function resolvePromises(client, promises) {
	  var responseCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	  return new Promise(function (resolve, reject) {
	    Promise.all(promises).then(function (values) {
	      var response = {};

	      values.forEach(function (value) {
	        if (value.model && value.result) {
	          response[value.model] = value.result;
	        }
	      });

	      resolveDependencies(client, deepMerge(responseCache, response)).then(function (responseWithDependencies) {
	        resolve(responseWithDependencies);
	      }).catch(function (error) {
	        return reject(error);
	      });
	    }, function (error) {
	      reject(error);
	    });
	  });
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	var CALL = exports.CALL = 'CALL';
	var LIST = exports.LIST = 'LIST';
	var BUTTON = exports.BUTTON = 'BUTTON';
	var LOGIN = exports.LOGIN = 'LOGIN';
	var LOGOUT = exports.LOGOUT = 'LOGOUT';
	var REPORT = exports.REPORT = 'REPORT';
	var ACTION_LOAD = exports.ACTION_LOAD = 'ACTION_LOAD';
	var IMAGE = exports.IMAGE = 'IMAGE';

/***/ }
/******/ ]);