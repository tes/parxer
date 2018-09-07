'use strict';

var Core = require('../core');
var attr = require('../attr');
var _ = require('lodash');
var async = require('async');

var strategyDict = {
  default: function (contents) {
    return contents.join('');
  },
  'first-non-empty': function (contents, keys) {
    var sortedContents = _.sortBy(_.zip(keys, contents), function (keyValue) { return keyValue[0]; })
      .map(function (keyValue) {
        return keyValue[1];
      });
    return _.find(sortedContents, function (content) {
      return _.trim(content);
    });
  },
  random: function (contents) {
    return _.sample(contents);
  }
};

module.exports = function (handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];

  /*
    Core cx-url handling function
    responds to cx-url="{{server:name}}/path" declarations
  */
  function matchUrl(tagname, attribs, config, state) {
    var urlAttrCompleted = attr.getAttr(config.prefix + 'url-done', attribs);
    var replaceOuterAttr = attr.getAttr(config.prefix + 'replace-outer', attribs);
    var strategyAttr = attr.getAttr(config.prefix + 'strategy', attribs);
    var strategyName = attribs[strategyAttr] || 'default';
    var strategyFunction = strategyDict[strategyName] || strategyDict.default;

    var urlAttributes = attr.getAttrStartingWith(config.prefix + 'url', attribs); // cx-url-1 cx-url-keyx etc.
    var urlAttributeSuffixes = attr.getSuffixes(urlAttributes, config.prefix + 'url'); // -1 -keyx etc.

    if (!urlAttributes.length || urlAttrCompleted) {
      return false;
    }

    var urlAttributeNamesList = urlAttributeSuffixes.map(function (suffix) {
      return {
        urlAttr: attr.getAttr(config.prefix + 'url' + suffix, attribs),
        cacheKeyAttr: attr.getAttr(config.prefix + 'cache-key' + suffix, attribs),
        timeoutAttr: attr.getAttr(config.prefix + 'timeout' + suffix, attribs),
        ttlAttr: attr.getAttr(config.prefix + 'cache-ttl' + suffix, attribs),
        noCacheAttr: attr.getAttr(config.prefix + 'no-cache' + suffix, attribs)
      };
    });

    var validAttribs = _.flatten(urlAttributeSuffixes.map(function (suffix) {
      return parsedAttribs.map(function (attrib) {
        return attrib + suffix;
      });
    }));

    attribs = attr.parseAttribs(validAttribs, attribs, config);
    if (replaceOuterAttr || Core.isCxCustomTag(tagname)) {
      state.setSkipClosingTag(tagname);
    } else {
      attribs[config.prefix + 'url-done'] = true;
      state.setOutput(Core.createTag(tagname, attribs));
    }

    Core.pushFragment(tagname, attribs, state, null, function (fragment, next) {
      var fragments = urlAttributeNamesList.map(function (urlAttributeNames) {
        var url = fragment.attribs[urlAttributeNames.urlAttr];
        var urlRaw = fragment.attribs[urlAttributeNames.urlAttr + '-raw'];
        var cacheKey = fragment.attribs[urlAttributeNames.cacheKeyAttr];
        var timeout = fragment.attribs[urlAttributeNames.timeoutyAttr];
        var ttl = fragment.attribs[urlAttributeNames.ttlAttr];
        var noCache = fragment.attribs[urlAttributeNames.noCacheAttr];
        var newAttribs = { 'cx-url': url, 'cx-url-raw': urlRaw };
        if (cacheKey) {
          newAttribs['cx-cache-key'] = cacheKey;
        }
        if (timeout) {
          newAttribs['cx-timeout'] = timeout;
        }
        if (ttl) {
          newAttribs['cx-ttl'] = ttl;
        }
        if (noCache) {
          newAttribs['cx-no-cache'] = noCache;
        }
        var attribs = _.assign({}, fragment.attribs, newAttribs);
        return _.assign({}, fragment, { attribs: attribs });
      });

      async.map(fragments, handler, function (err, contents) {
        var content = strategyFunction(contents, urlAttributeSuffixes);
        next(err, content);
      });
    });

    state.setStatistic('fragments', attribs['cx-url'], { attribs: attribs });
    return true;
  }

  function match(tagname, attribs, config, state) {
    return matchUrl(tagname, attribs, config, state);
  }

  return {
    name: 'url',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
