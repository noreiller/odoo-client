import expect from 'expect'

import OdooClient from '../modules/client'

describe('client', () => {

  describe('#constructor()', () => {
    it('should return an instance of OdooClient', () => {
      expect(new OdooClient).toBeA(OdooClient)
    })

    it('should return a unique instanceId', () => {
      expect((new OdooClient).instanceId).toNotEqual((new OdooClient).instanceId)
    })
  })

  describe('#_saveSession()', () => {
    it('should remove the password if no autologin', () => {
      const params = {
        password: 'password',
        autologin: false,
      }
      const client = new OdooClient(params)
      expect(client.session.password).toNotExist()
    })

    it('should store the password if autologin', () => {
      const params = {
        password: 'password',
        autologin: true,
      }
      const client = new OdooClient(params)
      expect(client.session.password).toEqual(params.password)
    })
  })

})
