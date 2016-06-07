import fetch from 'isomorphic-fetch'
import * as ERRORS from './errors'
import * as OPERATORS from './operators'
import * as URLS from './urls'
import { formatUrl, processError, warning } from './utils'
import { resolveDependencies } from './resolver'

const isBrowser = typeof document !== 'undefined'
let _counter = 0
const _queue = []
const _sessions = {}
const _defaultSession = {
  location: null,
  db: null,
  login: null,
  password: null,
  sid: null,
  session_id: null,
  context: {},
  autologin: false,
  dbs: {},
}

export default class OdooClient {
  constructor(values = {}) {
    this.instanceId = `s_${++_counter}_${Date.now()}`
    this.counter = 0
    this.session = {}

    this._saveSession({
      ..._defaultSession,
      ...values,
    })

    return this
  }

  _saveSession(session) {
    const values = {
      ...session
    }

    warning(
      values.password && isBrowser,
      `You provided a "password", use with caution in the browser since it can be exposed. Prefer use it only on the server.`
    )

    warning(
      values.autologin && !values.password,
      `"autologin" is enabled but you didn't provide a "password", so any autologin request will fail.`
    )

    if (!values.autologin && values.password) {
      values.password = _defaultSession.password
    }

    this.session = {
      ...this.session,
      ...values,
    }

    _sessions[this.instanceId] = {
      ...this.session
    }
  }

  _request(...args) {
    return new Promise((resolve, reject) => {
      const callback = () => {
        this._performRequest.apply(this, args)
          .then(resolve)
          .catch(reject)
      }

      if (args[0] !== 'login' && !this.session.session_id && this.session.autologin && this.session.password) {
        this.login().then(callback).catch(reject)
      }
      else {
        callback.apply(this)
      }
    })
  }

  _performRequest(type, data = {}, options = {}) {
    const params = {
      ...data
    }

    return new Promise((resolve, reject) => {
      if (this.session.session_id) {
        params.session_id = this.session.session_id
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
          this._saveSession({
            session_id: body.result.session_id,
            context: body.result.user_context,
          })
        }
        else if (body.result && body.result.user_context) {
          this._saveSession({
            context: body.result.user_context,
          })
        }

        let result
        let length
        if (body.result) {
          // list
          if (body.result && typeof body.result.records !== 'undefined') {
            result = body.result.records
            length = body.result.length
          }
          else {
            result = typeof body.result[0] !== 'undefined' ? body.result[0] : body.result

            // single
            if (result.value) {
              result = result.value
            }

            // boolean
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

        if (length && !options.avoidPager) {
          response.length = length
        }

        if (params.offset && !options.avoidPager) {
          response.offset = params.offset
        }

        const responseWithModel = {
          [params.model]: length ? response.result : [response.result]
        }

        resolveDependencies(this, responseWithModel).then((dependencies) => {
          delete dependencies[params.model]
          response.dependencies = dependencies

          resolve(response)
        })
      }

      const onError = (err) => {
        onComplete()
        reject(err)
      }

      let headers

      if (isBrowser) {
        headers = new Headers()
        headers.append("Content-Type", "application/json")
        headers.append("Cookie", `${this.session.sid};`)
      }
      else {
        headers = {}
        headers["Content-Type"] = "application/json"
        headers["Cookie"] = `${this.session.sid};`
      }

      fetch(
        formatUrl(this.session.location, type, params),
        {
          method: "POST",
          body: JSON.stringify({
            id: (`r${++this.counter}`),
            jsonrpc: '2.0',
            method: 'call',
            params,
          }),
          headers,
          credentials: 'include',
        }
      )
        .then((req) => {
          if (req.headers.get('set-cookie')) {
            const sid = req.headers.get('set-cookie').split(';')[0]

            if (sid) {
              this._saveSession({
                sid
              })
            }
          }

          return req
        })
        .then((req) => req.json())
        .then(onSuccess)
        .catch(onError)
    })
  }

  /**
   * @todo server alternative
   */
  download(type, params) {
    const id = `id${Date.now()}`

    // IFRAME
    const iframe = document.createElement("iframe")
    iframe.setAttribute('id', id)
    iframe.setAttribute('name', id)
    iframe.setAttribute('hidden', 'hidden')
    document.body.appendChild(iframe)

    function iframeLoadListener() {
      try {
        var statusText

        if (!this.contentDocument.body.childNodes[1]) {
          statusText = this.contentDocument.body.childNodes
        }
        else {
          statusText = JSON.parse(this.contentDocument.body.childNodes[1].textContent).message
        }
      }
      finally {
        iframe.removeEventListener('load', iframeLoadListener)
        document.body.removeChild(iframe)
        document.body.removeChild(form)
      }
    }

    iframe.addEventListener('load', iframeLoadListener, false)

    // FORM
    // @see https://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
    const form = document.createElement('form')
    form.setAttribute('method', params.method || 'post')
    form.setAttribute('action', _makeUrl(type))
    form.setAttribute('target', id)
    form.setAttribute('hidden', 'hidden')

    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        const hiddenField = document.createElement('input')

        hiddenField.setAttribute('type', 'hidden')
        hiddenField.setAttribute('name', key)
        hiddenField.setAttribute('value', params[key])

        form.appendChild(hiddenField)
      }
    }

