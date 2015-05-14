'use strict';

var Core = require('../core');
var _ = require('lodash');
var getAttr = require('../attr').getAttr;

module.exports = function() {

  var parsedAttribs = ['src'];
  var rawSuffix = '-raw';

  /*
    Core cx-src handling function
    responds to cx-src="service-name/image.png" declarations
  */
  function matchImages(tagname, attribs, config, state) {
    var bundlesAttr = getAttr(config.prefix + 'src', attribs);
    var bundlesRawAttr = bundlesAttr + rawSuffix;

    if (!bundlesAttr) {
      return false;
    }

    var bundleName = Core.render(attribs[bundlesAttr].toString(), config.variables);

    if(bundleName.indexOf('/') < 0) {
      return false;
    }

    var splitBundle = bundleName.split('/');
    var bundle = {
      service: splitBundle[0],
      name: splitBundle[1]
    };

    if(config.cdn && config.cdn.url) {
      var baseUrl = config.cdn.url;

      var bundleAttribs = _.clone(attribs),
          bundleKey = bundle.service + '|' + bundle.name.split('.').join('|'),
          bundleType = 'img',
          bundleVersion = '{{^static:' + bundleKey + '}}YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE{{/static:' + bundleKey + '}}{{#static:' + bundleKey + '}}{{static:' + bundleKey + '}}{{/static:' + bundleKey + '}}',
          directAssetUrl = baseUrl + bundle.service + '/' + bundleVersion + '/' + bundleType + '/' + bundle.name;

      bundleAttribs[bundlesRawAttr] = bundleAttribs[bundlesAttr];
      delete bundleAttribs[bundlesAttr];

      state.setSkipClosingTag(tagname);

      Core.pushFragment(tagname, bundleAttribs, state, true, function(fragment, next) {
        bundleAttribs.src = Core.render(directAssetUrl, config.variables);

        next(null, Core.createTag(tagname, bundleAttribs));
      });
      // Set the content directly vs adding a fragment
      //state.setOutput();
    }

    return true;
  }

  function match(tagname, attribs, config, state) {
    return matchImages(tagname, attribs, config, state);
  }

  return {
    name:'image',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
