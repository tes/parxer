'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Bundle parsing", function() {

  it('should parse bundle attributes and use direct js urls', function(done) {
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
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.js');
        done();
      });
  });

  it('should parse bundle attributes, replace the outer bundle, and use direct js urls', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.js');
        done();
      });
  });

  it('should parse bundle attributes and use direct js urls (relative URL)', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        baseURL: 'http://base.url.com',
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html script')[0].attribs.src).to.be('/service-name/50/js/top.js');
        done();
      });
  });

  it('should parse bundle attributes and use client-hint urls', function(done) {
      var input = "<html><link id='bundle' cx-replace-outer='true' rel='preload' cx-client-hint cx-bundles='service-name/top.js' /></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html').html()).to.be('<link rel="preload" as="script" href="http://base.url.com/service-name/50/js/top.js" id="bundle">');
        done();
      });
  });

  it('should parse bundle attributes and use direct js urls (add link)', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-server-push cx-bundles='service-name/top.js'></div></html>";
      var commonState = {};
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        },
        commonState: commonState
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        var additionalHeaders = commonState.additionalHeaders;
        expect($('html script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.js');
        expect(additionalHeaders.link).to.be('<http://base.url.com/service-name/50/js/top.js>; rel=preload; as=script');
        done();
      });
  });

  it('should parse bundle attributes and use direct css urls', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-bundles='service-name/top.css'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html link')[0].attribs.href).to.be('http://base.url.com/service-name/50/css/top.css');
        expect($('html link')[0].attribs.rel).to.be('stylesheet');
        done();
      });
  });

  it('should parse bundle attributes and inline css urls with cx-inline', function(done) {
      var input = "<html><style id='bundle' cx-inline cx-bundles='service-name/top.css'></style></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/css/top.css');
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle script')[0].attribs.src).to.be('http://base.url.com/service-name/YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE/js/top.js');
        expect($('#default').length).to.be(0);
        done();
      });
  });

  it('should correctly close script tags following tes/compoxure#37', function(done) {
      var input = "<html><div id='bundle'><script cx-replace-outer='true' cx-bundles='service-name/top.js'></script><script id='follower'>Following script</script></div></html>";
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle script')[0].attribs.src).to.be('http://base.url.com/service-name/YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE/js/top.js');
        expect($('#bundle').text()).to.be('Following script');
        done();
      });
  });

  it('should parse bundle attributes and allow specification of specific bundle versions', function(done) {
      var input = "<html><div id='bundle' cx-bundles='service-name/top.js@123'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle script')[0].attribs.src).to.be('http://base.url.com/service-name/123/js/top.js');
        done();
      });
  });

  it('should return stastitcs that allow you to understand what bundles are being used', function(done) {
      var input = "<html><div id='bundle' cx-bundles='service-name/top.js@123'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        expect(err.statistics.bundles['service-name'][0].service).to.be('service-name');
        done();
      });
  });

  it('should parse bundles with dots', function(done) {
      var input = "<html><div id='bundle' cx-bundles='service-name/top.2.0.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.2.0.js');
        done();
      });
  });

  it('should parse bundle attributes and use a cdn resolver if provided and default to url', function(done) {
      var input = "<html><div id='bundle' cx-bundles='service-name/top.js,service-other-name/bottom.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/',
          resolver: function(service) {
            if (service === 'service-name') {
              return 'http://resolved.url.com/';
            }
          }
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'static:service-other-name':'51',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        var bundleOne = $('#bundle script')['0'].attribs.src;
        var bundleTwo = $('#bundle script')['1'].attribs.src;
        expect(bundleOne).to.be('http://resolved.url.com/service-name/50/js/top.js');
        expect(bundleTwo).to.be('http://base.url.com/service-other-name/51/js/bottom.js');
        done();
      });
  });

  it('should remove duplicates', function(done) {
      var input = "<html><div class='bundle' cx-bundles='service-name/top.js'></div><div id='bundle' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('.bundle').length).to.be(2);
        expect($('.bundle script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.js');
        done();
      });
  });

});
