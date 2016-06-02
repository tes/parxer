'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config, state) {
  var testAttr = attr.getAttr(config.prefix + 'test', attribs);
  var testAttrDone = attr.getAttr(config.prefix + 'test-done', attribs);

  if (testAttr && !testAttrDone) {
    attribs[config.prefix + 'test-done'] = true;
    state.setOutput(Core.createTag(tagname, attribs));
    state.setOutput(Core.render(attribs[testAttr], config.variables));
    return true;
  }
}

module.exports = {
  name:'test',
  match: match
};
