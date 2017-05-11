'use strict';

var _ = require('lodash');
var Hogan = require('./hogan.js');
var async = require('async');
var urlLib = require('url');

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
    if (!text) { return ''; }
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

function createAssetTag(bundleType, url, attribs) {
    if(bundleType === 'js') {
      attribs.src = url;
      return createTag('script', attribs, false) + '</script>';
      //return '<script src="' + directAssetUrl + '"></script>';
    } else if(bundleType === 'css') {
      attribs.href = url;
      attribs.rel = attribs.rel || 'stylesheet';
      attribs.media = attribs.media || 'all';
      return createTag('link', attribs, true);
    } else {
      return '<!-- IGNORED ' + bundleType + ' - ' + url + ' -->'
    }
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

function isCxCustomTag(tagname) {
    return tagname.indexOf('compoxure') === 0;
}

function renderTextInHandler(handler, variables) {
    return function(fragment, next){
        handler(fragment, function (err, content, headers) {
            next(err, render(content, variables), headers);
        });
    };
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

function getClientHint(url, rel) {
  rel = rel || 'preload';
  var ext = url.split('.').pop().toLowerCase();
  var asAttr = ext in ext2as ? ext2as[ext] : '';
  return { url: url, rel: rel, asAttr: asAttr };
}

function getClientHintHeader(url, rel) {
  var d = getClientHint(url, rel);
  d.asAttr = d.asAttr ? '; as=' + d.asAttr : '';
  return '<' + d.url + '>; rel=' + d.rel + d.asAttr;
}

function getClientHintTag(url, attribs) {
  var d = getClientHint(url, attribs.rel);
  return createTag('link', { rel: d.rel, as: d.asAttr, href: url }, true);
}

function prepareURL(url, baseURL) {
  var cdnUrl;
  if (baseURL) {
    cdnUrl = urlLib.parse(url);
    if (baseURL === urlLib.format({ protocol: cdnUrl.protocol, host: cdnUrl.host })) {
      return cdnUrl.path;
    }
  }
  return url;
}

module.exports = {
    render: render,
    matchPlugin: matchPlugin,
    createTag: createTag,
    createAssetTag: createAssetTag,
    pushFragment: pushFragment,
    processDeferredStack: processDeferredStack,
    isCxCustomTag: isCxCustomTag,
    renderTextInHandler: renderTextInHandler,
    getClientHintHeader: getClientHintHeader,
    getClientHintTag: getClientHintTag,
    prepareURL: prepareURL
};
