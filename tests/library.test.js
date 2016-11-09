'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');

describe("Library parsing", function() {

  it('should parse library attributes and re-render src for js scripts', function(done) {
      var input = "<html><div id='library'><script async='true' cx-library='bootstrap-3.0/bootstrap-3.0.js'></script></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library
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
      var input = "<html><div id='library'><link cx-library='bootstrap-3.0/bootstrap-3.0.css' media='all' rel='stylesheet'/></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library
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
        done();
      });
  });


  it('wont parse css if not link', function(done) {
      var input = "<html><div id='library'><div cx-library='bootstrap-3.0/bootstrap-3.0.css'></div></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library
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
        expect($('#library div').attr('href')).to.be(undefined);
        done();
      });
  });

  it('wont parse js if not script', function(done) {
      var input = "<html><div id='library'><div cx-library='bootstrap-3.0/bootstrap-3.0.js'></div></div></html>";
      parxer({
        plugins: [
          require('../Plugins').Library
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
        expect($('#library div').attr('src')).to.be(undefined);
        done();
      });
  });

});
