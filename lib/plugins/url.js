var Core = require('../core');
var _ = require('lodash');

module.exports = function(handler) {

  var parsedAttribs = ['url', 'cache-key', 'no-cache'];
  var rawSuffix = '-raw';

  /*
    Parse any of the properties that have variables in them
  */
  function parseAttribs(attribs, config) {
    attribs = _.clone(attribs);
    parsedAttribs.forEach(function(attrib) {
        if(attribs[config.prefix + attrib]) {
          attribs[config.prefix + attrib + rawSuffix] = attribs[config.prefix + attrib];
          attribs[config.prefix + attrib] = Core.render(attribs[config.prefix + attrib], config.variables);
        }
    });
    return attribs;
  }

  /*
    Core cx-url handling function
    responds to cx-url="{{server:name}}/path" declarations
  */
  function matchUrl(tagname, attribs, config, state) {
    if(attribs && attribs[config.prefix + 'url']) {
      attribs = parseAttribs(attribs, config);
      if(attribs[config.prefix + 'replace-outer']) {
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
    if(attribs && attribs[config.prefix + 'bundles']) {

       var bundleNames = Core.render(attribs[config.prefix + 'bundles'], config.variables).split(','), baseUrl;
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
                  bundleVersion = '{{^static:' + bundleKey + '}}YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE{{/static:' + bundleKey + '}}{{#static:' + bundleKey + '}}{{static:' + bundleKey + '}}{{/static:' + bundleKey + '}}',
                  bundleUrl = baseUrl + bundle.service + '/' + bundleVersion + '/html/' + bundle.name + '.html';

              bundleAttribs[config.prefix + 'bundles' + rawSuffix] = bundleAttribs[config.prefix + 'bundles'];
              delete bundleAttribs[config.prefix + 'bundles'];
              bundleAttribs[config.prefix + 'url'] = bundleUrl;
              if(bundleAttribs[config.prefix + 'replace-outer']) {
                  state.setSkipClosingTag(true);
              } else {
                  state.setOutput(Core.createTag(tagname, attribs));
              }
              Core.pushFragment(tagname, bundleAttribs, state, bundle, handler);
              state.setOutput('</' + tagname + '>'); // Close
            }
          });
          state.setSkipClosingTag(true);
      }
      return true;
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
