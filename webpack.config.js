const { join, resolve } = require('path');

const HTMLWebpackPlugin = require('html-webpack-plugin');
const WASMPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const RUST_ALIAS = '®';
const SRC_ALIAS = '@';

const SRC = resolve(__dirname, 'src');
const WORKERS = join(SRC, 'workers');
const RUST = resolve(__dirname, 'crates');
const DIST = resolve(__dirname, 'dist');

const devServer = {
  contentBase: DIST,
  publicPath: '/',
};

const Main = {
  entry: {
    app: join(SRC, 'main.ts'),
  },
  output: {
    path: DIST,
    filename: '[name].[hash].js',
  },
  plugins: [
    new VueLoaderPlugin(),
    new HTMLWebpackPlugin({
      template: join(SRC, 'html', 'index.html'),
      favicon: join(SRC, 'assets', 'tron.ico'),
    }),
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json', '.ts'],
    alias: {
      [SRC_ALIAS]: SRC,
    },
  },
  devServer,
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          {
            loader: 'vue-loader',
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|webp|ico)(\?.*)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 4096,
              fallback: {
                loader: 'file-loader',
                options: {
                  name: 'img/[name].[hash:8].[ext]'
                }
              }
            }
          }
        ]
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              appendTsSuffixTo: [
                '\\.vue$'
              ]
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        oneOf: [
          {
            resourceQuery: /module/,
            use: [
              {
                loader: 'vue-style-loader',
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              {
                loader: 'css-loader',
                options: {
                  sourceMap: false,
                  importLoaders: 2,
                  modules: true,
                  localIdentName: '[name]_[local]_[hash:base64:5]'
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: false
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: false
                }
              }
            ]
          },
          {
            resourceQuery: /\?vue/,
            use: [
              {
                loader: 'vue-style-loader',
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              {
                loader: 'css-loader',
                options: {
                  sourceMap: false,
                  importLoaders: 2
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: false
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: false
                }
              }
            ]
          },
          {
            test: /\.module\.\w+$/,
            use: [
              {
                loader: 'vue-style-loader',
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              {
                loader: 'css-loader',
                options: {
                  sourceMap: false,
                  importLoaders: 2,
                  modules: true,
                  localIdentName: '[name]_[local]_[hash:base64:5]'
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: false
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: false
                }
              }
            ]
          },
          {
            use: [
              {
                loader: 'vue-style-loader',
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              {
                loader: 'css-loader',
                options: {
                  sourceMap: false,
                  importLoaders: 2
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: false
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: false
                }
              }
            ]
          }
        ]
      }
    ]
  },
};

const BotWorker = {
  entry: join(WORKERS, 'bot', 'worker.ts'),
  output: {
    path: DIST,
    filename: 'bot.worker.js',
  },
  target: 'webworker',
  plugins: [
    new WASMPackPlugin({
      crateDirectory: join(RUST, 'bot'),
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.wasm'],
    alias: {
      [SRC_ALIAS]: SRC,
      [RUST_ALIAS]: RUST,
    },
  },
  devServer,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader'
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            }
          }
        ]
      }
    ]
  },
};

module.exports = [Main, BotWorker];