    document.body.appendChild(form)
    form.submit()
  }

  login(values = {}) {
    this._saveSession(values)

    const params = {
      base_location: this.session.location,
      db: this.session.db,
      login: this.session.login,
      password: this.session.autologin ? this.session.password : values.password,
    }

    return this._request('login', params)
  }

  logout() {
    return this._request('logout').then(() => {
      this._saveSession({
        session_id: null,
        sid: null,
      })
    })
  }

  list(values = {}) {
    const params = {
      model: values.model,
      fields: values.fields || ['id', 'name'],
      domain: values.filters || [],
      sort: values.sort || '',
      limit: values.limit || false,
      offset: values.offset || 0,
      context: {
        ...this.session.context,
        ...values.context
      },
    }

    const options = {
      avoidPager: values.avoidPager || false
    }

    return this._request('list', params, options)
  }

  read(values = {}) {
    const params = {
      model: values.model,
      method: values.method || 'read',
      args: [
        values.id ? [Number(values.id)] : [],
        values.fields || ['id', 'name'],
      ],
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

  save(values = {}) {
    const options = {
      fill: [],
    }

    const params = {
      model: values.model,
      method: values.method || (values.id ? 'write' : 'create'),
      args: [],
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

    if (values.id) {
      params.args.push([Number(values.id)])

      // /!\ WARNING /!\
      // If the ID is sent, so we send it back.
      options.fill.push({
        name: 'id',
        value: values.id,
      })
    }

    params.args.push(values.data || {})

    return this._request(params.method, params, options)
  }

  button(values = {}) {
    const params = {
      args: [],
      domain_id: null,
    }

    if (values.method) {
      params.method = values.method
    }
    else if (values.type) {
      params.type = values.type
    }

    if (values.model) {
      params.model = values.model
    }

    if (values.id) {
      params.args.push([Number(values.id)])
    }

    params.context_id = params.args.length - 1

    return this._request('button', params)
  }

  report(values = {}) {
    const context = {
      ...this.session.context,
      active_model: values.datas && values.datas.model,
      active_id: values.datas && values.datas.ids && values.datas.ids[0],
      active_ids: [values.datas && values.datas.ids && values.datas.ids[0]],
      type: values.datas && values.datas.form && values.datas.form.type,
    }

    const params = {
      session_id: this.session.session_id,
      token: new Date().getTime(),
      action: JSON.stringify({
        ...values,
        context,
      }),
    }

    this._download('report', params)
  }

  custom(values = {}, options = {}) {
    const params = {
      model: values.model,
      method: values.method,
      args: values.data ? [values.data] : [],
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

    return this._request(params.method, params, options)
  }

  imageLocation(values = {}) {
    const params = [
      `session_id=${this.session.session_id}`,
      `model=${values.model || ''}`,
      `field=${values.field || ''}`,
      `id=${values.id || ''}`,
    ]

    return `${this.session.location + URLS.IMAGE}?${params.join('&')}`
  }
}
