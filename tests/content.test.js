'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Content loading from CMS", function() {

  it('should parse content and then allow cx-content-items to be inserted attribute', function(done) {
    var input = "<html><div id='content' cx-content='tag'></div><div id='item' cx-content-item='{{content:tag:hello}}'>default</div></html>";
    var variables = {};
    parxer({
      plugins: [
        require('../Plugins').ContentItem,
        require('../Plugins').Content(function(fragment, next) {
          variables['content:tag:hello'] = 'hello';
          next(null, '<!-- loaded -->');
        })
      ],
      variables: variables
    }, input, function(err, fragmentCount, data) {
      var $ = cheerio.load(data);
      expect($('#item').text()).to.be('hello');
      done();
    });
  });

  it('should retain default if content not found and errors not shown', function(done) {
    var input = "<html><div id='content' cx-content='tag'></div><div id='item' cx-content-item='{{content:tag:hello}}'>default</div></html>";
    var variables = {};
    parxer({
      showErrors: false,
      plugins: [
        require('../Plugins').ContentItem,
        require('../Plugins').Content(function(fragment, next) {
          next(null, '<!-- loaded -->');
        })
      ],
      variables: variables
    }, input, function(err, fragmentCount, data) {
      var $ = cheerio.load(data);
      expect($('#item').text()).to.be('default');
      expect(err.fragmentErrors.length).to.be(1);
      done();
    });
  });

  it('should retain default if content context not in page even if errors are shown', function(done) {
    var input = "<html><div id='item' cx-content-item='{{content:tag:hello}}'>default</div></html>";
    var variables = {};
    parxer({
      showErrors: true,
      plugins: [
        require('../Plugins').ContentItem,
        require('../Plugins').Content(function(fragment, next) {
          next(null, '<!-- loaded -->');
        })
      ],
      variables: variables
    }, input, function(err, fragmentCount, data) {
      var $ = cheerio.load(data);
      expect($('#item').text()).to.be('default');
      done();
    });
  });

  it('should display errors if content not found and showing errors', function(done) {
    var input = "<html><div id='content' cx-content='tag'></div><div id='item' cx-content-item='{{content:tag:not-found}}'>default</div></html>";
    var variables = {};
    parxer({
      showErrors: true,
      plugins: [
        require('../Plugins').ContentItem,
        require('../Plugins').Content(function(fragment, next) {
          next(null, '<!-- loaded -->');
        })
      ],
      variables: variables
    }, input, function(err, fragmentCount, data) {
      var $ = cheerio.load(data);
      expect($('#item').text()).to.contain('Content not found for');
      expect(err.fragmentErrors.length).to.be(1);
      done();
    });
  });

  it('should display errors if content request fails and showing errors', function(done) {
    var input = "<html><div id='content' cx-content='tag'></div><div id='item' cx-content-item='{{content:tag:not-found}}'>default</div></html>";
    var variables = {};
    parxer({
      showErrors: true,
      plugins: [
        require('../Plugins').ContentItem,
        require('../Plugins').Content(function(fragment, next) {
          next('Unable to load content');
        })
      ],
      variables: variables
    }, input, function(err, fragmentCount, data) {
      var $ = cheerio.load(data);
      expect($('#content').text()).to.contain('Unable to load content');
      expect(err.fragmentErrors.length).to.be(1);
      done();
    });
  });

  it('should replace outer if specified', function(done) {
    var input = "<html><div id='content' cx-content='tag'></div><div id='outer'><div cx-content-item='{{content:tag:hello}}' cx-replace-outer='true'>default</div></div></html>";
    var variables = {};
    parxer({
      plugins: [
        require('../Plugins').ContentItem,
        require('../Plugins').Content(function(fragment, next) {
          variables['content:tag:hello'] = '<strong>hello</strong>';
          next(null, '<!-- loaded -->');
        })
      ],
      variables: variables
    }, input, function(err, fragmentCount, data) {
      var $ = cheerio.load(data);
      expect($('#outer').text()).to.be('<strong>hello</strong>');
      done();
    });
  });

});
