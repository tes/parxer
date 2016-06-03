'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config, state) {
  var contentAttr = attr.getAttr(config.prefix + 'content-item', attribs)
  var contentDoneAttr = attr.getAttr(config.prefix + 'content-item-done', attribs)
  var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

  function render(fragment, next) {
    var item = fragment.attribs[config.prefix + 'content-item'];
    var content = Core.render(item, config.variables);
    if (!content) {
      return next('Content not found for ' + item);
    } else {
      return next(null, content);
    }
  }

  if(contentAttr && !contentDoneAttr) {
    if(replaceOuterAttr) {
      state.setSkipClosingTag(tagname);
    } else {
      attribs[config.prefix + 'content-item-done'] = 'true';
      state.setOutput(Core.createTag(tagname, attribs));
    }
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
