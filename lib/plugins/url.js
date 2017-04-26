'use strict';

var Core = require('../core');
var attr = require('../attr');

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];

  /*
    Core cx-url handling function
    responds to cx-url="{{server:name}}/path" declarations
  */
  function matchUrl(tagname, attribs, config, state) {
    var urlAttr = attr.getAttr(config.prefix + 'url', attribs);
    var urlAttrCompleted = attr.getAttr(config.prefix + 'url-done', attribs);
    var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

    if (!urlAttr || urlAttrCompleted) {
      return false;
    }

    attribs = attr.parseAttribs(parsedAttribs, attribs, config);
    if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
        state.setSkipClosingTag(tagname);
    } else {
        attribs[config.prefix + 'url-done'] = true;
        state.setOutput(Core.createTag(tagname, attribs));
    }

    Core.pushFragment(tagname, attribs, state, null, handler);


    state.setStatistic('fragments', attribs['cx-url'], {attribs: attribs});

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
