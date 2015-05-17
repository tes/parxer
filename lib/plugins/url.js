'use strict';

var Core = require('../core');
var _ = require('lodash');
var getAttr = require('../attr').getAttr;

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];
  var rawSuffix = '-raw';

  /*
    Parse any of the properties that have variables in them
  */
  function parseAttribs(attribs, config) {
    attribs = _.clone(attribs);

    parsedAttribs.forEach(function(attrib) {
        var real = getAttr(config.prefix + attrib, attribs);
        var raw = real + rawSuffix;

        if (real) {
          attribs[raw] = attribs[real];
          attribs[real] = Core.render(attribs[real].toString(), config.variables);
        }
    });

    return attribs;
  }

  /*
    Core cx-url handling function
    responds to cx-url="{{server:name}}/path" declarations
  */
  function matchUrl(tagname, attribs, config, state) {
    var urlAttr = getAttr(config.prefix + 'url', attribs);
    var replaceOuterAttr = getAttr(config.prefix + 'replace-outer', attribs);

    if (!urlAttr) {
      return false;
    }

    attribs = parseAttribs(attribs, config);
    if(attribs[replaceOuterAttr]) {
        state.setSkipClosingTag(tagname);
    } else {
        state.setOutput(Core.createTag(tagname, attribs));
    }

    Core.pushFragment(tagname, attribs, state, null, handler);

    return true;
  }

  function match(tagname, attribs, config, state) {
    return matchUrl(tagname, attribs, config, state);
  }

  return {
    name:'url',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
