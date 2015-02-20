'use strict';

var Core = require('../core');
var getAttr = require('../attr').getAttr;

function match(tagname, attribs, config, state) {
  var testAttr = getAttr(config.prefix + 'test', attribs);

  if (testAttr) {
    state.setOutput(Core.createTag(tagname, attribs));
    state.setOutput(Core.render(attribs[testAttr], config.variables));
    return true;
  }
}

module.exports = {
  name:'test',
  match: match
};
