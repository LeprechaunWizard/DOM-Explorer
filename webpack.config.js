// what's this 'require' for? do I need to require my node module here?
const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: {minimize: true}
          }
        ]
      }
    ]
  },
  entry: {
    content: "./scripts/content.js",
    display: "./css/formatters/html.js"
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, 'scripts'),
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./views/popup.html",
      filename: "./popup.html"
    })
  ],
  devtool: 'source-map'
};
