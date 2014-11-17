var htmlparser = require('htmlparser2');
var Core = require('./lib/core');
var State = require('./lib/state');

var parxer = function(config, input, next) {

    var state = State.create();

    // Defaults
    config.prefix = config.prefix || 'cx-';

    var parser = new htmlparser.Parser({
        onopentag: function(tagname, attribs) {
            var matched = Core.matchPlugin(config.plugins, tagname, attribs, config, state);
            if(!matched) {
                state.setCurrentOutput(Core.createTag(tagname, attribs));
            }

        },
        onprocessinginstruction: function(name, data) {
            state.setCurrentOutput('<' + data + '>');
        },
        ontext:function(data) {
            if(state.isNextTextDefault()) {
                state.setNextTextDefault();
            } else {
                state.setCurrentOutput(data);
            }
        },
        oncomment: function(data) {
            state.setCurrentOutput('<!-- ' + data);
        },
        oncommentend: function() {
            state.setCurrentOutput(' -->');
        },
        onclosetag: function(tagname){
            if(state.isNextTextDefault()) { state.setNextTextDefault(); }
            if(state.isSkipClosingTag()) { return state.setSkipClosingTag(false); }
            state.setCurrentOutput('</' + tagname + '>');
        },
        onend: function() {
             var timeout = config.backend && config.backend.timeout || '5000';
             state.waitFor(timeout, true, function(err) {
                if(err) { return next(err); }
                Core.processDeferredStack(config, state, function(err) {
                    state.waitFor(timeout, false, function(err, content) {
                        if(err) { return next(err); }
                        next(null, content);
                    });
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

