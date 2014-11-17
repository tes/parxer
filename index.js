var htmlparser = require('htmlparser2');
var Core = require('./lib/core');
var State = require('./lib/state');
var _ = require('lodash');

var parxer = function(config, input, next) {

    // Defaults
    config.prefix = config.prefix || 'cx-';

    var state = State.create(config);

    var parser = new htmlparser.Parser({
        onopentag: function(tagname, attribs) {
            var matched = !_.isEmpty(attribs) && Core.matchPlugin(config.plugins, tagname, attribs, config, state);
            if(!matched) {
                state.setCurrentOutput(Core.createTag(tagname, attribs));
            }
        },
        onprocessinginstruction: function(name, data) {
            state.setCurrentOutput('<' + data + '>');
        },
        ontext:function(data) {
            if(state.isNextTextDefault()) {
                state.setDefaultOutput(data);
            } else {
                state.setCurrentOutput(data);
            }
        },
        oncomment: function(data) {
            state.setCurrentOutput('<!--' + data);
        },
        oncommentend: function() {
            state.setCurrentOutput('-->');
        },
        onclosetag: function(tagname){
            if(state.isNextTextDefault()) { state.setNextTextDefault(false); }
            if(state.isSkipClosingTag()) { return state.setSkipClosingTag(false); }
            state.setCurrentOutput('</' + tagname + '>');
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

