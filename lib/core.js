'use strict';

var _ = require('lodash');
var Hogan = require('./hogan.js');
var async = require('async');

function escapeVariables(obj) {
    return Object.keys(obj)
    .map(function (k){
      return [k.replace(/\./g, '::'), obj[k]];
    })
    .reduce(function (acc, values) {
      acc[values[0]] = values[1];
      return acc;
    }, {});
}

function render(text, data) {
    var output = Hogan.compile(text).render(escapeVariables(data));
    return output;
}

function matchPlugin(plugins, tagname, attribs, config, state) {
    if(!plugins) { return false; }
    var matched = false;
    plugins.forEach(function(plugin) {
        matched = matched || plugin.match(tagname, attribs, config, state);
    });
    return matched;
}

function createTag(tagname, attribs, selfClosing) {
    var attribArray = [], attribLength = attribs.length, attribCounter = 0;
    _.forIn(attribs, function(value, key) {
        attribCounter++;
        attribArray.push(' ' + key + '="' + value + '"');
    });
    return ['<',tagname,(attribLength > 0 ? ' ' : '')].concat(attribArray).concat([(selfClosing ? '/>' :'>')]).join('');
}

function pushFragment(tagname, attribs, state, deferred, handler, onSuccess, onError) {
    state.nextOutput();
    state.setOutput('_processing_');
    state.createFragmentOutput(tagname, attribs, deferred);
    state.setBlock('inside-fragment', tagname);
    var fragment = state.getCurrentFragment();
    var fragmentCallback = function(err, response) {
        if(err) {
            // If errored, display error based on configuration
            state.setFragmentError(fragment, err);
            state.setFragmentErrorOutput(fragment, err);
            if(onError) { onError(); }
        } else if (!response) {
            // If no error or response, just leave the HTML where it is
            state.setFragmentDone(fragment);
            state.setFragmentDefaultOutput(fragment);
        } else {
            // We have a response
            state.setFragmentDone(fragment);
            state.setFragmentOutput(fragment, response);
            if(onSuccess) { onSuccess(); }
        }
    }
    if(!deferred) {
        handler(fragment, fragmentCallback, state);
    } else {
        state.defer({key:deferred, fragment:fragment, handler:handler, callback: fragmentCallback, state: state});
    }
    state.nextOutput();
    state.nextFragment();
}

function processDeferredStack(config, state, next) {
    var attr = require('./attr');
    async.mapSeries(state.getDeferredStack(), function(deferred, cb) {
        var fragment = deferred.fragment;
        var attrs = fragment.attribs;
        var urlAttr = attr.getAttr(config.prefix + 'url', attrs);
        if (urlAttr) {
          attrs[urlAttr] = render(attrs[urlAttr].toString(), config.variables);
        }
        deferred.handler(fragment, function(err, response) {
            deferred.callback(err, response);
            cb();
        });
    }, next);
}

module.exports = {
    render: render,
    matchPlugin: matchPlugin,
    createTag: createTag,
    pushFragment: pushFragment,
    processDeferredStack: processDeferredStack
};
