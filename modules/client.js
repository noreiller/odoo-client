import fetch from 'isomorphic-fetch'
import * as URLS from './urls'
import * as OPERATORS from './operators'
import { formatUrl } from './utils'

const _counter = 0
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

const OdooClient = (session, instanceId) => {
  this.instanceId = instanceId
  this.counter = 0
  this.session = {
    ..._defaultSession,
    ...session
  }

  this._saveSession()

  return this
}

OdooClient.prototype._saveSession = () => {
  if (!this.session.autologin) {
    this.session.password = _defaultSession.password
  }

  _sessions[this.instanceId] = {
    ...this.session
  }
}

OdooClient.prototype._sendRequest = (type, params = {}, options = {}) => {
  const self = this

  return new Promise((resolve, reject) => {
    if (self.session.sid) {
      params.session_id = self.session.sid
    }

    // If this request has already been performed, cancel it.
    if (_queue.indexOf(JSON.stringify(params)) !== -1) {
      reject('PendingRequest')
    }
    // Or add it to the queue.
    else {
      _queue.push(JSON.stringify(params))
    }

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: params,
      id: (`r${++self.counter}`),
    }

    const onSuccess = (body) => {
      _queue.splice(_queue.indexOf(JSON.stringify(params)), 1)

      // Handle error
      if (body.error) {
        if (body.error.data.debug.indexOf('SessionExpiredException') !== -1) {
          reject('SessionExpiredException')
        }
        else {
          reject(body.error.data.fault_code)
        }
      }

      // User infos
      if (body.result && body.result.session_id) {
        self.session.sid = body.result.session_id
        self.session.context = body.result.user_context
        self._saveSession()
      }

      if (body.result && body.result.user_context) {
        self.session.context = body.result.user_context
        self._saveSession()
      }

      let result
      const length
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

      resolve(response)
    }

    const onError = (err) => {
      _queue.splice(_queue.indexOf(JSON.stringify(params)), 1)

      reject(err.message)
    }

    fetch(
      formatUrl(self.session.location, type, params),
      { data }
    )
      .then((req) => req.json())
      .then(onSuccess)
      .catch(onError)
  })
}

OdooClient.prototype.login = (values) => {
  const params = {
    login: values.login,
    password: values.password,
    base_location: values.location || this.session.location,
    db: values.db || this.session.db,
  })

  this.session = {
    ...this.session,
    ...params,
  }

  this._saveSession()

  return this._sendRequest('login', params)
}

OdooClient.prototype.logout = (values) => {
  this.session = {
    ...this.session,
    sid: null
  }

  this._saveSession()

  return this._sendRequest('logout');
}

OdooClient.prototype.read = (values) => {
  const params = {
    model: values.model,
    method: values.method || 'read',
    fields: values.fields || ['id', 'name'],
    args: values.id ? [Number(values.id)] || [],
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

  return this._sendRequest(params.method, params)
}

OdooClient.prototype.imageLocation = (values) => {
  const params = [
    `session_id=${this.session.sid}`,
    `model=${values.model}`,
    `field=${values.field}`,
    `id=${values.id}`,
  ]

  return `${this.session.location + URLS.IMAGE}?${params.join('&')}`
}

export const createClient = (values) => {
  return new OdooClient(values, `s_${++_counter}_${Date.now()}`)
}
