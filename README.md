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
    console.log(response)
  })
  .catch((err) => {
    console.error(err)
  })
````


## Components

### Client

It creates a new instance of the client according to the provided parameters.
It also gives access to the API to performs requests.

### Resolver

It performs the requests and analyzes their dependencies, get them and merge the response in a single object.

### Utils

It performs the requests and analyzes their dependencies, get them and merge the response in a single object.

### Constants

Operators, types and urls are constants from Odoo.
Errors are constants to dispatch the right Odoo server error.


## Contribute

### Build

The source code of the client is located in the **modules** directory.
The build package the modules into the **lib** (server) and **dist** (client) directory to be es5 compliant.

The build command is `$ npm run build`. It will lint the source code and package the server and client modules.

### Tests

First, you must create a **.env** file based on the **.env.sample** and fill it with your Odoo test server.

Then, you can run the tests with the `$ npm test` command.


## TODO

* Finish tests
