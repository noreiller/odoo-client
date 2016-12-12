'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _isomorphicFetch = require('isomorphic-fetch');

var _isomorphicFetch2 = _interopRequireDefault(_isomorphicFetch);

var _errors = require('./errors');

var ERRORS = _interopRequireWildcard(_errors);

var _operators = require('./operators');

var OPERATORS = _interopRequireWildcard(_operators);

var _urls = require('./urls');

var URLS = _interopRequireWildcard(_urls);

var _utils = require('./utils');

var _resolver = require('./resolver');

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