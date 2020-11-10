Inline Source as LZMA extension for the HTML Webpack Plugin
========================================

Enhances [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)
functionality by adding the `{inlineSource: 'regex string'}` option.

This is an extension plugin for the [webpack](http://webpack.github.io) plugin [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin).  It allows you to embed javascript and css source inline.

Installation
------------
You must be running webpack on node 4 or higher

Install the plugin with npm:
```shell
$ npm install --save-dev html-webpack-inline-lzma-plugin
```

Basic Usage
-----------
Require the plugin in your webpack config:

```javascript
var HtmlWebpackInlineLzmaPlugin = require('html-webpack-inline-lzma-plugin');
```

Add the plugin to your webpack config as follows:

```javascript
plugins: [
  new HtmlWebpackPlugin(),
  new HtmlWebpackInlineLzmaPlugin()
]  
```
The above configuration will actually do nothing due to the configuration defaults.

When you set `inlineSource` to a regular expression the source code for any javascript or css file names that match will be embedded inline in the resulting html document.
```javascript
plugins: [
  new HtmlWebpackPlugin({
		inlineSource: '.(js|css)$' // embed all javascript and css inline
	}),
  new HtmlWebpackInlineLzmaPlugin()
]  
```