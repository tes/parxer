'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Url parsing", function() {

  it('should parse url attributes', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'>I am some default text</div></html>";
      parxer({
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']) })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        done();
      });
  });

  it('should parse url attributes and replace complex default html as well as text', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'><!-- comment --><h1>I am some default text</h1><span>Hello</span></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']) })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        expect($('#test').text()).to.be('test');
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        done();
      });
  });

  it('should deal with managing overall timeout', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'></div></html>";
      parxer({
        timeout: 20,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next(null, fragment.attribs['cx-url']) }, 40); })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        expect(err.statusCode).to.be(500);
        expect(err.content).to.contain('Timeout exceeded, failed to respond');
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
      }, input, function(err, fragmentCount, data) {
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('http://www.google.com');
        done();
      });
  });

  it('should deal with a service that returns an error but show default text if configured to', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'><h1>Default Content</h1><span>More content</span></div></html>";
      parxer({
        timeout: 100,
        showErrors: false,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next('Arrghh'); }, 20)} )
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#url').text()).to.be('Default ContentMore content');
        done();
      });
  });

  it('should deal with a service that returns an error but show default html if configured to', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'><h1>HTML</h1><div>Hello</div></div></html>";
      parxer({
        timeout: 100,
        showErrors: false,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next('Arrghh'); }, 20)} )
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#url h1').text()).to.be('HTML');
        expect($('#url div').text()).to.be('Hello');
        done();
      });
  });

  it('should deal with a service that returns an error but show default html if configured to and replace outer', function(done) {
      var input = "<html><div id='wrapper'><div id='url' cx-replace-outer='true' cx-url='{{server:name}}'><h1>HTML</h1><div>Hello</div></div></div></html>";
      parxer({
        timeout: 100,
        showErrors: false,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next('Arrghh'); }, 20)} )
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#wrapper h1').text()).to.be('HTML');
        expect($('#wrapper div').text()).to.be('Hello');
        done();
      });
  });

  it('should deal with a service that returns an error but show default html if configured to and survive malformed html', function(done) {
      var input = "<html><div id='wrapper'><div id='url' cx-replace-outer='true' cx-url='{{server:name}}'><h1>HTML<div>Hello</div></div></html>";
      parxer({
        timeout: 100,
        showErrors: false,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next('Arrghh'); }, 20)} )
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#wrapper h1').text()).to.be('HTMLHello');
        done();
      });
  });

  it('should return stats about the fragments in the page', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'>I am some default text</div></html>";
      parxer({
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']) })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        expect(err.statistics.fragments['http://www.google.com'].attribs.id).to.be('url');
        done();
      });
  });


});
