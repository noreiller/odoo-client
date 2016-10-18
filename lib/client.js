'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
  _download(type, params) {
    return new Promise((resolve, reject) => {
      if (isBrowser) {
        const id = `id${ Date.now() }`;
        const url = (0, _utils.formatUrl)(this.session.location, type);

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
        form.setAttribute('action', url);
        form.setAttribute('target', id);
        form.setAttribute('hidden', 'hidden');

        for (let key in params) {
          const hiddenField = document.createElement('input');

          hiddenField.setAttribute('type', 'hidden');
          hiddenField.setAttribute('name', key);
          hiddenField.setAttribute('value', params[key]);

          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        form.submit();

        resolve({
          result: true
        });
      } else {
        reject(new Error('Download for Node.js is not yet implemented'));
      }
    });
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

    return this._download('report', params);
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