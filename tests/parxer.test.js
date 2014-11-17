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
      var input = "<html><div id='url' cx-url='{{server:name}}'>I am some default text</div></html>";
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

  it('should parse a mixture of attributes in a bigger document', function(done) {
      var input = "<html><div id='test' cx-test='{{environment:name}}'></div><div id='url' cx-url='{{server:name}}'>I am some default text</div></html>";
      parxer({
        plugins: [
          require('../Plugins').Test,
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']) })
        ],
        variables: {
          'server:name':'http://www.google.com',
          'environment:name':'test'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        expect($('#test').text()).to.be('test');
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

  it('should deal with all the usual html features', function(done) {
      var input = "<!DOCTYPE html><html><!-- hello --><div class='class'>I am some text</div></html>";
      parxer({}, input, function(err, data) {
        expect(data).to.be(input);
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

  it('should deal with managing overall timeout', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'></div></html>";
      parxer({
        timeout: 100,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next(null, fragment.attribs['cx-url']) }, 1000); })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        expect(err).to.contain('Timeout exceeded, failed to respond');
        done();
      });
  });

  it('should deal with a service that returns an error', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'>Default Content</div></html>";
      parxer({
        timeout: 100,
        showErrors: true,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next('Arrghh'); }, 20)} )
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('Arrghh');
        done();
      });
  });

  it('should replace outer when specified with url', function(done) {
      var input = "<html><div id='url'><div cx-replace-outer='true' cx-url='{{server:name}}'>I am some default text</div></div></html>";
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

   it('should replace outer when specified with bundle', function(done) {
      var input = "<html><div id='bundle'><div cx-replace-outer='true' cx-bundles='top.js'></div></div></html>";
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

  it('should deal with a service that returns an error but show default text if configured to', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'>Default Content</div></html>";
      parxer({
        timeout: 100,
        showErrors: false,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next('Arrghh'); }, 20)} )
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('Default Content');
        done();
      });
  });


});


