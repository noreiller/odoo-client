import { AND } from './operators'
import * as URLS from './urls'

/**
 * Merge two filters arrays using an operator
 * @param  {Array} currentFilters =             []
 * @param  {Array} newFilters     =             []
 * @param  {String} operator      =             AND
 * @return {Array}
 */
export const formatFilters = (currentFilters = [], newFilters = [], operator = AND) => {
  const mergedFilters = []
  let count = 0

  const checkFilter = (filter, idx) => {
    if (typeof filter !== 'string') {
      mergedFilters.push(filter)
      count++
    }
  }

  currentFilters.forEach(checkFilter)
  newFilters.forEach(checkFilter)

  for (let i = count; i > 1; i--) {
    mergedFilters.unshift(operator)
  }

  return mergedFilters
}

export const formatUrl = (location, type, params = {}) => {
  const query = URLS[type.toUpperCase()] || URLS.CALL

  let url = location + query;

  if (params.model) {
    url = `${url}/${params.model}:${type}`
  }

  if (params.method && type !== params.method) {
    url = `${url}:${params.method}`
  }

  return url;
}
