import expect from 'expect'

import { createClient } from '../modules/index'
import OdooClient from '../modules/client'

describe('index', () => {

  describe('#createClient()', () => {
    it('should return an instance of OdooClient', () => {
      expect(createClient()).toBeA(OdooClient)
    })
  })

})
