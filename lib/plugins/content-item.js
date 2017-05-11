'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config, state) {
  var contentAttr = attr.getAttr(config.prefix + 'content-item', attribs)
  var contentContextAttr = attr.getAttr(config.prefix + 'content-context', attribs) || config.prefix + 'content-context';
  var contentDoneAttr = attr.getAttr(config.prefix + 'content-item-done', attribs)
  var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

  function render(fragment, next) {
    var item = fragment.attribs[contentAttr];
    var contentContext = fragment.attribs[contentContextAttr];

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
      attribs[contentContextAttr] = contentContext;
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
