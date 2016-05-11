import OdooClient from './client'

export { OdooClient }

export const createClient = (values) => {
  return new OdooClient(values)
}

export * as OPERATORS from './operators'
export * as TYPES from './types'
export * as URLS from './urls'
