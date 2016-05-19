# Odoo Client

The client creates a new instance with some parameters.
It authenticates the user when a request is performed without being authenticated.


## Usage

````
import { createClient } from 'odoo-client'

const client = createClient({
  location: 'https://www.odoo.tld',
  db: 'mydb',
  login: 'login',
  autologin: false,
})

client.login({
  password: 'password',
})
  .then((response) => {
    console.log('model:', response.model)
    console.log('result:', response.result)
  })
  .catch((err) => {
    console.error(err)
  })
````


## Tests

First, you must create a **.env** file based on the **.env.sample** and fill it with your Odoo test server.
Then, you can run the tests with the following command:

````
$ npm test
````


## Components

### Client

It creates a new instance of the client according to the provided parameters.
It also gives access to the API to performs requests.


### Resolver

It performs the requests and analyzes their dependencies, get them and merge the response in a single object.
