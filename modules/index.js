import OdooClient from './client'
import * as OPERATORS from './operators'
import * as TYPES from './types'
import * as URLS from './urls'

export {
  OdooClient,
  OPERATORS,
  TYPES,
}

export const createClient = (values) => {
  return new OdooClient(values)
}

if (typeof window !== 'undefined') {
  window.OdooClient = OdooClient
}
