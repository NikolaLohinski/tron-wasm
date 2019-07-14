module.exports = {
  module: {
    rules: [
      {
        test: /\.worker\.(js|ts)$/,
        use: { loader: "worker-loader" }
      }
    ]
  }
};
