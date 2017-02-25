var htmlparser = require('htmlparser2');
var Core = require('./lib/core');
var State = require('./lib/state');
var voidElements = require('./lib/void');
var _ = require('lodash');

var parxer = function(config, input, next) {

    // Defaults
    config.prefix = config.prefix || 'cx-';
    config.rawSuffix = config.rawSuffix || '-raw';

    var state = State.create(config);

    var parser = new htmlparser.Parser({
        onopentag: function(tagname, attribs) {

            state.incrementTagCounter();

            var selfClosing = false;

            if(voidElements[tagname]) {
                selfClosing = true;
                state.setSkipClosingTag(tagname);
            }

            if(state.isBlock('if-false')) {
                state.setSkipClosingTag(tagname);
                return;
            }

            if(state.isBlock('inside-fragment')) {
                state.setOutput(Core.createTag(tagname, attribs, selfClosing));
                return;
            }

            var matched = !_.isEmpty(attribs) && Core.matchPlugin(config.plugins, tagname, attribs, config, state);
            if(!matched) {
                state.setOutput(Core.createTag(tagname, attribs, selfClosing));
            }

        },
        onprocessinginstruction: function(name, data) {
            if(state.isBlock('if-false')) { return; }
            state.setOutput('<' + data + '>');
        },
        ontext:function(data) {
            if(state.isBlock('if-false')) { return; }
            state.setOutput(data);
        },
        oncomment: function(data) {
            if(state.isBlock('if-false')) { return; }
            state.setOutput('<!--' + data);
        },
        oncommentend: function() {
            if(state.isBlock('if-false')) { return; }
            state.setOutput('-->');
        },
        onclosetag: function(tagname) {

            var writeEndTag = true;
            if(state.isBlockCloseTag('if-false', tagname) || state.isSkipClosingTag(tagname)) {
                writeEndTag = false;
            }

            state.clearSkipClosingTag(tagname);
            state.clearBlocksForClosingTag(tagname);
            state.decrementTagCounter();

            if(writeEndTag) {
                state.setOutput('</' + tagname + '>');
            }

        },
        onend: function() {

             state.waitFor(config, true, function(err) {
                if(err) { return next(err); }
                Core.processDeferredStack(config, state, function() {
                    state.waitFor(config, false, function (err, content) {
                      var clonedState = state._raw();
                      return next(err, clonedState.fragmentIndex, content);
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
