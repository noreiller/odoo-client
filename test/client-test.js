import expect from 'expect'

import OdooClient from '../modules/client'
import { IMAGE } from '../modules/urls'
import { LOGIN_FAILED } from '../modules/errors'

const ODOO_LOCATION = process.env.ODOO_LOCATION
const ODOO_DB = process.env.ODOO_DB
const ODOO_LOGIN = process.env.ODOO_LOGIN
const ODOO_PASSWORD = process.env.ODOO_PASSWORD

describe('client', () => {

  describe('constructor()', () => {
    it('should return an instance of OdooClient', () => {
      expect(new OdooClient).toBeA(OdooClient)
    })

    it('should return a unique instanceId', () => {
      expect((new OdooClient).instanceId).toNotEqual((new OdooClient).instanceId)
    })
  })

  describe('_saveSession()', () => {
    it('should remove the password if no autologin', () => {
      const session = {
        password: 'password',
        autologin: false,
      }
      const client = new OdooClient(session)
      expect(client.session.password).toNotExist()
    })

    it('should store the password if autologin', () => {
      const session = {
        password: 'password',
        autologin: true,
      }
      const client = new OdooClient(session)
      expect(client.session.password).toEqual(session.password)
    })
  })

  describe('imageLocation()', () => {
    it('should construct the image location of a model', () => {
      const session = {
        session_id: 'session_id',
        location: 'https://www.odoo.tld',
      }
      const client = new OdooClient(session)
      const params = {
        model: 'model',
        field: 'field',
        id: 'id',
      }

      expect(client.imageLocation(params)).toEqual(`${session.location + IMAGE}?session_id=${session.session_id}&model=${params.model}&field=${params.field}&id=${params.id}`)
    })

    it('should return the image location even without info', () => {
      const session = {
        session_id: 'session_id',
        location: 'https://www.odoo.tld',
      }
      const client = new OdooClient(session)
      const params = {}

      expect(client.imageLocation(params)).toEqual(`${session.location + IMAGE}?session_id=${session.session_id}&model=&field=&id=`)
    })
  })

  describe('login()', () => {
    it('should login to the server', () => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
      }

      const client = new OdooClient()
      return client.login(session).then((response) => {
        expect(response.result.uid).toExist()
      })
    })

    it('should autologin', (done) => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
        autologin: true,
      }

      const client = new OdooClient(session)
      client.list({
        model: 'res.users',
      }).then((response) => {
        expect(response.result.length).toExist()
        done()
      })
    })

    it('should catch a login error from the server', () => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: Date.now(),
        password: Date.now(),
      }

      const client = new OdooClient()
      return client.login(session).catch((err) => {
        expect(err.message).toEqual(LOGIN_FAILED)
      })
    })
  })

  describe('logout()', () => {
    it('should logout from the server', () => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
      }

      const client = new OdooClient()
      return client.login(session).then(() => {
        client.logout().then((response) => {
          expect(response.result).toNotExist
        })
      })
    })
  })

  describe('read()', () => {
    it('should read a model', (done) => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
      }

      const client = new OdooClient()
      client.login(session).then(() => {
        client.read({
          model: 'res.users',
          id: client.session.context.uid,
        }).then((response) => {
          expect(response.result.id).toEqual(client.session.context.uid)
          done()
        })
      })
    })

    it('should read a model and gets its dependencies', (done) => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
        dbs: {
          RES_USERS: {
            name: 'res.users',
            dependencies: [
              {
                key: 'partner_id',
                db: 'res.partner',
              }
            ]
          }
        }
      }

      const client = new OdooClient()
      client.login(session).then(() => {
        client.read({
          model: 'res.users',
          id: client.session.context.uid,
          fields: ['id', 'name', 'partner_id']
        }).then((response) => {
          expect(response.dependencies['res.partner'][0].id).toEqual(response.result.partner_id[0])
          done()
        })
      })
    })
  })
})
