require('dotenv').config()
import { createClient } from '../../lib/index'

const client = createClient({
  location: process.env.ODOO_LOCATION,
  db: process.env.ODOO_DB,
  login: process.env.ODOO_LOGIN,
  autologin: process.env.ODOO_AUTOLOGIN === 'on',
})

client.login({
  password: process.env.ODOO_PASSWORD,
})
  .then((response) => {
    console.log(response)
  })
  .catch((err) => {
    console.error(err)
  })
