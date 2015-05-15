'use strict';

var expect = require('expect.js');
var parxer = require('..').parxer;
var render = require('..').render;
var cheerio = require('cheerio');
var fs = require('fs');

describe("Core html parsing", function() {

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

  it('should leave br tags alone', function(done) {
      var input = '<br/>';
      parxer({}, input, function(err, data) {
        expect(data).to.be('<br/>');
        done();
      });
  });

  it('should close void tags to be consistent', function(done) {
      var input = '<br><meta title="hello">';
      parxer({}, input, function(err, data) {
        expect(data).to.be('<br/><meta title="hello"/>');
        done();
      });
  });

});


