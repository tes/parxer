'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Image parsing", function() {

  it('should not parse an image or break if no cdn is provided', function(done) {
      var input = "<html><img id='bundle' cx-src='service-name/image.png'></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: null,
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle')[0].attribs.src).not.to.be('http://base.url.com/service-name/50/img/image.png');
        done();
      });
  });

  it('should parse image attributes and set its src', function(done) {
      var input = "<html><img id='bundle' cx-src='service-name/image.png'></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#bundle')[0].attribs.src).to.be('http://base.url.com/service-name/50/img/image.png');
        done();
      });
  });

  it('should generate client hint', function(done) {
      var input = "<html id='bundle'><img cx-src='service-name/image.png' cx-client-hint></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#bundle').html()).to.be('<link rel="preload" as="image" href="http://base.url.com/service-name/50/img/image.png">');
        done();
      });
  });

  it('should parse video attributes and set its src', function(done) {
      var input = "<html><video id='bundle' cx-src='service-name/video.mp4'></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#bundle')[0].attribs.src).to.be('http://base.url.com/service-name/50/img/video.mp4');
        done();
      });
  });

  it('should generate client hint (video)', function(done) {
      var input = "<html id='bundle'><video cx-src='service-name/video.mp4' cx-client-hint></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect($('#bundle').html()).to.be('<link rel="preload" as="media" href="http://base.url.com/service-name/50/img/video.mp4">');
        done();
      });
  });

  it('should return statistics about images', function(done) {
      var input = "<html><img id='bundle' cx-src='service-name/image.png'></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
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
        expect(err.statistics.images['service-name/image.png'].src).to.be('http://base.url.com/service-name/50/img/image.png');
        done();
      });
  });

  it('should parse image attributes and honor cdn resolver', function(done) {
      var input = "<html><img id='bundle' cx-src='service-name/image.png'></html>";
      parxer({
        plugins: [
          require('../Plugins').Image(function(fragment, next) { next(null, fragment.attribs['cx-url']); })
        ],
        cdn: {
          url: 'http://base.url.com/',
          resolver: function(service) { return 'http://resolved.url.com/'; }
        },
        environment: 'test',
        variables: {
          'static:service-name':'50',
          'server:name':'http://www.google.com'
        }
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#bundle')[0].attribs.src).to.be('http://resolved.url.com/service-name/50/img/image.png');
        done();
      });
  });

});
