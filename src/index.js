const fs = require('fs');
const path = require('path');
const escapeRegex = require('escape-string-regexp');
const slash = require('slash');
const sourceMapUrl = require('source-map-url');
const lzma = require('lzma-native');
// eslint-disable-next-line import/no-unresolved
const htmlWebpackPlugin = require('html-webpack-plugin');

const lzmaStr = fs.readFileSync(path.resolve(__dirname, '../dist/lzma.min.js'));
const isrtStr = fs.readFileSync(path.resolve(__dirname, '../dist/inserter.min.js'));

function HtmlWebpackInlineSourcePlugin() {
  this.htmlWebpackPlugin = htmlWebpackPlugin;
}

HtmlWebpackInlineSourcePlugin.prototype.apply = function apply(compiler) {
  const self = this;

  // Hook into the html-webpack-plugin processing
  compiler.hooks.compilation.tap('html-webpack-inline-source-plugin', (compilation) => {
    self.htmlWebpackPlugin
      .getHooks(compilation)
      .alterAssetTagGroups.tapAsync('html-webpack-inline-source-plugin', (htmlPluginData, callback) => {
        if (!htmlPluginData.plugin.options.inlineSource) return callback(null, htmlPluginData);

        const regexStr = htmlPluginData.plugin.options.inlineSource;

        return self.processTags(compilation, regexStr, htmlPluginData)
          .then((result) => {
            callback(null, result);
          });
      });
  });
};

HtmlWebpackInlineSourcePlugin.prototype.processTags = function processTags(
  compilation,
  regexStr,
  pluginData,
) {
  const self = this;
  const regex = new RegExp(regexStr);

  return new Promise((resolve) => {
    const promises = [];

    pluginData.headTags.forEach((tag) => {
      promises.push(self.processTag(compilation, regex, tag));
    });

    pluginData.bodyTags.forEach((tag) => {
      promises.push(self.processTag(compilation, regex, tag));
    });

    const type = 'text/javascript';
    promises.push(self.processTag(compilation, regex, {
      tagName: 'script',
      closeTag: true,
      attributes: { type },
      innerHTML: lzmaStr,
    }));

    promises.push(self.processTag(compilation, regex, {
      tagName: 'script',
      closeTag: true,
      attributes: { type },
      innerHTML: isrtStr,
    }));

    Promise.all(promises).then((tags) => {
      resolve({
        headTags: [],
        bodyTags: tags,
        plugin: pluginData.plugin,
        chunks: pluginData.chunks,
        outputName: pluginData.outputName,
      });
    });
  });
};

HtmlWebpackInlineSourcePlugin.prototype.resolveSourceMaps = function resolveSourceMaps(
  compilation,
  assetName,
  asset,
) {
  let source = asset.source();
  const out = compilation.outputOptions;
  // Get asset file absolute path
  const assetPath = path.join(out.path, assetName);
  // Extract original sourcemap URL from source string
  if (typeof source !== 'string') {
    source = source.toString();
  }
  const mapUrlOriginal = sourceMapUrl.getFrom(source);
  // Return unmodified source if map is unspecified, URL-encoded, or already relative to site root
  if (!mapUrlOriginal || mapUrlOriginal.indexOf('data:') === 0 || mapUrlOriginal.indexOf('/') === 0) {
    return source;
  }
  // Figure out sourcemap file path *relative to the asset file path*
  const assetDir = path.dirname(assetPath);
  const mapPath = path.join(assetDir, mapUrlOriginal);
  const mapPathRelative = path.relative(out.path, mapPath);
  // Starting with Node 6, `path` module throws on `undefined`
  const publicPath = out.publicPath || '';
  // Prepend Webpack public URL path to source map relative path
  // Calling `slash` converts Windows backslashes to forward slashes
  const mapUrlCorrected = slash(path.join(publicPath, mapPathRelative));
  // Regex: exact original sourcemap URL, possibly '*/' (for CSS), then EOF, ignoring whitespace
  const regex = new RegExp(`${escapeRegex(mapUrlOriginal)}(\\s*(?:\\*/)?\\s*$)`);
  // Replace sourcemap URL and (if necessary) preserve closing '*/' and whitespace
  return source.replace(regex, (match, group) => mapUrlCorrected + group);
};

HtmlWebpackInlineSourcePlugin.prototype.processTag = function processTag(
  compilation,
  regex,
  tag,
) {
  const self = this;
  const preTag = tag;

  return new Promise((resolve) => {
    let assetUrl;
    const $tag = {
      tagName: 'script',
      closeTag: true,
      attributes: {
        type: 'text/javascript',
      },
    };

    // inline js
    if (tag.tagName === 'script' && regex.test(tag.attributes.src)) {
      assetUrl = tag.attributes.src;

    // inline css
    } else if (tag.tagName === 'link' && regex.test(tag.attributes.href)) {
      assetUrl = tag.attributes.href;
    }

    if (assetUrl) {
      // Strip public URL prefix from asset URL to get Webpack asset name
      const publicUrlPrefix = compilation.outputOptions.publicPath || '';
      const assetName = path.posix.relative(publicUrlPrefix, assetUrl);
      const asset = compilation.assets[assetName];
      if (compilation.assets[assetName] !== undefined) {
        const updatedSource = self.resolveSourceMaps(compilation, assetName, asset);
        lzma.LZMA().compress(updatedSource, 9, (result) => {
          $tag.innerHTML = `var tagz=tagz||[];tagz.push(["${tag.tagName === 'script' ? 'j' : 's'}",${JSON.stringify(result.toString('base64'))}])`;
          resolve($tag);
        });
      } else {
        resolve(preTag);
      }
    } else {
      resolve(tag);
    }
  });
};

module.exports = HtmlWebpackInlineSourcePlugin;
