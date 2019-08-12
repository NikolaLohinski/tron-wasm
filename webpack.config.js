const { join, resolve } = require("path");

const HTMLWebpackPlugin = require("html-webpack-plugin");
const WASMPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");

const RUST_ALIAS = "®";
const SRC_ALIAS = "@";

const SRC = resolve(__dirname, "src");
const WORKERS = join(SRC, "workers");
const RUST = resolve(__dirname, "crates");
const DIST = resolve(__dirname, "dist");

const devServer = {
  contentBase: DIST,
  publicPath: "/",
};

const Main = {
  devServer,
  entry: {
    app: join(SRC, "main.ts"),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [
          {
            loader: "vue-loader",
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|webp|ico)(\?.*)?$/,
        use: [
          {
            loader: "url-loader",
            options: {
              fallback: {
                loader: "file-loader",
                options: {
                  name: "img/[name].[hash:8].[ext]",
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
            loader: "babel-loader",
          },
          {
            loader: "ts-loader",
            options: {
              appendTsSuffixTo: [
                "\\.vue$",
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
            loader: "vue-style-loader",
            options: {
              shadowMode: false,
              sourceMap: false,
            },
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              sourceMap: false,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              sourceMap: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: false,
            },
          },
        ],
      },
    ],
  },
  output: {
    filename: "[name].[hash].js",
    path: DIST,
  },
  plugins: [
    new VueLoaderPlugin(),
    new HTMLWebpackPlugin({
      favicon: join(SRC, "assets", "tron.ico"),
      template: join(SRC, "html", "index.html"),
    }),
  ],
  resolve: {
    alias: {
      [SRC_ALIAS]: SRC,
    },
    extensions: [".js", ".vue", ".json", ".ts"],
  },
};

const BotWorker = {
  devServer,
  entry: join(WORKERS, "bot", "worker.ts"),
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "babel-loader",
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
    ],
  },
  output: {
    filename: "bot.worker.js",
    path: DIST,
  },
  plugins: [
    new WASMPackPlugin({
      crateDirectory: join(RUST, "bot"),
    }),
  ],
  resolve: {
    alias: {
      [SRC_ALIAS]: SRC,
      [RUST_ALIAS]: RUST,
    },
    extensions: [".ts", ".js", ".wasm"],
  },
  target: "webworker",
};

module.exports = [Main, BotWorker];
