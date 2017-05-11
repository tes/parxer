'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config, state) {
  var ifAttr = attr.getAttr(config.prefix + 'if', attribs);
  var ifValueAttr = attr.getAttr(config.prefix + 'if-value', attribs);
  var ifAttrCompleted = attr.getAttr(config.prefix + 'if-done', attribs);
  var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

  if (!ifAttr || ifAttrCompleted) {
    return false;
  }

  var logicTest = Core.render(attribs[ifAttr], config.variables) === attribs[ifValueAttr];

  if (!logicTest) {
    state.setBlock('if-false', tagname);
    state.setSkipClosingTag(tagname);
    return true;
  }

  // We have a valid logic test
  state.setBlock('if-true', tagname);
  if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
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
