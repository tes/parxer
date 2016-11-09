'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config, state) {
  var contentAttr = attr.getAttr(config.prefix + 'content-item', attribs)
  var contentDoneAttr = attr.getAttr(config.prefix + 'content-item-done', attribs)
  var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

  function render(fragment, next) {
    var item = fragment.attribs[config.prefix + 'content-item'];
    var contentContext = fragment.attribs[config.prefix + 'content-context'];
    var contentContextIsInPage = state.getContent(contentContext);

    if (!contentContextIsInPage) {
      return next();
    }

    var content = Core.render(item, config.variables);
    if (!content) {
      return next('Content not found for ' + item);
    } else {
      return next(null, content);
    }
  }

  if(contentAttr && !contentDoneAttr) {
      var contentContext = contentAttr && attribs[contentAttr].split(':')[1];
      if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
        state.setSkipClosingTag(tagname);
      } else {
        attribs[config.prefix + 'content-item-done'] = 'true';
        state.setOutput(Core.createTag(tagname, attribs));
      }
      attribs[config.prefix + 'content-context'] = contentContext;
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
