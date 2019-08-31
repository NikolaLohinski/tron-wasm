const { join, resolve } = require('path');

const Webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const WASMPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const RUST_ALIAS = '®';
const SRC_ALIAS = '@';
const GO_ALIAS = '%';

const SRC = resolve(__dirname, 'src');
const WORKERS = join(SRC, 'workers');
const RUST = resolve(__dirname, 'crates');
const GO = resolve(__dirname, 'go');
const DIST = resolve(__dirname, 'dist');

const devServer = {
  contentBase: DIST,
  publicPath: '/',
};

const RustBotWorker = {
  devServer,
  entry: join(WORKERS, 'rust', 'bot.worker.ts'),
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
    filename: 'rust-bot-worker.js',
    path: DIST,
  },
  plugins: [
    new WASMPackPlugin({
      crateDirectory: join(RUST, 'bot'),
    }),
    new Webpack.DefinePlugin({
      BOT_RUST_IMPORT_PATH: JSON.stringify(`${RUST_ALIAS}/bot/pkg`),
    }),
  ],
  resolve: {
    alias: {
      [SRC_ALIAS]: SRC,
      [RUST_ALIAS]: RUST,
    },
    extensions: ['.ts', '.js', '.wasm'],
  },
  target: 'webworker',
};

const TypescriptBotWorker = {
  devServer,
  entry: join(WORKERS, 'typescript', 'bot.worker.ts'),
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
    filename: 'typescript-bot-worker.js',
    path: DIST,
  },
  resolve: {
    alias: {
      [SRC_ALIAS]: SRC,
      [RUST_ALIAS]: SRC,
    },
    extensions: ['.ts', '.js'],
  },
  target: 'webworker',
};


const GoBotWorker = {
  devServer,
  entry: join(WORKERS, 'go', 'bot.worker.ts'),
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
    filename: 'go-bot-worker.js',
    path: DIST,
  },
  plugins: [
    new Webpack.DefinePlugin({
      BOT_GO_IMPORT_PATH: JSON.stringify(`${GO_ALIAS}/bot/main.go`),
    }),
  ],
  node: {
    fs: 'empty'
  },
  resolve: {
    alias: {
      [SRC_ALIAS]: SRC,
      [GO_ALIAS]: GO,
    },
    extensions: ['.ts', '.js', '.wasm', '.go'],
  },
  target: 'webworker',
};

const Main = {
  devServer,
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
    path: DIST,
  },
  plugins: [
    new VueLoaderPlugin(),
    new Webpack.DefinePlugin({
      TYPESCRIPT_BOT_WORKER: JSON.stringify(TypescriptBotWorker.output.filename),
      RUST_BOT_WORKER: JSON.stringify(RustBotWorker.output.filename),
      GO_BOT_WORKER: JSON.stringify(GoBotWorker.output.filename),
    }),
    new HTMLWebpackPlugin({
      favicon: join(SRC, 'assets', 'tron.ico'),
      template: join(SRC, 'html', 'index.html'),
    }),
  ],
  resolve: {
    alias: {
      [SRC_ALIAS]: SRC,
    },
    extensions: ['.js', '.vue', '.json', '.ts'],
  },
};

module.exports = [Main, TypescriptBotWorker, RustBotWorker, GoBotWorker];
