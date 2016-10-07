'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config) {
  var directAttr = attr.getAttr(config.prefix + 'direct', attribs);
  if(directAttr) {
    return Core.render(attribs[directAttr], config.variables);
  }
}

module.exports = {
  name:'direct',
  match: match
};
