'use strict';

var Core = require('../core');
var getAttr = require('../attr').getAttr;

function match(tagname, attribs, config, state) {
  var contentAttr = getAttr(config.prefix + 'content-item', attribs)
  var contentDoneAttr = getAttr(config.prefix + 'content-item-done', attribs)

  function render(fragment, next) {
    var item = fragment.attribs[config.prefix + 'content-item'];
    var content = Core.render(item, config.variables);
    if (!content) {
      return next(new Error('Content not found for ' + item));
    } else {
      return next(null, content);
    }
  }

  if(contentAttr && !contentDoneAttr) {
    attribs[config.prefix + 'content-item-done'] = 'true';
    state.setOutput(Core.createTag(tagname, attribs));
    Core.pushFragment(tagname, attribs, state, true, render);
    return true;
  } else {
    return false;
  }
}

module.exports = {
  name:'content-item',
  match: match
};
