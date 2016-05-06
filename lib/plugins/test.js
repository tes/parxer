'use strict';

var Core = require('../core');
var getAttr = require('../attr').getAttr;

function match(tagname, attribs, config, state) {
  var testAttr = getAttr(config.prefix + 'test', attribs);
  var testAttrDone = getAttr(config.prefix + 'test-done', attribs);

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
