const { resolve } = require('path');
const Webpack = require('webpack');

module.exports = {
  externals: {
    fs: true
  },
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
        test: /\.(c|cpp)$/,
        use: {
          loader: 'c-wasm-loader',
          options: {
            outputPath: 'wasm',
            name: '[name]-[hash].[ext]',
            debugLevel: 4,
          }
        }
      },
    ],
  },
  plugins: [
    new Webpack.DefinePlugin({
      BOT_CPP_IMPORT_PATH: JSON.stringify(resolve(__dirname, 'bot' , 'main.cpp')),
    }),
  ],
  output: {
    filename: 'cpp.worker.js',
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm',  '.c', '.cpp'],
  },
  target: 'webworker',
};
