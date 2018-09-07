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

function getAttrStartingWith(attr, attrs) {
  return Object.keys(attrs || {})
    .filter(function (attribute) {
      return (attribute.indexOf(attr) === 0) || (attribute.indexOf('data-' + attr) === 0);
    });
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

function getSuffixes(attributes, prefix) {
  return _.uniq(attributes.map(function (attr) {
    if (attr.indexOf('data-') === 0) {
      return attr.slice(('data-' + prefix).length);
    }
    return attr.slice((prefix).length);
  }));
}

module.exports = {
  getAttr: getAttr,
  parseAttribs: parseAttribs,
  getAttrStartingWith: getAttrStartingWith,
  getSuffixes: getSuffixes
};
