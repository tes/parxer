'use strict';

var expect = require('expect.js');
var attr = require('../lib/attr');

describe("attr", function () {
    describe('getAttrStartingWith', function () {
        it('should get url attribute names', function () {
            var attrs = attr.getAttrStartingWith('cx-url', {
              a: true,
              'cx-url': true,
              'data-cx-url' : true,
              'cx-url-1': true,
              'data-cx-url-2': true
            });
            expect(attrs).to.eql(['cx-url', 'data-cx-url', 'cx-url-1', 'data-cx-url-2']);
        });
    });
    describe('getSuffixes', function () {
        it('should get all suffixes', function () {
            var suffixes = attr.getSuffixes(['cx-url', 'data-cx-url', 'cx-url-1', 'data-cx-url-2'], 'cx-url');
            expect(suffixes).to.eql(['', '-1', '-2']);
        });
    });
});