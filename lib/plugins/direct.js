'use strict';

var Core = require('../core');
var getAttr = require('../attr').getAttr;

function match(tagname, attribs, config) {
  var directAttr = getAttr(config.prefix + 'direct', attribs)

  if(directAttr) {
    return Core.render(attribs[directAttr], config.variables);
  }
}

module.exports = {
  name:'direct',
  match: match
};
