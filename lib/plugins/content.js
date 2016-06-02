'use strict';

var Core = require('../core');
var attr = require('../attr');

module.exports = function(handler) {

  var parsedAttribs = ['content', 'cache-key', 'no-cache'];

  /*
    Core cx-content handling function
    responds to cx-content="tagname" declarations
  */
  function matchUrl(tagname, attribs, config, state) {

    var contentAttr = attr.getAttr(config.prefix + 'content', attribs);
    var contentAttrCompleted = attr.getAttr(config.prefix + 'content-done', attribs);

    if (!contentAttr || contentAttrCompleted) {
      return false;
    }

    attribs = attr.parseAttribs(parsedAttribs, attribs, config);
    attribs[config.prefix + 'content-done'] = true;
    state.setOutput(Core.createTag(tagname, attribs));

    Core.pushFragment(tagname, attribs, state, null, handler);

    state.setStatistic('content', attribs['cx-content'], {attribs: attribs});

    return true;
  }

  function match(tagname, attribs, config, state) {
    return matchUrl(tagname, attribs, config, state);
  }

  return {
    name:'content',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
