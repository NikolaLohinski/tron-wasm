const { resolve } = require('path');

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
    filename: 'typescript.worker.js',
  },
  resolve: {
    extensions: ['.ts', '.js', '.wasm'],
  },
  target: 'webworker',
};
