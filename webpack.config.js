const { join, resolve } = require('path');

const Webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const GoBotWorker = require('./src/bots/golang/webpack.config.js');
const RustBotWorker = require('./src/bots/rust/webpack.config.js');
const TypeScriptBotWorker = require('./src/bots/typescript/webpack.config.js');
const CppBotWorker = require('./src/bots/cpp/webpack.config.js');

const SRC = resolve(__dirname, 'src');
const BUILD = resolve(__dirname, 'docs');

const Main = {
  entry: {
    app: join(SRC, 'main.ts'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          {
            loader: 'vue-loader',
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|webp|ico)(\?.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              fallback: {
                loader: 'file-loader',
                options: {
                  name: 'img/[name].[hash:8].[ext]',
                },
              },
              limit: 4096,
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [
                '\\.vue$',
              ],
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'vue-style-loader',
            options: {
              shadowMode: false,
              sourceMap: false,
            },
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: false,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: false,
            },
          },
        ],
      },
    ],
  },
  output: {
    filename: '[name].[hash].js',
  },
  plugins: [
    new VueLoaderPlugin(),
    new Webpack.DefinePlugin({
      TYPESCRIPT_BOT_WORKER: JSON.stringify(TypeScriptBotWorker.output.filename),
      RUST_BOT_WORKER: JSON.stringify(RustBotWorker.output.filename),
      GO_BOT_WORKER: JSON.stringify(GoBotWorker.output.filename),
      CPP_BOT_WORKER: JSON.stringify(CppBotWorker.output.filename),
    }),
    new HTMLWebpackPlugin({
      favicon: join(SRC, 'assets', 'tron.ico'),
      template: join(SRC, 'html', 'index.html'),
    }),
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json', '.ts'],
  },
};

module.exports = [Main, TypeScriptBotWorker, RustBotWorker, GoBotWorker, CppBotWorker].map((config) => {
  config.devServer = {
    contentBase: BUILD,
    publicPath: '/'
  };
  config.output.path = BUILD;
  config.resolve.alias = { ...{ ['@']: SRC }, ...config.resolve.alias };
  return config
});
