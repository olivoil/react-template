/* eslint-disable flowtype/require-valid-file-annotation */
/* eslint-disable flowtype/require-parameter-type */
/* eslint-disable flowtype/require-return-type */
/* eslint-disable global-require */

'use strict'

// Webpack and plugins
const Webpack = require('webpack')
const AssetsPlugin = require('assets-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OfflinePlugin = require('offline-plugin')
const postcss = require('./postcss.config')
const { version } = require('./package.json')

const ENV = process.env.NODE_ENV


// WEBPACK devtool
const devtool = ENV === 'production'
              ? 'source-map'
              : 'cheap-module-eval-source-map'


// WEBPACK entry
const entry = {
  // include CSS files here where order of precedence is needed
  // Bundle vendor libraries in a separate chunk
  vendor: [
    // 'classnames',
    // 'debug',
    // 'immutable',
    // 'jquery',
    // 'key-mirror',
    'react',
    'react-dom',
    'react-redux',
    // 'react-motion',
    'react-router',
    'react-router-redux',
    // 'react-tap-event-plugin',
    'redux',
    'redux-logger',
    'redux-thunk',
    // 'superagent',
  ],
  bundle: [
    './node_modules/tachyons/css/tachyons.css',
    './src/styles/fonts.css',
    './src/styles/app.css',
    './src/browser.index.js',
  ],
}


// WEBPACK output
const output = {
  path: './build/public/',
  chunkFilename: '[name]-[chunkhash].js',
  filename: '[name]-[chunkhash].js',
  publicPath: '/static/',
}

if (ENV === 'development') {

  // output.publicPath = 'http://localhost:8000/static/'
  // entry.bundle.unshift('webpack-hot-middleware/client')

}


// WEBPACK plugins
const plugins = [
  new Webpack.optimize.OccurrenceOrderPlugin(),
  new Webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(ENV || 'development'),
    },
  }),
  // new Webpack.ProvidePlugin({
  //   $: 'jquery',
  //   jQuery: 'jquery',
  //   'window.jQuery': 'jquery',
  // }),
  // new Webpack.EnvironmentPlugin([
  //   'ENV_VAR',
  // ]),
  new CompressionPlugin({
    asset: '[path].gz[query]',
    algorithm: 'gzip',
    test: /\.(js|css|html|json|ico|map|xml|txt|svg|eot|otf|ttf|woff|woff2)$/,
    threshold: 10240,
    minRatio: 0.8,
  }),
  new CopyPlugin([
    { from: 'static' },
  ]),
  new Webpack.optimize.CommonsChunkPlugin({
    names: ['vendor'],
    minChunks: Infinity,
  }),
  new ExtractTextPlugin('styles.css', { allChunks: true }),
  new AssetsPlugin({
    filename: '/build/assets.json',
  }),
]


// WEBPACK CSS Loader
let cssModulesLoader = ExtractTextPlugin.extract('css'
              + '?modules&camelCase'
              + '&importLoaders=1'
              + '&localIdentName=[path]__[name]__[local]__[hash:base64:3]'
              + '!postcss')

let cssLoader = ExtractTextPlugin.extract('css'
              + '?importLoaders=1'
              + '!postcss')


if (ENV === 'development') {

  const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

  plugins.push(
    new BrowserSyncPlugin({
      proxy: 'localhost:8000',
      ghostMode: false,
      open: false,
      logFileChanges: true,
      logLevel: 'info',
      reloadOnRestart: true,
    })
  )

//   plugins.push(
//     new Webpack.HotModuleReplacementPlugin()
//   )

}


if (ENV === 'production') {

  cssModulesLoader = ExtractTextPlugin.extract('css?minimize'
                   + '&modules&camelCase'
                   + '&importLoaders=1'
                   + '!postcss')

  cssLoader = ExtractTextPlugin.extract('css'
            + '?minimize&importLoaders=1'
            + '!postcss')

  plugins.push(
    new Webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    })
  )

  // Keep OfflinePlugin last
  const cachedPages = [
    '/',
    '/test',
  ]

  plugins.push(
    new OfflinePlugin({
      AppCache: false,
      version: `v${version}-[hash]`,
      publicPath: '/',
      relativePaths: false,
      caches: {
        main: [
          '*.{css,eot,ico,jpg,jpeg,js,json,mp4,otf,png,svg,ttf,txt,woff,woff2}',
        ].concat(cachedPages),
      },
      externals: cachedPages,
      excludes: [
        '**/.*',
        '**/*.map',
        'robots.txt',
      ],
      // If publicPath is a subdirectory
      rewrites: (asset) => {

        // prefix with /static/ unless webpack asset is a page route
        return cachedPages.indexOf(asset) === -1
          ? `/static/${asset}`
          : asset

      },
    })
  )

}


// WEBPACK loaders
const preLoaders = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'eslint-loader',
  },
]
const loaders = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    query: {
      cacheDirectory: ENV === 'development',
    },
  },
  {
    test: /\.css$/,
    exclude: /node_modules/,
    loader: cssModulesLoader,
  },
  {
    test: /node_modules.*\.css$/,
    loader: cssLoader,
  },
  {
    test: /\.json$/,
    loader: 'json-loader',
  },
  {
    test: /\.(eot|mp4|otf)$/,
    loader: 'file-loader',
  },
  {
    test: /\.(gif|jpeg|jpg|png|svg)$/,
    loader: 'url-loader?limit=10000',
  },
  {
    test: /\.(woff|woff2)$/,
    loader: 'url-loader?limit=10000&mimetype=application/font-woff',
  },
  {
    test: /\.ttf$/,
    loader: 'url-loader?limit=10000&mimetype=application/octet-stream',
  },
]


module.exports = {

  devtool,
  entry,
  plugins,

  output,

  module: {
    preLoaders,
    loaders,
  },

  eslint: {
    cache: true,
    configFile: '.eslintrc',
  },

  postcss,

}
