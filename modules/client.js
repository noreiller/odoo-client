import fetch from 'isomorphic-fetch'
import * as ERRORS from './errors'
import * as OPERATORS from './operators'
import * as URLS from './urls'
import { formatUrl, processError, warning } from './utils'

let _counter = 0
const _queue = []
const _sessions = {}
const _defaultSession = {
  location: null,
  db: null,
  login: null,
  password: null,
  sid: null,
  context: {},
  autologin: false,
}

export default class OdooClient {
  constructor(values = {}) {
    this.instanceId = `s_${++_counter}_${Date.now()}`
    this.counter = 0
    this.session = {
      ..._defaultSession,
      ...values,
    }

    this._saveSession()

    return this
  }

  _saveSession() {
    warning(
      this.session.password,
      `You provided a "password", use with caution in the browser since it can be exposed. Prefer use it only on the server.`
    )

    warning(
      this.session.autologin && !this.session.password,
      `"autologin" is enabled but you didn't provide a "password", so any autologin request will fail.`
    )

    if (!this.session.autologin) {
      this.session.password = _defaultSession.password
    }

    _sessions[this.instanceId] = {
      ...this.session
    }
  }

  _request(...args) {
    return this._performRequest.apply(this, args)

    // @TODO
    // create promise to catch a request
    // IF: no login request + no sid + autologin + password => login
    // ELSE: _performRequest()

    // IF: autologin request + reject => reject
    // IF: reject session + autologin => login
    // ELSE: resolve

    // return new Promise((resolve, reject) => {
    //   const callback = () => {
    //     this._performRequest.apply(this, args)
    //       .then(resolve)
    //       .catch(reject)
    //   }
    //
    //   if (args[0] !== 'login' && !this.session.sid && this.session.autologin && this.session.password) {
    //     this.login().then(callback).catch(reject)
    //   }
    //   else {
    //     callback.apply(this)
    //   }
    // })
  }

  _performRequest(type, params = {}, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.session.sid) {
        params.session_id = this.session.sid
      }

      // If this request has already been performed, cancel it.
      if (_queue.indexOf(JSON.stringify(params)) !== -1) {
        reject(new Error(ERRORS.PENDING_REQUEST))
      }
      // Or add it to the queue.
      else {
        _queue.push(JSON.stringify(params))
      }

      const onComplete = () => {
        _queue.splice(_queue.indexOf(JSON.stringify(params)), 1)
      }

      const onSuccess = (body) => {
        onComplete()

        // Handle error
        if (body.error) {
          return reject(processError(body.error.data))
        }
        else if (body.result && body.result.uid === false) {
          return reject(new Error(ERRORS.LOGIN_FAILED))
        }

        // User infos
        if (body.result && body.result.session_id) {
          this.session.sid = body.result.session_id
          this.session.context = body.result.user_context
          this._saveSession()
        }

        if (body.result && body.result.user_context) {
          this.session.context = body.result.user_context
          this._saveSession()
        }

        let result
        let length
        if (body.result) {
          if (body.result && typeof body.result.records !== 'undefined') {
            result = body.result.records
            length = body.result.length
          } else {
            result = typeof body.result[0] !== 'undefined' ? body.result[0] : body.result

            if (result.value) {
              result = result.value
            }

            if (typeof result === 'boolean') {
              result = {
                value: result,
              }
            }

            if (typeof options.fill !== 'undefined') {
              options.fill.forEach((field) => {
                if (!result[field.name]) {
                  result[field.name] = field.value
                }
              })
            }
          }
        }
        else {
          result = body.result
        }

        const response = {
          result,
          model: params.model,
        }

        if (options.avoidPager !== true) {
          response.length = length
          response.offset = params.offset
        }

        return resolve(response)
      }

      const onError = (err) => {
        onComplete()

        return reject(err)
      }

      fetch(
        formatUrl(this.session.location, type, params),
        {
          method: "POST",
          body: JSON.stringify({
            id: (`r${++this.counter}`),
            jsonrpc: '2.0',
            method: 'call',
            params: params,
          }),
          headers: {
            "Content-type": "application/json",
          },
          credentials: 'omit',
        }
      )
        .then((req) => req.json())
        .then(onSuccess)
        .catch(onError)
    })
  }

  login(values = {}) {
    let needSave = false

    if (values.login) {
      this.session.login = values.login
      needSave = true
    }

    if (values.password) {
      this.session.password = values.password
      needSave = true
    }

    if (values.location) {
      this.session.location = values.location
      needSave = true
    }

    if (values.db) {
      this.session.db = values.db
      needSave = true
    }

    if (needSave) {
      this._saveSession()
    }

    const params = {
      base_location: this.session.location,
      db: this.session.db,
      login: this.session.login,
      password: values.password,
    }

    return this._request('login', params)
  }

  logout(values = {}) {
    return this._request('logout').then(() => {
      this.session = {
        ...this.session,
        sid: null
      }

      this._saveSession()
    });
  }

  read(values = {}) {
    const params = {
      model: values.model,
      method: values.method || 'read',
      fields: values.fields || ['id', 'name'],
      args: values.id ? [Number(values.id)] : [],
      kwargs: {
        context: {
          ...this.session.context,
          ...values.context
        },
      },
      context: {
        ...this.session.context,
        ...values.context
      },
    }

    return this._request(params.method, params)
  }

  imageLocation(values = {}) {
    const params = [
      `session_id=${this.session.sid}`,
      `model=${values.model || ''}`,
      `field=${values.field || ''}`,
      `id=${values.id || ''}`,
    ]

    return `${this.session.location + URLS.IMAGE}?${params.join('&')}`
  }
}
