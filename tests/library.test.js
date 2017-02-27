'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');

describe("Library parsing", function() {

  it('should parse library attributes and re-render src for js scripts', function(done) {
      var input = "<html><div id='library'><script cx-replace-outer async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js'></script></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library script').attr('src')).to.be('http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.js');
        done();
      });
  });

  it('should parse library attributes and re-render href for css scripts', function(done) {
      var input = "<html><div id='library'><link cx-replace-outer cx-library='bootstrap-3.0/bootstrap-3.0.css' media='print' rel='stylesheet'/></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library link').attr('href')).to.be('http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.css');
        expect($('#library link').attr('media')).to.be('print');
        expect($('#library link').attr('rel')).to.be('stylesheet');
        done();
      });
  });

  it('should parse library attributes and re-render src for js scripts (client hint)', function(done) {
      var input = "<html><div id='library'><script cx-replace-outer cx-client-hint async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js'></script></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library').html()).to.be('<link rel="preload" as="script" href="http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.js">');
        done();
      });
  });

  it('should parse library attributes and re-render href for css scripts (client hint)', function(done) {
      var input = "<html><div id='library'><link cx-replace-outer cx-client-hint cx-library='bootstrap-3.0/bootstrap-3.0.css'/></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library').html()).to.be('<link rel="preload" as="style" href="http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.css">');
        done();
      });
  });

  it('should parse multiple libraries and pass on the attributes from the input tag', function(done) {
      var input = "<html><div id='library'><script cx-replace-outer async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js,tes-1.0/tes-1.0.js'></script></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library script').attr('src')).to.be('http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.js');
        done();
      });
  });

  it('can inline libraries if requested via cx-inline', function(done) {
      var input = "<html><style id='library' cx-library='bootstrap-3.0/bootstrap-3.0.css,tes-1.0/tes-1.0.css' cx-inline></style></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library').text()).to.be('http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.csshttp://base.url.com/vendor/library/tes-1.0/tes-1.0.css');
        done();
      });
  });

  it('can inline libraries if requested via cx-inline and replace variables', function(done) {
      var input = "<html><style id='library' cx-library='bootstrap-3.0/bootstrap-3.0.css' cx-inline></style></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, 'this is the text {{server:name}}'); })
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
        expect($('#library').text()).to.be('this is the text http://www.google.com');
        done();
      });
  });

  it('can inline libraries if requested via cx-inline and replace variables and remove tag with replace-outer', function(done) {
      var input = "<html><div id='library'><style cx-replace-outer cx-library='bootstrap-3.0/bootstrap-3.0.css' cx-inline></style></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, 'this is the text {{server:name}}'); })
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
        expect($('#library').text()).to.be('this is the text http://www.google.com');
        done();
      });
  });

  it('should append server push headers if asked to', function(done) {
      var input = "<html><div id='library'><script cx-replace-outer cx-server-push async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js'></script></div></html>";
      var commonState = {};
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        },
        commonState: commonState
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        var additionalHeaders = commonState.additionalHeaders;
        expect($('#library script').attr('src')).to.be('http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.js');
        expect(additionalHeaders.link).to.be('<http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.js>; rel=preload; as=script');
        done();
      });
  });

  it('should remove duplicates', function(done) {
      var input = "<html><div id='library'><script cx-replace-outer async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js'></script><script cx-replace-outer async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js'></script></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#library script').attr('src')).to.be('http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.js');
        expect($('#library script').length).to.be(1);
        done();
      });
  });

  it('should remove duplicates (2)', function(done) {
      var input = "<html><compoxure cx-library='bootstrap-3.0/bootstrap-3.0.css'></compoxure><compoxure cx-library='bootstrap-3.0/bootstrap-3.0.css,tes-1.0/tes-1.0.css'></compoxure></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('link[href="http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.css"]').length).to.be(1);
        expect($('link[href="http://base.url.com/vendor/library/tes-1.0/tes-1.0.css"]').length).to.be(1);
        done();
      });
  });

  it('should remove duplicates, using commonState', function(done) {
      var input = "<html><compoxure cx-library='bootstrap-3.0/bootstrap-3.0.css,tes-1.0/tes-1.0.css'></compoxure></html>";
      parxer({
        plugins: [
          require('../Plugins').Library(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/'
        },
        environment: 'test',
        variables: {
          'static:service-name|top':'50',
          'server:name':'http://www.google.com'
        },
        commonState: {
          alreadyImported: {
            'library:bootstrap-3.0/bootstrap-3.0.css': true
          }
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('link[href="http://base.url.com/vendor/library/bootstrap-3.0/bootstrap-3.0.css"]').length).to.be(0);
        expect($('link[href="http://base.url.com/vendor/library/tes-1.0/tes-1.0.css"]').length).to.be(1);
        done();
      });
  });
});
