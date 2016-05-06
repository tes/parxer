'use strict';

var Core = require('../core');
var getAttr = require('../attr').getAttr;

function match(tagname, attribs, config, state) {
  var ifAttr = getAttr(config.prefix + 'if', attribs);
  var ifAttrCompleted = getAttr(config.prefix + 'if-done', attribs);
  var replaceOuterAttr = getAttr(config.prefix + 'replace-outer', attribs);

  if (!ifAttr || ifAttrCompleted) {
    return false;
  }

  var logicTest = Core.render(attribs['cx-if'], config.variables) === attribs['cx-if-value'];

  if (!logicTest) {
    state.setBlock('if-false', tagname);
    state.setSkipClosingTag(tagname);

    return true;
  }

  // We have a valid logic test
  state.setBlock('if-true', tagname);
  if(attribs[replaceOuterAttr]) {
    state.setSkipClosingTag(tagname);
  } else {
    attribs[config.prefix + 'if-done'] = true;
    state.setOutput(Core.createTag(tagname, attribs));
  }

  return true;
}

module.exports = {
  name:'if',
  match: match
};
