'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("If logic plugin", function() {

  it('should parse if attributes and retain block if true', function(done) {
      var input = "<html><div id='if' cx-if='{{server:name}}' cx-if-value='http://www.google.com'><h1>Hello</h1><span id='stillhere'>Rah!</span></div></html>";
      parxer({
        plugins: [
          require('../Plugins').If
        ],
      variables: {
        'environment:name':'test',
        'server:name':'http://www.google.com'
      }}, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#stillhere').text()).to.be('Rah!');
        done();
      });
  });

  it('should parse if attributes and remove block if false', function(done) {
      var input = "<html><div id='if' cx-if='{{server:name}}' cx-if-value='http://www.tes.com'><h1>Hello</h1><span id='stillhere'>Rah!</span></div></html>";
      parxer({
        plugins: [
          require('../Plugins').If
        ],
      variables: {
        'environment:name':'test',
        'server:name':'http://www.google.com'
      }}, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('div').text()).to.be('');
        done();
      });
  });


  it('should parse if attributes and allow block if false, removing block if cx-replace-outer', function(done) {
      var input = "<html><div id='if' cx-replace-outer='true' cx-if='{{environment:name}}' cx-if-value='test'><h1>Hello</h1><br/><!-- hello --><span id='stillhere'>Rah!</span></div></html>";
      parxer({
        plugins: [
          require('../Plugins').If
        ],
      variables: {
        'environment:name':'test',
        'server:name':'http://www.google.com'
      }}, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('div').text()).to.be('');
        done();
      });
  });

  it('should parse if attributes and retain block if true, including url declarations', function(done) {
      var input = "<html><div id='if' cx-if='{{server:name}}' cx-if-value='http://www.google.com'><div cx-url='{{server:name}}'></div></div></html>";
      parxer({
        plugins: [
          require('../Plugins').If,
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']) })
        ],
      variables: {
        'server:name':'http://www.google.com'
      }}, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#if').text()).to.be('http://www.google.com');
        done();
      });
  });

  it('should parse bundle attributes within if blocks', function(done) {
      var input = "<html><div id='if' cx-replace-outer='true' cx-if='{{server:name}}' cx-if-value='http://www.google.com'><div id='bundle' cx-bundles='service-name/top.js'></div></div></html>";
      parxer({
        plugins: [
          require('../Plugins').If,
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/html/top.js.html');
        done();
      });
  });

});


