'use strict';

var Core = require('../core');
var attr = require('../attr');
var _ = require('lodash');

function match(tagname, attribs, config, state) {
  var slotName;
  var slots = config.variables.slots || {};
  var defineSlot = attr.getAttr(config.prefix + 'define-slot', attribs);
  var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

  if(defineSlot) {
    slotName = attribs[defineSlot];
    if (slotName in slots) {
      if(attribs[replaceOuterAttr]) {
        state.setSkipClosingTag();
      } else {
        state.setOutput(Core.createTag(tagname, _.omit(attribs, [defineSlot, replaceOuterAttr])));
      }
      state.setOutput(Core.render(slots[slotName], config.variables));
      state.setBlock('inside-fragment', tagname);
      return true;
    } else {
      state.setOutput(Core.createTag(tagname, _.omit(attribs, [defineSlot, replaceOuterAttr])));
      return true;
    }
  }
  return false;
}

module.exports = {
  name:'define-slot',
  match: match
};
