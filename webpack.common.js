const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const cleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    main: [
      'idempotent-babel-polyfill',
      path.join(__dirname, 'src', 'index.js')
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: path.join('index.js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract(
          {
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  // If you are having trouble with urls not resolving add this setting.
                  // See https://github.com/webpack-contrib/css-loader#url
                  url: false,
                  minimize: true,
                  sourceMap: true
                }
              },
              {
                loader:'resolve-url-loader',
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: true
                }
              }
            ]
          }
        )
      }
    ]
  },
  plugins: [
    new cleanWebpackPlugin('dist', {}),
    new ExtractTextPlugin('style.css'),
    new HtmlWebpackPlugin({
      inject: false,
      hash: true,
      template: path.join(__dirname, 'src', 'index.html'),
      filename: 'index.html'
    }),
    new CopyWebpackPlugin([
      {
        from: path.join('src', 'images'),
        to: 'images'
      }
    ])
  ]
}