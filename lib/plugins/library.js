'use strict';

var Core = require('../core');
var attr = require('../attr');
var _ = require('lodash');

module.exports = function(handler) {

  function match(tagname, attribs, config, state) {

    var libraryAttr = attr.getAttr(config.prefix + 'library', attribs);
    var libraryAttrCompleted = attr.getAttr(config.prefix + 'library-done', attribs);
    var inlineAttr = attr.getAttr(config.prefix + 'inline', attribs);
    var serverPushAttr = attr.getAttr(config.prefix + 'server-push', attribs);
    var urlAttr = config.prefix + 'url';
    var doneAttr = config.prefix + 'library-done';

    if (!libraryAttr || libraryAttrCompleted) {
      return false;
    }

    // If we have no cdn then drop the parsing of the library
    if(!config.cdn || !config.cdn.url) {
      return false;
    }

    var libraryNames = attribs[libraryAttr].toString().split(',');

    if (inlineAttr) {
      state.setOutput(Core.createTag(tagname, attribs));
    } else {
      state.setSkipClosingTag(tagname);
    }

    _.forEach(libraryNames, function(library) {

      var libraryType = library.split('.').pop();
      var cdnUrl = config.cdn.url + 'vendor/library/' + library;
      var libraryAttribs = _.clone(attribs);

      if (inlineAttr) {
        libraryAttribs[urlAttr] = cdnUrl;
        libraryAttribs[doneAttr] = true;
        Core.pushFragment(tagname, libraryAttribs, state, true, handler);
      } else {
        delete libraryAttribs[config.prefix + 'library'];
        var linkHeaderStr, linkHeader;
        if(serverPushAttr) {
          // link: </assets/jquery.js>; rel=preload, </assets/base.css>; rel=preload
          linkHeaderStr = state.getAdditionalHeader('link');
          linkHeader = linkHeaderStr ? linkHeaderStr.split(/\s*,\s*/) : [];
          linkHeader.push('<' + cdnUrl + '>; rel=preload');
          state.setAdditionalHeader('link', linkHeader.join(', '));
        }
        state.setOutput(Core.createAssetTag(libraryType, cdnUrl, libraryAttribs));
      }

    });

    return true;

  }

  return {
    name:'library',
    match: match
  };

};
