'use strict';

var Core = require('../core');
var attr = require('../attr');
var _ = require('lodash');

module.exports = function(handler) {

  function match(tagname, attribs, config, state) {

    var libraryAttr = attr.getAttr(config.prefix + 'library', attribs);
    var libraryAttrCompleted = attr.getAttr(config.prefix + 'library-done', attribs);
    var inlineAttr = attr.getAttr(config.prefix + 'inline', attribs);
    var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);
    var serverPushAttr = attr.getAttr(config.prefix + 'server-push', attribs);
    var clientHintAttr = attr.getAttr(config.prefix + 'client-hint', attribs);
    var urlAttr = config.prefix + 'url';
    var doneAttr = config.prefix + 'library-done';

    if (!libraryAttr || libraryAttrCompleted) {
      return false;
    }

    // If we have no cdn then drop the parsing of the library
    if(!config.cdn || !config.cdn.url) {
      return false;
    }

    var libraryNames = Core.render(attribs[libraryAttr].toString(), config.variables).split(',');

    if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
        state.setSkipClosingTag(tagname);
    } else {
        attribs[config.prefix + 'library-done'] = true;
        state.setOutput(Core.createTag(tagname, attribs));
    }

    var tagType = clientHintAttr ? 'library-hint' : 'library';

    _.forEach(state.filterImported(tagType, libraryNames), function(library) {

      var libraryType = library.split('.').pop();
      var cdnUrl = Core.prepareURL(config.cdn.url + 'vendor/library/' + library, config);
      var libraryAttribs = _.clone(attribs);

      if (inlineAttr) {
        libraryAttribs[urlAttr] = cdnUrl;
        libraryAttribs[doneAttr] = true;
        Core.pushFragment(tagname, libraryAttribs, state, true, Core.renderTextInHandler(handler, config.variables));
      } else {
        delete libraryAttribs[config.prefix + 'library'];
        var linkHeaderStr, linkHeader;
        if(serverPushAttr) {
          // link: </assets/jquery.js>; rel=preload, </assets/base.css>; rel=preload
          linkHeaderStr = state.getAdditionalHeader('link');
          linkHeader = linkHeaderStr ? linkHeaderStr.split(/\s*,\s*/) : [];
          linkHeader.push(Core.getClientHintHeader(cdnUrl));
          state.setAdditionalHeader('link', linkHeader.join(', '));
        }
        if (clientHintAttr) {
          libraryAttribs.rel = libraryAttribs.rel || 'preload';
          state.setOutput(Core.getClientHintTag(cdnUrl, libraryAttribs));
        } else {
          state.setOutput(Core.createAssetTag(libraryType, cdnUrl, libraryAttribs));
        }
      }

    });

    return true;

  }

  return {
    name:'library',
    match: match
  };

};
