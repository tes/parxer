'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Content loading from CMS", function() {

  it('should parse content and then allow cx-content-items to be inserted attribute', function(done) {
      var input = "<html><div id='content' cx-content='tag'></div><div id='item' cx-content-item='{{cms:hello}}'>default</div></html>";
      var variables = {};
      parxer({
        plugins: [
          require('../Plugins').ContentItem,
          require('../Plugins').Content(function(fragment, next) {
            variables['cms:hello'] = 'hello';
            next(null);
          })
        ],
        variables: variables
      }, input, function(err, fragmentCount, data) {
        var $ = cheerio.load(data);
        expect($('#item').text()).to.be('hello');
        done();
      });
  });

  it('should retain default if content not found', function(done) {
      var input = "<html><div id='content' cx-content='tag'></div><div id='item' cx-content-item='{{cms:hello}}'>default</div></html>";
      var variables = {};
      parxer({
        plugins: [
          require('../Plugins').ContentItem,
          require('../Plugins').Content(function(fragment, next) {
            next(null);
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

});
