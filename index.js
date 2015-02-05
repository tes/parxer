var htmlparser = require('htmlparser2');
var Core = require('./lib/core');
var State = require('./lib/state');
var voidElements = require('./lib/void');
var _ = require('lodash');

var parxer = function(config, input, next) {

    // Defaults
    config.prefix = config.prefix || 'cx-';

    var state = State.create(config);

    var parser = new htmlparser.Parser({
        onopentag: function(tagname, attribs) {
            var selfClosing = false;
            if(voidElements[tagname]) {
                selfClosing = true;
                state.setSkipClosingTag(true);
            }
            if(state.isInsideFragment()) {
                state.incrementTagCounter();
                state.setOutput(Core.createTag(tagname, attribs));
            } else {
                var matched = !_.isEmpty(attribs) && Core.matchPlugin(config.plugins, tagname, attribs, config, state);
                if(!matched) {
                    state.setOutput(Core.createTag(tagname, attribs, selfClosing));
                }
            }
        },
        onprocessinginstruction: function(name, data) {
            state.setOutput('<' + data + '>');
        },
        ontext:function(data) {
            state.setOutput(data);
        },
        oncomment: function(data) {
            state.setOutput('<!--' + data);
        },
        oncommentend: function() {
            state.setOutput('-->');
        },
        onclosetag: function(tagname){
            if(state.isMatchedClosingTag()) {
                if(state.isInsideFragment()) { state.setInsideFragment(false); }
                if(state.isSkipClosingTag()) { return state.setSkipClosingTag(false); }
                state.setOutput('</' + tagname + '>');
            } else {
                if(state.isInsideFragment()) {
                    state.decrementTagCounter();
                }
                state.setOutput('</' + tagname + '>');
            }
        },
        onend: function() {
             state.waitFor(config, true, function(err) {
                if(err) { return next(err); }
                Core.processDeferredStack(config, state, function() {
                    state.waitFor(config, false, next);
                });
             });
        },
        recognizeSelfClosing: true
    });

    parser.end(input);

};

module.exports = {
    parxer: parxer,
    render: Core.render
};

