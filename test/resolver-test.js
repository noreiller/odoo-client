import expect from 'expect'

import OdooClient from '../modules/client'
import { deepMerge, getDependencies, checkDependencies, resolveDependencies, resolvePromises } from '../modules/resolver'

const ODOO_LOCATION = process.env.ODOO_LOCATION
const ODOO_DB = process.env.ODOO_DB
const ODOO_LOGIN = process.env.ODOO_LOGIN
const ODOO_PASSWORD = process.env.ODOO_PASSWORD

describe('resolver', () => {

  describe('deepMerge()', () => {
    it('should merge objects', () => {
      const target = {
        'res.users': [
          {
            id: 1,
            customProperty: 'customPropertyValue',
          },
          {
            id: 2,
            name: 'oldName',
          }
        ]
      }

      const models = {
        'res.users': [
          {
            id: 1,
            name: 'test-user',
            number_key: 1,
          }, {
            id: 2,
            name: 'test-user',
            array_key: [2, 'test user'],
          }, {
            id: 3,
            name: 'test-user',
            multiple_key: [3, 4],
          }
        ]
      }

      const expected = {
        ...models
      }

      expected['res.users'][0] = {
        ...expected['res.users'][0],
        ...target['res.users'][0],
      }

      expected['res.users'][1] = {
        ...expected['res.users'][1],
        ...target['res.users'][1],
      }

      expect(deepMerge(target, models)).toEqual(models)
    })

    it('should merge objects even with no object to merge', () => {
      expect(deepMerge({}, {})).toEqual({})
    })

    it('should merge objects even with no object to merge', () => {
      expect(deepMerge({}, { 'test': [{ id: 1 }] })).toEqual({ 'test': [{ id: 1 }] })
    })
  })

  describe('checkDependencies()', () => {
    it('should check the dependencies of a model', () => {
      const db = {
        name: 'res.users',
        dependencies: [
          {
            key: 'number_key',
            model: 'res.partner',
          }, {
            key: 'array_key',
            model: 'res.partner',
          }, {
            key: 'multiple_key',
            model: 'res.partner',
            multiple: true,
          }
        ]
      }
      const models = {
        'res.users': [
          {
            id: 1,
            name: 'test-user',
            number_key: 1,
          }, {
            id: 2,
            name: 'test-user',
            array_key: [2, 'test user'],
          }, {
            id: 3,
            name: 'test-user',
            multiple_key: [3, 4],
          }
        ]
      }

      expect(checkDependencies(db, models['res.users'])).toEqual(true)
    })

    it('should check  the dependencies of a model even with no dependency', () => {
      expect(checkDependencies({}, {})).toEqual(false)
    })
  })

  describe('getDependencies()', () => {
    it('should retrieve the dependencies of a model', () => {
      const db = {
        name: 'res.users',
        dependencies: [
          {
            key: 'number_key',
            model: 'db1',
          }, {
            key: 'array_key',
            model: 'db2',
          }, {
            key: 'multiple_key',
            model: 'db3',
            multiple: true,
          }
        ]
      }
      const models = {
        'res.users': [
          {
            id: 1,
            name: 'test-1',
            number_key: 1,
          }, {
            id: 2,
            name: 'test-2',
            array_key: [2, 'test user'],
          }, {
            id: 3,
            name: 'test-3',
            multiple_key: [3, 4],
          }, {
            id: 4,
            name: 'test-1bis',
            number_key: 1,
          }
        ]
      }
      const expected = [
        {
          ids: [1],
          model: 'db1',
        }, {
          ids: [2],
          model: 'db2',
        }, {
          ids: [3, 4],
          model: 'db3',
        }
      ]

      expect(getDependencies(db, models['res.users'])).toEqual(expected)
    })

    it('should return an empty list if no dependency', () => {
      expect(getDependencies({}, {})).toEqual([])
    })
  })

  describe('resolveDependencies()', () => {
    it('should resolve an empty response', () => {
      const client = new OdooClient()

      return resolveDependencies(client, {})
        .then((values) => {
          expect(values).toEqual({})
        })
    })

    it('should retrieve the dependencies', (done) => {
      const session = {
        location: ODOO_LOCATION,
        db: ODOO_DB,
        login: ODOO_LOGIN,
        password: ODOO_PASSWORD,
        autologin: true,
        dependencies: {
          RES_USERS: {
            name: 'res.users',
            dependencies: [
              {
                key: 'partner_id',
                model: 'res.partner',
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
          const expected = {
            ...response.dependencies,
            [response.model]: [response.result],
          }

          resolveDependencies(client, {
            [response.model]: [response.result]
          }).then((values) => {
            expect(values).toEqual(expected)
            done()
          })
        })
      })
    })
  })

  describe('resolvePromises()', () => {
    it('should resolve an empty response from the promise', () => {
      const client = new OdooClient()
      const promises = [
        Promise.resolve({})
      ]

      return resolvePromises(client, promises)
        .then((values) => {
          expect(values).toEqual({})
        })
    })
  })

})
