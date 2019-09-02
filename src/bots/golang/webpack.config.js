const { resolve } = require('path');
const Webpack = require('webpack');

module.exports = {
  entry: resolve(__dirname, 'worker.ts'),
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.go/,
        use: ['golang-wasm-async-loader']
      },
    ],
  },
  output: {
    filename: 'golang-src-worker.js',
  },
  plugins: [
    new Webpack.DefinePlugin({
      BOT_GO_IMPORT_PATH: JSON.stringify(resolve(__dirname, 'bot' , 'main.go')),
    }),
  ],
  node: {
    fs: 'empty'
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm', '.go'],
  },
  target: 'webworker',
};
