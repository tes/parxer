'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Core html parsing", function() {

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

  it('should parse url attributes and replace complex default html as well as text', function(done) {
      var input = "<html><div id='url' cx-url='{{server:name}}'><!-- comment --><h1>I am some default text</h1><span>Hello</span></div></html>";
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
      var input = "<html><div id='bundle' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
          require('../Plugins').Url(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        timeout: 20,
        plugins: [
          require('../Plugins').Url(function(fragment, next) { setTimeout(function() { next(null, fragment.attribs['cx-url']) }, 40); })
        ],
        variables: {
          'server:name':'http://www.google.com'
        }
      }, input, function(err, data) {
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
      var input = "<html><div id='bundle'><div cx-replace-outer='true' cx-bundles='service-name/top.js'><script id='default'>This is some default script</script></div></div></html>";
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
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE/html/top.js.html');
        expect($('#default').length).to.be(0);
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
      }, input, function(err, data) {
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
      }, input, function(err, data) {
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
      }, input, function(err, data) {
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
      }, input, function(err, data) {
        var $ = cheerio.load(data);
        expect($('#wrapper h1').text()).to.be('HTMLHello');
        done();
      });
  });


});


