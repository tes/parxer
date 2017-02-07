'use strict';

var Core = require('./core');
var _ = require('lodash');

function getAttr(attr, attrs) {
  if (!attrs) {
    return null;
  }
  if (attr in attrs) {
    return attr;
  }
  if ('data-' + attr in attrs) {
    return 'data-' + attr;
  }
  return null;
}

function parseAttribs(parsedAttribs, attribs, config) {
  attribs = _.clone(attribs);
  parsedAttribs.forEach(function(attrib) {
      var real = getAttr(config.prefix + attrib, attribs);
      var raw = real + config.rawSuffix;
      if (real) {
        attribs[raw] = attribs[real];
        attribs[real] = Core.render(attribs[real].toString(), config.variables);
      }
  });
  return attribs;
}

module.exports = {
  getAttr: getAttr,
  parseAttribs: parseAttribs
};
