const { resolve } = require('path');
const Webpack = require('webpack');
const WASMPackPlugin = require('@wasm-tool/wasm-pack-plugin');

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
    ],
  },
  output: {
    filename: 'rust-src-worker.js',
  },
  plugins: [
    new WASMPackPlugin({
      crateDirectory: resolve(__dirname, 'bot'),
    }),
    new Webpack.DefinePlugin({
      BOT_RUST_IMPORT_PATH: JSON.stringify(resolve(__dirname, 'bot', 'pkg')),
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.wasm', '.rs'],
  },
  target: 'webworker',
};
