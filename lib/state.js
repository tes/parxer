var _ = require('lodash');

function create(config) {

  var state = {
      output: [''],
      outputIndex: 0,
      fragmentIndex: 0,
      fragmentOutput: [],
      deferredStack: [],
      nextTextDefault: false,
      skipClosingTag: false
  };

  // Return a closure over private state
  return {
      setCurrentOutput: function(data) {
        state.output[state.outputIndex] += data;
      },
      setPreviousOutput: function(data) {
        if(state.output[state.outputIndex-1]) { state.output[state.outputIndex-1] += data; }
      },
      nextOutput: function() {
        state.outputIndex ++;
        state.output[state.outputIndex] = '';
      },
      createFragmentOutput: function(tagname, attribs, deferred) {
        state.fragmentOutput[state.fragmentIndex] = {};
        state.fragmentOutput[state.fragmentIndex].attribs = _.clone(attribs);
        state.fragmentOutput[state.fragmentIndex].tagname = tagname;
        state.fragmentOutput[state.fragmentIndex].outputIndex = state.outputIndex;
        state.fragmentOutput[state.fragmentIndex].fragmentIndex = state.fragmentIndex;
        state.fragmentOutput[state.fragmentIndex].deferred = deferred ? true : false;
      },
      getCurrentFragment: function() {
        return state.fragmentOutput[state.fragmentIndex];
      },
      setFragmentOutput: function(fragment, response) {
        state.output[fragment.outputIndex] = response;
      },
      setFragmentDone: function(fragment) {
        state.fragmentOutput[fragment.fragmentIndex].done = true;
      },
      setFragmentError: function(fragment, error) {
        state.fragmentOutput[fragment.fragmentIndex].done = true;
        state.fragmentOutput[fragment.fragmentIndex].error = error;
      },
      setFragmentErrorOutput: function(fragment, message) {
        if(config.showErrors) {
          state.output[fragment.outputIndex] = message
        } else {
          if(state.output[fragment.outputIndex] == '_processing_') {
            state.output[fragment.outputIndex] = '';
          }
        }
      },
      nextFragment: function() {
        state.fragmentIndex ++;
      },
      isNextTextDefault: function() {
        return state.nextTextDefault;
      },
      setNextTextDefault: function(value) {
        state.nextTextDefault = value;
      },
      setDefaultOutput: function(data) {
        if(data && state.output[state.outputIndex-1] == '_processing_') { state.output[state.outputIndex-1] = data; }
        state.nextTextDefault = false;
      },
      isSkipClosingTag: function() {
        return state.skipClosingTag;
      },
      setSkipClosingTag: function(skip) {
        state.skipClosingTag = skip;
      },
      getDeferredStack: function() {
        return state.deferredStack;
      },
      defer: function(item) {
        state.deferredStack.push(item);
      },
      _raw: function() {
        return _.clone(state);
      },
      waitFor: function(config, firstPass, next) {
         var timeoutStart = Date.now(), timeout = config.timeout || 5000;
         function checkDone() {
            var done = true, outputHTML = '', i, len, errors;
            for (i = 0, len = state.fragmentOutput.length; i < len; i++) {
                done = done && (state.fragmentOutput[i].done || firstPass && state.fragmentOutput[i].deferred);
            }
            if(done && firstPass) {
               next();
            } else if(done && !firstPass) {
               // Collect any errors
               for (i = 0, len = state.fragmentOutput.length; i < len; i++) {
                  if(state.fragmentOutput[i].error) {
                    errors = errors || [];
                    errors.push(state.fragmentOutput[i].error);
                  }
               }
               // Collect any content
               for (i = 0, len = state.output.length; i < len; i++) {
                  outputHTML += state.output[i];
               }
               next(errors, outputHTML);
            } else {
                if((Date.now() - timeoutStart) > timeout) {
                    var errorMsg = 'Timeout exceeded, failed to respond in <%= timeout %>ms.';
                    for (i = 0, len = state.fragmentOutput.length; i < len; i++) {
                        if(!state.fragmentOutput[i].done) {
                            errorMsg += '  Attribs: ' + JSON.stringify(state.fragmentOutput[i].attribs);
                        }
                    }
                    next(_.template(errorMsg)({timeout:timeout}));
                } else {
                   setImmediate(checkDone);
                }
            }
         }
         checkDone();
      }
  };

}

module.exports = {
  create: create
}
