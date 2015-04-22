'use strict';

var Core = require('../core');
var getAttr = require('../attr').getAttr;

function match(tagname, attribs, config, state) {
  var ifAttr = getAttr(config.prefix + 'if', attribs);
  var replaceOuterAttr = getAttr(config.prefix + 'replace-outer', attribs);
  if (ifAttr) {
    var logicTest = Core.render(attribs['cx-if'], config.variables) === attribs['cx-if-value'];
    if(logicTest) {
      state.setInsideIfBlock(tagname);
      if(attribs[replaceOuterAttr]) {
        state.setSkipClosingTag(tagname);
      } else {
        state.setOutput(Core.createTag(tagname, attribs));
      }
    } else {
      state.setSkipBlock(tagname);
      state.setSkipClosingTag(tagname);
    }
    return true;
  }
}

module.exports = {
  name:'if',
  match: match
};
