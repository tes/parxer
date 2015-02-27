'use strict';

var _ = require('lodash');
var Hogan = require('hogan.js');
var hoganCache = {};
var async = require('async');
var getAttr = require('./attr').getAttr;

function render(text, data) {
    if(!hoganCache[text]) {
        hoganCache[text] = Hogan.compile(text);
    }
    return hoganCache[text].render(data);
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

function pushFragment(tagname, attribs, state, deferred, handler) {
    state.nextOutput();
    state.setOutput('_processing_');
    state.createFragmentOutput(tagname, attribs, deferred);
    state.setInsideFragment(true);
    var fragment = state.getCurrentFragment();
    var fragmentCallback = function(err, response) {
        if(err) {
            state.setFragmentError(fragment, err);
            state.setFragmentErrorOutput(fragment, err);
        } else {
            state.setFragmentDone(fragment);
            state.setFragmentOutput(fragment, response);
        }
    }
    if(!deferred) {
        handler(fragment, fragmentCallback);
    } else {
        state.defer({key:deferred, fragment:fragment, handler:handler, callback: fragmentCallback});
    }
    state.nextOutput();
    state.nextFragment();
}

function processDeferredStack(config, state, next) {
    async.mapSeries(state.getDeferredStack(), function(deferred, cb) {
        var fragment = deferred.fragment;
        var attrs = fragment.attribs;
        var urlAttr = getAttr(config.prefix + 'url', attrs);
        if (urlAttr) {
          attrs[urlAttr] = render(attrs[urlAttr], config.variables);
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
