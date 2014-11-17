'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');

describe("Simple parsing", function() {

  it('should parse a valid html document unchanged', function(done) {
      var input = "<html></html>";
      parxer({}, input, function(err, data) {
        expect(data).to.be(input);
        done();
      });
  });

  it('should correct badly enclosed tags in a complex html document', function(done) {
      var input = "<html><div/><span><span><form></html>";
      var correctOutput = "<html><div><span><span><form></form></span></span></div></html>";
      parxer({}, input, function(err, data) {
        expect(data).to.be(correctOutput);
        done();
      });
  });

  it('should parse test attributes', function(done) {
      var input = "<html><div id='test' cx-test='{{environment:name}}'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Test
        ],
      variables: {
        'environment:name':'test'
      }}, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#test').text()).to.be('test');
        done();
      });
  });

  it('should parse url attributes', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']) })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        done();
      });
  });

  it('should parse bundle attributes', function(done) {
      var input = "<html><div id='bundle' cx-bundles='top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/test/default/html/top.js.html');
        done();
      });
  });

  it('should allow you to define your own prefix', function(done) {
      var input = "<html><div id='url' data-my-url='{{server:name}}'></div></html>";
      parxer({
        prefix: 'data-my-',
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['data-my-url']) })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        done();
      });
  });

});


