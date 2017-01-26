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

// https://www.w3.org/TR/preload/
var ext2as = {
  js: 'script',
  css: 'style',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  svg: 'image',
  gif: 'image',
  aac: 'media',
  avi: 'media',
  mp3: 'media',
  mp4: 'media',
  mkv: 'media',
  ogg: 'media',
  wma: 'media',
  ttf: 'font',
  woff: 'font'
};

function getServerPushHeader(url) {
  var ext = url.split('.').pop().toLowerCase();
  var asAttr = ext in ext2as ? '; as=' + ext2as[ext] : '';
  return '<' + url + '>; rel=preload' + asAttr;
}

module.exports = {
  getAttr: getAttr,
  parseAttribs: parseAttribs,
  getServerPushHeader: getServerPushHeader
};
