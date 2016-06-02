'use strict';

var Core = require('../core');
var _ = require('lodash');
var attr = require('../attr');

module.exports = function() {

  var parsedAttribs = ['src'];
  var rawSuffix = '-raw';

  /*
    Core cx-src handling function
    responds to cx-src="service-name/image.png" declarations
  */
  function matchImages(tagname, attribs, config, state) {
    var imageSrcAttr = attr.getAttr(config.prefix + 'src', attribs);
    var imageSrcRawAttr = imageSrcAttr + rawSuffix;

    if (!imageSrcAttr) {
      return false;
    }

    // If we have no cdn then drop the parsing of the image
    if (!config.cdn || !config.cdn.url) {
      return false;
    }

    var imageName = Core.render(attribs[imageSrcAttr].toString(), config.variables);

    // Silently drop any without the / delimiter, now required
    if(imageName.indexOf('/') < 0) {
      return false;
    }

    var splitBundle = imageName.split('/');
    var image = {
      service: splitBundle[0],
      name: splitBundle[1]
    };

    var baseUrl = config.cdn.url;

    var imageAttribs = _.clone(attribs);

    // Create an image key that will be used to determine which version will be used for the image url
    // This will just be the service name
    var imageKey = image.service;

    // Create a mustache template that will show an ugly error if we cannot figure out which version will be used to create the image
    var bundleVersion = '{{^static:' + imageKey + '}}YOU_SPECIFIED_AN_IMAGE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE{{/static:' + imageKey + '}}{{#static:' + imageKey + '}}{{static:' + imageKey + '}}{{/static:' + imageKey + '}}';
    var directAssetUrl = baseUrl + image.service + '/' + bundleVersion + '/img/' + image.name;

    imageAttribs[imageSrcRawAttr] = imageAttribs[imageSrcAttr];
    delete imageAttribs[imageSrcAttr];

    // Dont close a tag since the new image element will always replace the outer element
    state.setSkipClosingTag(tagname);

    // Add the new image to the deferred stack to be processed once all config variables have been defined
    Core.pushFragment(tagname, imageAttribs, state, true, function(fragment, next) {
      imageAttribs.src = Core.render(directAssetUrl, config.variables);
      state.setStatistic('images', imageName, imageAttribs);
      next(null, Core.createTag(tagname, imageAttribs));
    });

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
