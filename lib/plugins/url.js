'use strict';

var Core = require('../core');
var attr = require('../attr');
var _ = require('lodash');
var async = require('async');

var strategyDict = {
  default: function (contents) {
    return contents.join('');
  },
  'first-non-empty': function (contents) {
    return _.find(contents, function (content) {
      return _.trim(content);
    });
  },
  random: function (contents) {
    return _.sample(contents);
  }
};

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];

  /*
    Core cx-url handling function
    responds to cx-url="{{server:name}}/path" declarations
  */
  function matchUrl(tagname, attribs, config, state) {
    var urlAttr = attr.getAttr(config.prefix + 'url', attribs);
    var cacheKeyAttr = attr.getAttr(config.prefix + 'cache-key', attribs);
    var urlAttrCompleted = attr.getAttr(config.prefix + 'url-done', attribs);
    var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);

    var strategyAttr = attr.getAttr(config.prefix + 'strategy', attribs);
    var strategyName = attribs[strategyAttr] || 'default';
    var strategyFunction = strategyDict[strategyName] || strategyDict.default;

    if (!urlAttr || urlAttrCompleted) {
      return false;
    }

    attribs = attr.parseAttribs(parsedAttribs, attribs, config);
    if(replaceOuterAttr || Core.isCxCustomTag(tagname)) {
        state.setSkipClosingTag(tagname);
    } else {
        attribs[config.prefix + 'url-done'] = true;
        state.setOutput(Core.createTag(tagname, attribs));
    }

    Core.pushFragment(tagname, attribs, state, null, function (fragment, next) {
        var urls = fragment.attribs[urlAttr].split(/\s+/);
        var urlsRaw = fragment.attribs[urlAttr + '-raw'].split(/\s+/);
        var cacheKeys = fragment.attribs[cacheKeyAttr] ? fragment.attribs[cacheKeyAttr].split(/\s+/) : [];

        var fragments = urls.map(function (url, index) {
            var urlRaw = urlsRaw[index];
            var cacheKey = cacheKeys[index];
            var newAttribs = { 'cx-url': url, 'cx-url-raw': urlRaw };
            if (cacheKey) {
                newAttribs['cx-cache-key'] = cacheKey;
            }
            var attribs = _.assign({}, fragment.attribs, newAttribs);
            return _.assign({}, fragment, { attribs: attribs });
        });
        async.map(fragments, handler, function (err, contents) {
            var content = strategyFunction(contents);
            next(err, content);
        });
    });

    state.setStatistic('fragments', attribs['cx-url'], {attribs: attribs});

    return true;
  }

  function match(tagname, attribs, config, state) {
    return matchUrl(tagname, attribs, config, state);
  }

  return {
    name:'url',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
