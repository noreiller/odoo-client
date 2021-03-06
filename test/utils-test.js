import expect from 'expect'

import { formatFilters, formatUrl, processError, warning } from '../modules/utils'
import { AND, OR, EQUAL, NOT_EQUAL } from '../modules/operators'
import { LIST, CALL } from '../modules/types'
import * as URLS from '../modules/urls'
import * as ERRORS from '../modules/errors'

describe('utils', () => {

  describe('formatFilters()', () => {
    it('should combine filters', () => {
      const first = [
        ['active', EQUAL, true],
      ]

      const second = [
        AND,
        ['name', NOT_EQUAL, 'test1'],
        ['name', NOT_EQUAL, 'test2'],
      ]

      const expected = [
        AND,
        AND,
        first[0],
        second[1],
        second[2],
      ]

      expect(formatFilters(first, second)).toEqual(expected)
    })

    it('should combine filters while handling default arguments ', () => {
      expect(formatFilters()).toEqual([])
    })

    it('should combine filters while handling custom arguments ', () => {
      const second = [
        AND,
        ['name', NOT_EQUAL, 'test1'],
        ['name', NOT_EQUAL, 'test2'],
      ]

      const expected = [
        OR,
        second[1],
        second[2],
      ]

      expect(formatFilters(undefined, second, OR)).toEqual(expected)
    })
  })

  describe('formatUrl()', () => {
    it('should construct the url', () => {
      const location = 'https://www.odoo.tld'
      const params = {
        model: 'model',
        method: LIST,
      }

      expect(formatUrl(location, LIST, params)).toEqual(`${location}${URLS[LIST]}/${params.model}:${LIST}`)
    })

    it('should construct the url with no params', () => {
      const location = 'https://www.odoo.tld'

      expect(formatUrl(location, LIST)).toEqual(`${location}${URLS[LIST]}`)
    })

    it('should construct the url with a custom type', () => {
      const location = 'https://www.odoo.tld'
      const params = {
        method: 'test',
      }

      expect(formatUrl(location, 'CUSTOM', params)).toEqual(`${location}${URLS[CALL]}:${params.method}`)
    })
  })

  describe('processError()', () => {
    it('should return an instance of Error', () => {
      const data = {
        debug: 'debug',
        fault_code: 'fault_code',
        type: 'type',
      }
      expect(processError(data)).toBeA(Error)
    })

    it('should concatenate the data to set the stack', () => {
      const data = {
        debug: 'debug',
        fault_code: 'fault_code',
        type: 'type',
      }
      expect(processError(data).stack).toEqual(`${data.debug}${data.fault_code}`)
    })

    it('should concatenate the data to set the stack even with missing data', () => {
      const data = {
        debug: '',
        fault_code: null,
        type: 'type',
      }
      expect(processError(data).stack).toEqual(`${data.debug}`)
    })

    it('should set the type as message of the error', () => {
      const data = {
        debug: 'debug',
        fault_code: 'fault_code',
        type: 'type',
      }
      expect(processError(data).message).toEqual(data.type)
    })

    it('should check the Expired Session', () => {
      const data = {
        debug: 'debug SessionExpiredException debug',
        fault_code: 'fault_code',
        type: 'type',
      }
      expect(processError(data).message).toEqual(ERRORS.SESSION_EXPIRED)
    })
  })


  describe('warning()', () => {
    it('should not output a warning if the condition is not fulfilled', () => {
      const spy = expect.spyOn(console, 'warn')

      warning(false)

      expect(spy).toNotHaveBeenCalled()
      spy.restore()
    })

    it('should output a warning with concatenated strings', () => {
      const spy = expect.spyOn(console, 'warn')
      const args = ['a', 'bc', 'def', 'ghij']

      warning(true, args[0], args[1], args[2], args[3])

      expect(spy).toHaveBeenCalledWith(args[0], args[1], args[2], args[3])
      spy.restore()
    })

    it('should output a warning with empty strings if no arguments', () => {
      const spy = expect.spyOn(console, 'warn')

      warning(true)

      expect(spy).toHaveBeenCalledWith('', '', '', '')
      spy.restore()
    })
  })

})
