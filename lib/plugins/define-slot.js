'use strict';

var Core = require('../core');
var attr = require('../attr');
var _ = require('lodash');

module.exports = function(handler) {

  function match(tagname, attribs, config, state) {
    var slotName;
    var slots = config.variables.slots || {};
    var defineSlot = attr.getAttr(config.prefix + 'define-slot', attribs);
    var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

    if(defineSlot) {
      slotName = attribs[defineSlot];
      if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
        state.setSkipClosingTag(tagname);
      } else {
        state.setOutput(Core.createTag(tagname, _.omit(attribs, [defineSlot, replaceOuterAttr])));
      }

      if (slotName in slots) {
        Core.pushFragment(tagname, attribs, state, true, handler);
      }
      return true;
    }
    return false;
  }

  return {
    name:'define-slot',
    match: match
  };
}
