'use strict';

var Core = require('../core');
var _ = require('lodash');
var getAttr = require('../attr').getAttr;

module.exports = function(handler) {

  var parsedAttribs = ['content', 'cache-key', 'no-cache'];
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
    Core cx-content handling function
    responds to cx-content="tagname" declarations
  */
  function matchUrl(tagname, attribs, config, state) {

    var contentAttr = getAttr(config.prefix + 'content', attribs);
    var contentAttrCompleted = getAttr(config.prefix + 'content-done', attribs);

    if (!contentAttr || contentAttrCompleted) {
      return false;
    }

    attribs = parseAttribs(attribs, config);
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
