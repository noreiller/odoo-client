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
	exports.createClient = exports.TYPES = exports.OPERATORS = exports.OdooClient = undefined;

	var _client = __webpack_require__(1);

	var _client2 = _interopRequireDefault(_client);

	var _operators = __webpack_require__(5);

	var OPERATORS = _interopRequireWildcard(_operators);

	var _types = __webpack_require__(9);

	var TYPES = _interopRequireWildcard(_types);

	var _urls = __webpack_require__(6);

	var URLS = _interopRequireWildcard(_urls);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.OdooClient = _client2.default;
	exports.OPERATORS = OPERATORS;
	exports.TYPES = TYPES;
	const createClient = exports.createClient = values => {
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

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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

	const isBrowser = typeof document !== 'undefined';
	let _counter = 0;
	const _queue = [];
	const _sessions = {};
	const _defaultSession = {
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

	class OdooClient {
	  constructor() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    this.instanceId = `s_${ ++_counter }_${ Date.now() }`;
	    this.counter = 0;
	    this.session = {};

	    this._saveSession(_extends({}, _defaultSession, values));

	    return this;
	  }

	  _saveSession(session) {
	    const values = _extends({}, session);

	    (0, _utils.warning)(values.password && isBrowser, `You provided a "password", use with caution in the browser since it can be exposed. Prefer use it only on the server.`);

	    (0, _utils.warning)(values.autologin && !values.password, `"autologin" is enabled but you didn't provide a "password", so any autologin request will fail.`);

	    if (!values.autologin && values.password) {
	      values.password = _defaultSession.password;
	    }

	    this.session = _extends({}, this.session, values);

	    _sessions[this.instanceId] = _extends({}, this.session);
	  }

	  _request() {
	    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    return new Promise((resolve, reject) => {
	      const callback = () => {
	        this._performRequest.apply(this, args).then(resolve).catch(reject);
	      };

	      if (args[0] !== 'login' && !this.session.session_id && this.session.autologin && this.session.password) {
	        this.login().then(callback).catch(reject);
	      } else {
	        callback.apply(this);
	      }
	    });
	  }

	  _performRequest(type) {
	    let data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	    let options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	    const params = _extends({}, data);

	    return new Promise((resolve, reject) => {
	      if (this.session.session_id) {
	        params.session_id = this.session.session_id;
	      }

	      // If this request has already been performed, cancel it.
	      if (_queue.indexOf(JSON.stringify(params)) !== -1) {
	        reject(new Error(ERRORS.PENDING_REQUEST));
	      }
	      // Or add it to the queue.
	      else {
	          _queue.push(JSON.stringify(params));
	        }

	      const onComplete = () => {
	        _queue.splice(_queue.indexOf(JSON.stringify(params)), 1);
	      };

	      const onSuccess = body => {
	        onComplete();

	        // Handle error
	        if (body.error) {
	          return reject((0, _utils.processError)(body.error.data));
	        } else if (body.result && body.result.uid === false) {
	          return reject(new Error(ERRORS.LOGIN_FAILED));
	        }

	        // User infos
	        if (body.result && body.result.session_id) {
	          this._saveSession({
	            session_id: body.result.session_id,
	            context: body.result.user_context
	          });
	        } else if (body.result && body.result.user_context) {
	          this._saveSession({
	            context: body.result.user_context
	          });
	        }

	        let result;
	        let length;
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
	              options.fill.forEach(field => {
	                if (!result[field.name]) {
	                  result[field.name] = field.value;
	                }
	              });
	            }
	          }
	        } else {
	          result = body.result;
	        }

	        const response = {
	          result,
	          model: params.model
	        };

	        if (length && !options.avoidPager) {
	          response.length = length;
	        }

	        if (params.offset && !options.avoidPager) {
	          response.offset = params.offset;
	        }

	        const resultIsList = typeof response.result === 'object' && typeof response.length !== 'undefined';
	        const responseWithModel = {
	          [params.model]: resultIsList ? response.result : [response.result]
	        };

	        (0, _resolver.resolveDependencies)(this, responseWithModel).then(dependencies => {
	          delete dependencies[params.model];

	          response.dependencies = dependencies;

	          resolve(response);
	        });
	      };

	      const onError = err => {
	        onComplete();
	        reject(err);
	      };

	      let headers;

	      if (isBrowser) {
	        headers = new Headers();
	        headers.append("Content-Type", "application/json");
	        headers.append("Cookie", `${ this.session.sid };`);
	      } else {
	        headers = {};
	        headers["Content-Type"] = "application/json";
	        headers["Cookie"] = `${ this.session.sid };`;
	      }

	      (0, _isomorphicFetch2.default)((0, _utils.formatUrl)(this.session.location, type, params), {
	        method: "POST",
	        body: JSON.stringify({
	          id: `r${ ++this.counter }`,
	          jsonrpc: '2.0',
	          method: 'call',
	          params
	        }),
	        headers,
	        credentials: 'include'
	      }).then(req => {
	        if (req.headers.get('set-cookie')) {
	          const sid = req.headers.get('set-cookie').split(';')[0];

	          if (sid) {
	            this._saveSession({
	              sid
	            });
	          }
	        }

	        return req;
	      }).then(req => req.json()).then(onSuccess).catch(onError);
	    });
	  }

	  /**
	   * @todo server alternative
	   */
	  download(type, params) {
	    const id = `id${ Date.now() }`;

	    // IFRAME
	    const iframe = document.createElement("iframe");
	    iframe.setAttribute('id', id);
	    iframe.setAttribute('name', id);
	    iframe.setAttribute('hidden', 'hidden');
	    document.body.appendChild(iframe);

	    function iframeLoadListener() {
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
	      }
	    }

	    iframe.addEventListener('load', iframeLoadListener, false);

	    // FORM
	    // @see https://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
	    const form = document.createElement('form');
	    form.setAttribute('method', params.method || 'post');
	    form.setAttribute('action', _makeUrl(type));
	    form.setAttribute('target', id);
	    form.setAttribute('hidden', 'hidden');

	    for (let key in params) {
	      if (params.hasOwnProperty(key)) {
	        const hiddenField = document.createElement('input');

	        hiddenField.setAttribute('type', 'hidden');
	        hiddenField.setAttribute('name', key);
	        hiddenField.setAttribute('value', params[key]);

	        form.appendChild(hiddenField);
	      }
	    }

	    document.body.appendChild(form);
	    form.submit();
	  }

	  login() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    this._saveSession(values);

	    const params = {
	      base_location: this.session.location,
	      db: this.session.db,
	      login: this.session.login,
	      password: this.session.autologin ? this.session.password : values.password
	    };

	    return this._request('login', params);
	  }

	  logout() {
	    return this._request('logout').then(() => {
	      this._saveSession({
	        session_id: null,
	        sid: null
	      });
	    });
	  }

	  list() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    const params = {
	      model: values.model,
	      fields: values.fields || ['id', 'name'],
	      domain: values.filters || [],
	      sort: values.sort || '',
	      limit: values.limit || false,
	      offset: values.offset || 0,
	      context: _extends({}, this.session.context, values.context)
	    };

	    const options = {
	      avoidPager: values.avoidPager || false
	    };

	    return this._request('list', params, options);
	  }

	  read() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    const params = {
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

	  save() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    const options = {
	      fill: []
	    };

	    const params = {
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

	  button() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    const params = {
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

	  report() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    const context = _extends({}, this.session.context, {
	      active_model: values.datas && values.datas.model,
	      active_id: values.datas && values.datas.ids && values.datas.ids[0],
	      active_ids: [values.datas && values.datas.ids && values.datas.ids[0]],
	      type: values.datas && values.datas.form && values.datas.form.type
	    });

	    const params = {
	      session_id: this.session.session_id,
	      token: new Date().getTime(),
	      action: JSON.stringify(_extends({}, values, {
	        context
	      }))
	    };

	    this._download('report', params);
	  }

	  custom() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	    let options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	    const params = {
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

	  imageLocation() {
	    let values = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    const params = [`session_id=${ this.session.session_id }`, `model=${ values.model || '' }`, `field=${ values.field || '' }`, `id=${ values.id || '' }`];

	    return `${ this.session.location + URLS.IMAGE }?${ params.join('&') }`;
	  }
	}
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
	const SESSION_EXPIRED = exports.SESSION_EXPIRED = 'SESSION_EXPIRED';
	const PENDING_REQUEST = exports.PENDING_REQUEST = 'PENDING_REQUEST';
	const LOGIN_FAILED = exports.LOGIN_FAILED = 'LOGIN_FAILED';

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	// @TODO '=?', '=like', '=ilike'

	const NOT = exports.NOT = '!';
	const OR = exports.OR = '|';
	const AND = exports.AND = '&';
	const LIKE = exports.LIKE = 'like';
	const ILIKE = exports.ILIKE = 'ilike';
	const NOT_ILIKE = exports.NOT_ILIKE = 'not ilike';
	const NOT_LIKE = exports.NOT_LIKE = 'not like';
	const IN = exports.IN = 'in';
	const NOT_IN = exports.NOT_IN = 'not in';
	const CHILD_OF = exports.CHILD_OF = 'child_of';
	const EQUAL = exports.EQUAL = '=';
	const NOT_EQUAL = exports.NOT_EQUAL = '!=';
	const GT = exports.GT = '>';
	const GTE = exports.GTE = '>=';
	const LT = exports.LT = '<';
	const LTE = exports.LTE = '<=';

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	const CALL = exports.CALL = '/web/dataset/call_kw';
	const LIST = exports.LIST = '/web/dataset/search_read';
	const BUTTON = exports.BUTTON = '/web/dataset/call_button';
	const LOGIN = exports.LOGIN = '/web/session/authenticate';
	const LOGOUT = exports.LOGOUT = '/web/session/destroy';
	const REPORT = exports.REPORT = '/web/report';
	const ACTION_LOAD = exports.ACTION_LOAD = '/web/action/load';
	const IMAGE = exports.IMAGE = '/web/binary/image';

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.warning = exports.processError = exports.formatUrl = exports.formatFilters = undefined;

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

	/**
	 * Expose a warning if some condition is fulfilled
	 * @param  {Boolean} condition
	 * @param  {String(s)} ...args
	 */
	const warning = exports.warning = function warning(condition) {
	  if (condition) {
	    console.warn((arguments.length <= 1 ? undefined : arguments[1]) || '', (arguments.length <= 2 ? undefined : arguments[2]) || '', (arguments.length <= 3 ? undefined : arguments[3]) || '', (arguments.length <= 4 ? undefined : arguments[4]) || '');
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

	const removeDuplicatesFromList = exports.removeDuplicatesFromList = list => {
	  return list.reduce((prev, next) => {
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
	const deepMerge = exports.deepMerge = (target, newObjects) => {
	  for (let modelName in newObjects) {
	    newObjects[modelName].forEach(newObject => {
	      // Create the model list if it not exists
	      if (!target[modelName]) {
	        target[modelName] = [];
	      }

	      // Find an existing ID
	      const existingTarget = target[modelName].find(targetModel => targetModel.id === newObject.id);

	      if (existingTarget) {
	        target[modelName][target[modelName].indexOf(existingTarget)] = _extends({}, existingTarget, newObject);
	      } else {
	        target[modelName].push(newObject);
	      }
	    });
	  }

	  return target;
	};

	/**
	 * Get dependency list of a model among a list of models
	 * @param  {Object} obj     The object which has a dependencies key
	 * @param  {Array} models   The list of models to search in
	 * @return {Array}
	 */
	const getDependencies = exports.getDependencies = (obj, models) => {
	  const deps = obj.dependencies || [];
	  let dependencies = [];

	  // For each dependency model
	  for (let i in deps) {
	    let ids = [];

	    // We loop in each model collection
	    for (let k in models) {
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

	      const dependency = dependencies.find(dep => dep.model === deps[i].model);

	      // If the dependency already exists, we merge and remove the duplicates
	      if (dependency) {
	        dependency.ids = removeDuplicatesFromList(dependency.ids.concat(ids));
	      }
	      // Or we add it
	      else {
	          const obj = _extends({}, deps[i], {
	            ids
	          });

	          obj.key && delete obj.key;
	          obj.multiple && delete obj.multiple;

	          dependencies.push(obj);
	        }
	    }
	  }

	  return dependencies;
	};

	const checkDependencies = exports.checkDependencies = (obj, models) => {
	  const deps = obj.dependencies || [];
	  let hasDependencies = false;

	  for (let i in deps) {
	    for (let k in models) {
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

	const resolveDependencies = exports.resolveDependencies = (client, response) => {
	  return new Promise((resolve, reject) => {
	    let deps = [];
	    for (let i in client.session.dependencies) {
	      for (let name in response) {
	        if (client.session.dependencies[i].name === name && checkDependencies(client.session.dependencies[i], response[name])) {
	          deps.push(getDependencies(client.session.dependencies[i], response[name]));
	        }
	      }
	    }

	    let mergedDeps = [];
	    if (deps.length) {
	      // De-duplicate dependencies from model name
	      for (let i in deps) {
	        for (let j in deps[i]) {
	          let dep = deps[i][j];
	          let deepSearch = mergedDeps.filter(mergedDep => mergedDep.model === dep.model);
	          let idx = deepSearch.length ? mergedDeps.indexOf(deepSearch[0]) : -1;

	          if (idx === -1) {
	            mergedDeps.push(dep);
	          } else {
	            mergedDeps[idx].ids = mergedDeps[idx].ids.concat(dep.ids);
	          }
	        }
	      }

	      // De-duplicate dependencies from model ids and create promises
	      let promises = [];
	      mergedDeps.forEach(dep => {
	        if (response[dep.model]) {
	          let ids = dep.ids.filter(id => {
	            let search = response[dep.model].reduce((prev, current) => {
	              return current.id === id ? current : prev;
	            }, {});

	            return search.id !== id;
	          });

	          dep.ids = ids;
	        }

	        if (dep.ids.length) {
	          dep.filters = (0, _utils.formatFilters)([], [["id", _operators.IN, dep.ids]]);
	          delete dep.ids;

	          promises.push(client.list(dep));
	        }
	      });

	      if (promises.length) {
	        resolvePromises(client, promises, response).then(responseWithDependencies => {
	          resolve(deepMerge(response, responseWithDependencies));
	        }).catch(error => reject(error));
	      } else {
	        resolve(response);
	      }
	    } else {
	      resolve(response);
	    }
	  });
	};

	const resolvePromises = exports.resolvePromises = function resolvePromises(client, promises) {
	  let responseCache = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

	  return new Promise((resolve, reject) => {
	    Promise.all(promises).then(values => {
	      let response = {};

	      values.forEach(value => {
	        if (value.model && value.result) {
	          response[value.model] = value.result;
	        }
	      });

	      resolveDependencies(client, deepMerge(responseCache, response)).then(responseWithDependencies => {
	        resolve(responseWithDependencies);
	      }).catch(error => reject(error));
	    }, error => {
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
	const CALL = exports.CALL = 'CALL';
	const LIST = exports.LIST = 'LIST';
	const BUTTON = exports.BUTTON = 'BUTTON';
	const LOGIN = exports.LOGIN = 'LOGIN';
	const LOGOUT = exports.LOGOUT = 'LOGOUT';
	const REPORT = exports.REPORT = 'REPORT';
	const ACTION_LOAD = exports.ACTION_LOAD = 'ACTION_LOAD';
	const IMAGE = exports.IMAGE = 'IMAGE';

/***/ }
/******/ ]);