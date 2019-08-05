'use strict';

var Core = require('../core');
var _ = require('lodash');
var attr = require('../attr');

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];

  function makeBundleKey(bundle) {
    return bundle.service.replace(/\./g, '::');
  }

  function makeDirectAssetUrl(bundle, bundleBaseUrl, bundleType) {
    var bundleKey = makeBundleKey(bundle);

    // Create a mustache template that will show an ugly text if we cannot figure out which version will be used to create the image
    var bundleVersion = bundle.version ? bundle.version :
      '{{^static:' + bundleKey + '}}YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE{{/static:' + bundleKey + '}}{{#static:' + bundleKey + '}}{{static:' + bundleKey + '}}{{/static:' + bundleKey + '}}';

    var directAssetUrl = bundleBaseUrl + bundle.service + '/' + bundleVersion + '/' + bundleType + '/' + bundle.name;

    return directAssetUrl;
  }

  /*
    Core cx-bundles handling function
    responds to cx-bundles="bundle1.js,bundle2.js" declarations
    and generates a set of cx-url definitions on the fly that are deferred
    for later processing (as the config.variables property is expected to have been updated)
    by the first round of cx-url requests
  */
  function matchBundles(tagname, attribs, config, state) {

    var bundlesAttr = attr.getAttr(config.prefix + 'bundles', attribs);
    var bundlesAttrDone = attr.getAttr(config.prefix + 'bundles-done', attribs);
    var bundlesRawAttr = bundlesAttr + config.rawSuffix;
    var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);
    var inlineAttr = attr.getAttr(config.prefix + 'inline', attribs);
    var serverPushAttr = attr.getAttr(config.prefix + 'server-push', attribs);
    var clientHintAttr = attr.getAttr(config.prefix + 'client-hint', attribs);
    var directAttr = config.prefix + 'direct';
    var urlAttr = config.prefix + 'url';

    if (!bundlesAttr || bundlesAttrDone) {
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

    var tagType = clientHintAttr ? 'bundle-hint' : 'bundle';

    _.forEach(bundleNames, function(bundleName) {
      if(bundleName.indexOf('/') < 0) {
        // Silently drop any without the / delimiter, now required
        return;
      }

      var bundleBaseUrl = baseUrl;
      var splitBundle = bundleName.split('/');
      var bundle = {
        service: splitBundle[0],
        name: splitBundle[1]
      };

      if (config.cdn && config.cdn.serviceRenamer) {
        bundle.service = config.cdn.serviceRenamer(bundle.service, config.variables) || bundle.service;
      }

      var splitBundleName = bundle.name.split('@');
      if (splitBundleName.length > 1) {
        bundle.name = splitBundleName[0];
        bundle.version = splitBundleName[1];
      }

      var bundleAttribs = _.clone(attribs);

      var bnamesplit = bundle.name.split('.');

      // Bundle type based on the bundle extension (css,js)
      var bundleType = bnamesplit.pop();

      // Create an image key that will be used to determine which version will be used for the bundle url
      var bundleKey = makeBundleKey(bundle);

      // Allow for more complex resolution of the CDN url via a resolver function that takes in the service name
      var resolvedBaseUrl = config.cdn.resolver && config.cdn.resolver(bundle.service);
      if (resolvedBaseUrl) {
        bundleBaseUrl = resolvedBaseUrl;
      }

      var directAssetUrl = makeDirectAssetUrl(bundle, bundleBaseUrl, bundleType);

      bundleAttribs[bundlesRawAttr] = bundleAttribs[bundlesAttr];
      delete bundleAttribs[bundlesAttr];

      if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
          state.setSkipClosingTag(tagname);
      } else {
          attribs[config.prefix + 'bundles-done'] = true;
          state.setOutput(Core.createTag(tagname, attribs));
      }

      if (state.isAlreadyImported(tagType, bundleName)) {
        return;
      }

      state.setStatistic('bundles', bundleKey, bundle);

      if(inlineAttr) {

        // Pull the actual CSS in as the body element
        bundleAttribs[urlAttr] = directAssetUrl;
        Core.pushFragment(tagname, bundleAttribs, state, true, Core.renderTextInHandler(handler, config.variables));

      } else {
        // Direct plugin will take care of rendering the correct element to add once we come back from the deferred stack
        Core.pushFragment(tagname, bundleAttribs, state, true, function(fragment, next) {
          if (config.cdn && config.cdn.serviceRenamer) {
            // XXX: config.variables changes... we need to check and re do everything. yay.
            var newServiceName = config.cdn.serviceRenamer(bundle.service, config.variables);
            if (bundle.service !== newServiceName) {
              bundle.service = config.cdn.serviceRenamer(bundle.service, config.variables) || bundle.service;
              directAssetUrl = makeDirectAssetUrl(bundle, bundleBaseUrl, bundleType);
            }
          }

          var linkHeaderStr, linkHeader, resourceUrl;
          resourceUrl = Core.prepareURL(Core.render(directAssetUrl, config.variables), config.baseURL);

          if(serverPushAttr) {
            // link: </assets/jquery.js>; rel=preload, </assets/base.css>; rel=preload
            linkHeaderStr = state.getAdditionalHeader('link');
            linkHeader = linkHeaderStr ? linkHeaderStr.split(/\s*,\s*/) : [];
            linkHeader.push(Core.getClientHintHeader(resourceUrl));
            state.setAdditionalHeader('link', linkHeader.join(', '));
          }
          if (clientHintAttr) {
            bundleAttribs.rel = bundleAttribs.rel || 'preload';
            next(null, Core.getClientHintTag(resourceUrl, bundleAttribs));
          } else {
            next(null, Core.createAssetTag(bundleType, resourceUrl, bundleAttribs));
          }

        });
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
