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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/html/top.js.html');
        done();
      });
  });

  it('should parse bundle attributes and use direct js urls if in minified mode', function(done) {
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html script')[0].attribs.src).to.be('http://base.url.com/service-name/50/js/top.js');
        done();
      });
  });

  it('should parse bundle attributes and use direct js urls if in minified mode (relative URL)', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-bundles='service-name/top.js'></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        baseURL: 'http://base.url.com',
        minified: true,
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html script')[0].attribs.src).to.be('/service-name/50/js/top.js');
        done();
      });
  });

  it('should parse bundle attributes and use client-hint urls if in minified mode', function(done) {
      var input = "<html><link id='bundle' cx-replace-outer='true' rel='preload' cx-client-hint cx-bundles='service-name/top.js' /></html>";
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html').html()).to.be('<link rel="preload" as="script" href="http://base.url.com/service-name/50/js/top.js">');
        done();
      });
  });

  it('should parse bundle attributes and use direct js urls if in minified mode (add link)', function(done) {
      var input = "<html><div id='bundle' cx-replace-outer='true' cx-server-push cx-bundles='service-name/top.js'></div></html>";
      var commonState = {};
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('html link')[0].attribs.href).to.be('http://base.url.com/service-name/50/css/top.css');
        expect($('html link')[0].attribs.rel).to.be('stylesheet');
        done();
      });
  });

  it('should parse bundle attributes and inline css urls if in minfied mode with cx-inline', function(done) {
      var input = "<html><style id='bundle' cx-inline cx-bundles='service-name/top.css'></style></html>";
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
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/css/top.css');
        done();
      });
  });


  it('should parse bundle attributes and inline css urls if not in minfied mode with cx-inline', function(done) {
      var input = "<html><style id='bundle' cx-inline cx-bundles='service-name/top.css'></style></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        minified: false,
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/css/top.css');
        done();
      });
  });

  it('should parse bundle attributes and inline css urls if not in minfied mode with both cx-inline and cx-replace-outer', function(done) {
      var input = "<html><div id='bundle'><style cx-replace-outer cx-inline cx-bundles='service-name/top.css'></style></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        minified: false,
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/css/top.css');
        done();
      });
  });

  it('should replace variables with cx-inline', function(done) {
      var input = "<html><style id='bundle' cx-inline cx-bundles='service-name/top.css'></style></html>";
      parxer({
        plugins: [
          require('../Plugins').Bundle(function(fragment, next) { next(null, 'this is the text {{server:name}}'); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        minified: false,
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('this is the text http://www.google.com');
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
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE/html/top.js.html');
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
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/YOU_SPECIFIED_A_BUNDLE_THAT_ISNT_AVAILABLE_TO_THIS_PAGE/html/top.js.htmlFollowing script');
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
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/123/html/top.js.html');
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
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        expect(err.statistics.bundles['service-name|top'].service).to.be('service-name');
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
          'static:service-name|top.2.0':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://base.url.com/service-name/50/html/top.2.0.js.html');
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
          url: ' http://base.url.com/',
          resolver: function(service) {
            if (service === 'service-name') {
              return 'http://resolved.url.com/';
            }
          }
        },
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'static:service-other-name|bottom':'51',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle').text()).to.be('http://resolved.url.com/service-name/50/html/top.js.html http://base.url.com/service-other-name/51/html/bottom.js.html');
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
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('.bundle').length).to.be(1);
        expect($('.bundle').text()).to.be('http://base.url.com/service-name/50/html/top.js.html');
        done();
      });
  });

});
