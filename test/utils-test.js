import expect from 'expect'

import { formatFilters, formatUrl } from '../modules/utils'
import { AND, OR, EQUAL, NOT_EQUAL } from '../modules/operators'
import * as URLS from '../modules/urls'
import { LIST, CALL } from '../modules/types'

describe('utils', () => {

  describe('#formatFilters()', () => {
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

  describe('#formatUrl()', () => {
    it('should construct the url', () => {
      const location = 'http://www.example.com'
      const params = {
        model: 'model',
        method: LIST,
      }

      expect(formatUrl(location, LIST, params)).toEqual(`${location}${URLS[LIST]}/${params.model}:${LIST}`)
    })

    it('should construct the url with no params', () => {
      const location = 'http://www.example.com'

      expect(formatUrl(location, LIST)).toEqual(`${location}${URLS[LIST]}`)
    })

    it('should construct the url with a custom type', () => {
      const location = 'http://www.example.com'
      const params = {
        method: 'test',
      }

      expect(formatUrl(location, 'CUSTOM', params)).toEqual(`${location}${URLS[CALL]}:${params.method}`)
    })
  })

})
