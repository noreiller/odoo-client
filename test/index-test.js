import expect from 'expect'

import { createClient } from '../modules/index'
import OdooClient from '../modules/client'

describe('index', () => {

  describe('createClient()', () => {
    it('should return an instance of OdooClient', () => {
      expect(createClient()).toBeA(OdooClient)
    })
  })

  describe('window.OdooClient', () => {
    it('should be exposed to the window', () => {
      expect(
        typeof window !== 'undefined' ? window.OdooClient : undefined
      ).toEqual(
        typeof window !== 'undefined' ? OdooClient : undefined
      )
    })
  })

})
