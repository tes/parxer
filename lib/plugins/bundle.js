'use strict';

var Core = require('../core');
var _ = require('lodash');
var getAttr = require('../attr').getAttr;

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];
  var rawSuffix = '-raw';

  function createTag(bundleType, directAssetUrl) {
    if(bundleType === 'js') {
      return '<script src="' + directAssetUrl + '"></script>';
    } else if(bundleType === 'css') {
      return '<link href="' + directAssetUrl + '" media="all" rel="stylesheet" />';
    } else {
      return '<!-- IGNORED ' + bundleType + ' - ' + directAssetUrl + ' -->'
    }
  }

  /*
    Core cx-bundles handling function
    responds to cx-bundles="bundle1.js,bundle2.js" declarations
    and generates a set of cx-url definitions on the fly that are deferred
    for later processing (as the config.variables property is expected to have been updated)
    by the first round of cx-url requests
  */
  function matchBundles(tagname, attribs, config, state) {

    var bundlesAttr = getAttr(config.prefix + 'bundles', attribs);
    var bundlesRawAttr = bundlesAttr + rawSuffix;
    var replaceOuterAttr = getAttr(config.prefix + 'replace-outer', attribs);
    var directAttr = config.prefix + 'direct';
    var urlAttr = config.prefix + 'url';

    if (!bundlesAttr) {
      return false;
    }

    // If we have no cdn then drop the parsing of the bundle
    if(!config.cdn || !config.cdn.url) {
      return false;
    }

    if (bundlesAttr.substr(0, 5) === 'data-') {
      urlAttr = 'data-' + urlAttr;
      directAttr = 'data-' + directAttr;
    }

    var baseUrl = config.cdn.url;
    var bundleNames = Core.render(attribs[bundlesAttr].toString(), config.variables).split(',');

    _.forEach(bundleNames, function(bundleName) {
      if(bundleName.indexOf('/') < 0) {
        // Silently drop any without the / delimiter, now required
        return;
      }

      var splitBundle = bundleName.split('/');
      var bundle = {
        service: splitBundle[0],
        name: splitBundle[1]
      };
      var splitBundleName = bundle.name.split('@');
      if (splitBundleName.length > 1) {
        bundle.name = splitBundleName[0];
        bundle.version = splitBundleName[1];
      }

      var bundleAttribs = _.clone(attribs);

      // Create an image key that will be used to determine which version will be used for the bundle url
      var bundleKey = bundle.service + '|' + bundle.name.split('.')[0];

      // Bundle type based on the bundle extension (css,js)
      var bundleType = bundle.name.split('.')[1];

      // Create a mustache template that will show an ugly text if we cannot figure out which version will be used to create the image
      var bundleVersion = bundle.version ? bundle.version : '{{^static:' + bundleKey + '}}YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE{{/static:' + bundleKey + '}}{{#static:' + bundleKey + '}}{{static:' + bundleKey + '}}{{/static:' + bundleKey + '}}';

      // Create an html version of the bundle so we can include it as a frangment into the html for non-minified versions
      var bundleUrl = baseUrl + bundle.service + '/' + bundleVersion + '/html/' + bundle.name + '.html';

      // Real bundle url to be used if minified is to be used
      var directAssetUrl = baseUrl + bundle.service + '/' + bundleVersion + '/' + bundleType + '/' + bundle.name;

      bundleAttribs[bundlesRawAttr] = bundleAttribs[bundlesAttr];
      delete bundleAttribs[bundlesAttr];

      if(bundleAttribs[replaceOuterAttr]) {
          state.setSkipClosingTag(tagname);
      } else {
          state.setOutput(Core.createTag(tagname, attribs));
      }

      if(config.minified) {
        // Set the content directly vs adding a fragment
        bundleAttribs[directAttr] = createTag(bundleType, directAssetUrl);

        // Direct plugin will take care of rendering the correct element to add once we come back from the deferred stack
        Core.pushFragment(tagname, bundleAttribs, state, true, function(fragment, next) {
          var testHandler = require('./direct');
          next(null, testHandler.match(fragment.tagname, fragment.attribs, config, state));
        });
      } else {
        bundleAttribs[urlAttr] = bundleUrl;
        Core.pushFragment(tagname, bundleAttribs, state, true, handler);
      }

    });

    return true;
  }

  function match(tagname, attribs, config, state) {
    return matchBundles(tagname, attribs, config, state);
  }

  return {
    name:'bundle',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
