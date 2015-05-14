'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Bundle parsing", function() {

  it('should parse bundle attributes', function(done) {
      var input = "<html><div id='bundle' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
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

  it('should parse bundle attributes and use direct js urls if in minfied mode', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        minified: true,
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('html script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.js');
        done();
      });
  });

  it('should parse bundle attributes and use direct css urls if in minfied mode', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-bundles='service-name/top.css'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        minified: true,
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('html link')[0].attribs.href).to.be('http://base.url.com/service-name/50/css/top.css');
        done();
      });
  });

  it('should replace outer when specified with bundle', function(done) {
      var input = "<html><div id='bundle'><div cx-replace-outer='true' cx-bundles='service-name/top.js'><script id='default'>This is some default script</script></div></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE/html/top.js.html');
        expect($('#default').length).to.be(0);
        done();
      });
  });

});


