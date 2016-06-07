import webpack from 'webpack'

export default (config) => config.set({
  basePath: '',
  files: [
    'test/tests.webpack.js'
  ],
  port: 9876,
  colors: true,
  logLevel: config.LOG_INFO,
  autoWatch: false,
  singleRun: true,
  concurrency: Infinity,

  browsers: ['Chrome', 'Firefox'],

  frameworks: ['mocha'],
  reporters: ['mocha'],
  mochaReporter: {
    showDiff: 'inline'
  },

  preprocessors: {
    'test/tests.webpack.js': ['webpack']
  },

  webpack: {
    module: {
      loaders: [
        { test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          query: {
            cacheDirectory: true
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.ODOO_LOCATION': JSON.stringify(process.env.ODOO_LOCATION),
        'process.env.ODOO_DB': JSON.stringify(process.env.ODOO_DB),
        'process.env.ODOO_LOGIN': JSON.stringify(process.env.ODOO_LOGIN),
        'process.env.ODOO_PASSWORD': JSON.stringify(process.env.ODOO_PASSWORD),
      })
    ],
  },
  webpackMiddleware: {
    noInfo: true
  },
})
