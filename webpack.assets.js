'use strict';
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'production',
  target: 'electron-renderer',
  entry: {
    default: ['./assets/js/default.js'],
    debug: ['./assets/js/debug.js'],
  },
  output: {
    path: path.resolve(__dirname, 'static/assets'),
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader',
      ],
    }],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
  ],
};
