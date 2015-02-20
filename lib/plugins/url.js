'use strict';

var Core = require('../core');
var _ = require('lodash');
var getAttr = require('../attr').getAttr;

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];
  var rawSuffix = '-raw';

  /*
    Parse any of the properties that have variables in them
  */
  function parseAttribs(attribs, config) {
    attribs = _.clone(attribs);

    parsedAttribs.forEach(function(attrib) {
        var real = getAttr(config.prefix + attrib, attribs);
        var raw = real + rawSuffix;

        if (real) {
          attribs[raw] = attribs[real];
          attribs[real] = Core.render(attribs[real], config.variables);
        }
    });

    return attribs;
  }

  /*
    Core cx-url handling function
    responds to cx-url="{{server:name}}/path" declarations
  */
  function matchUrl(tagname, attribs, config, state) {
    var urlAttr = getAttr(config.prefix + 'url', attribs);
    var replaceOuterAttr = getAttr(config.prefix + 'replace-outer', attribs);

    if(urlAttr) {
      attribs = parseAttribs(attribs, config);
      if(attribs[replaceOuterAttr]) {
          state.setSkipClosingTag(true);
      } else {
          state.setOutput(Core.createTag(tagname, attribs));
      }
      Core.pushFragment(tagname, attribs, state, null, handler);
      return true;
    } else {
      return false;
    }
  }

  /*
    Core cx-bundles handling function
    responds to cx-bundles="bundle1.js,bundle2.js" declarations
    and generates a set of cx-url definitions on the fly that are deferred
    for later processing (as the config.variables property is expected to have been updated)
    by the first round of cx-url requests
  */
  function matchBundles(tagname, attribs, config, state) {
    var bundlesAttr = getAttr(config.prefix + 'bundles', attribs);
    var bundlesRawAttr = bundlesAttr + rawSuffix;
    var replaceOuterAttr = getAttr(config.prefix + 'replace-outer', attribs);
    var directAttr = config.prefix + 'direct';
    var urlAttr = config.prefix + 'url';

    if(bundlesAttr) {
        if (bundlesAttr.substr(0, 5) === 'data-') {
          urlAttr = 'data-' + urlAttr;
          directAttr = 'data-' + directAttr;
        }

       var bundleNames = Core.render(attribs[bundlesAttr], config.variables).split(','), baseUrl;
       var bundles = _.map(bundleNames, function(bundle) {
          if(bundle.indexOf('/') >= 0) {
            var splitBundle = bundle.split('/');
            return {
              service: splitBundle[0],
              name: splitBundle[1]
            }
          } else {
            return false
          } // Silently drop any without the / delimiter, now required
       });

       if(config.cdn && config.cdn.url) {
          baseUrl = config.cdn.url;
          bundles.forEach(function(bundle) {
            if(bundle) {

              var bundleAttribs = _.clone(attribs),
                  bundleKey = bundle.service + '|' + bundle.name.split('.')[0],
                  bundleType = bundle.name.split('.')[1],
                  bundleVersion = '{{^static:' + bundleKey + '}}YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE{{/static:' + bundleKey + '}}{{#static:' + bundleKey + '}}{{static:' + bundleKey + '}}{{/static:' + bundleKey + '}}',
                  bundleUrl = baseUrl + bundle.service + '/' + bundleVersion + '/html/' + bundle.name + '.html',
                  directAssetUrl = baseUrl + bundle.service + '/' + bundleVersion + '/' + bundleType + '/' + bundle.name;

              bundleAttribs[bundlesRawAttr] = bundleAttribs[bundlesAttr];
              delete bundleAttribs[bundlesAttr];
              if(bundleAttribs[replaceOuterAttr]) {
                  state.setSkipClosingTag(true);
              } else {
                  state.setOutput(Core.createTag(tagname, attribs));
              }
              if(config.minified) {
                // Set the content directly vs adding a fragment
                bundleAttribs[directAttr] = createTag(bundleType, directAssetUrl);
                Core.pushFragment(tagname, bundleAttribs, state, bundle, function(fragment, next) {
                  var testHandler = require('./direct');
                  next(null, testHandler.match(fragment.tagname, fragment.attribs, config, state));
                });
              } else {
                bundleAttribs[urlAttr] = bundleUrl;
                Core.pushFragment(tagname, bundleAttribs, state, true, handler);
              }
            }
          });
      }
      return true;
    }
  }

  function createTag(bundleType, directAssetUrl) {
    if(bundleType === 'js') {
      return '<script src="' + directAssetUrl + '"></script>';
    } else if(bundleType === 'css') {
      return '<link href="' + directAssetUrl + '" media="all" rel="stylesheet" />';
    } else {
      return '<!-- IGNORED ' + bundleType + ' - ' + directAssetUrl + ' -->'
    }
  }

  function match(tagname, attribs, config, state) {
    return matchUrl(tagname, attribs, config, state) || matchBundles(tagname, attribs, config, state);
  }

  return {
    name:'url',
    match: match,
    parsedAttribs: parsedAttribs
  };

}
