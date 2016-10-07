'use strict';

var Core = require('../core');
var attr = require('../attr');

function match(tagname, attribs, config, state) {
  var libraryAttr = attr.getAttr(config.prefix + 'library', attribs);
  var libraryAttrCompleted = attr.getAttr(config.prefix + 'library-done', attribs);

  if (!libraryAttr || libraryAttrCompleted) {
    return false;
  }

  // If we have no cdn then drop the parsing of the library
  if(!config.cdn || !config.cdn.url) {
    return false;
  }

  var library = attribs[libraryAttr].toString()
  var libraryType = library.split('.').pop();
  var cdnUrl = config.cdn.url + 'vendor/lib/' + library;
  var selfClosing;

  if (libraryType === 'js') {
    if (tagname !== 'script') {
      return false;
    }
    attribs.src = cdnUrl;
    selfClosing = false;
  }
  if (libraryType === 'css') {
    if (tagname !== 'link') {
      return false;
    }
    attribs.href = cdnUrl;
    selfClosing = true;
  }

  attribs[config.prefix + 'library-raw'] = library;
  attribs[config.prefix + 'library-done'] = true;
  delete attribs[config.prefix + 'library'];

  state.setOutput(Core.createTag(tagname, attribs, selfClosing));

  return true;

}

module.exports = {
  name:'library',
  match: match
};
