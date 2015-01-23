var _ = require('lodash');

function create(config) {

  var state = {
      output: [''],
      outputIndex: 0,
      fragmentIndex: 0,
      fragmentOutput: [],
      defaults: [],
      deferredStack: [],
      nextTextDefault: false,
      skipClosingTag: false,
      tagCount: 0
  };

  // Return a closure over private state
  return {
      setOutput: function(data) {
        if(state.insideFragment) {
          state.defaults[state.outputIndex - 1] = state.defaults[state.outputIndex - 1] || '';
          state.defaults[state.outputIndex - 1] += data;
        } else {
          state.output[state.outputIndex] += data;
        }
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
          state.output[fragment.outputIndex] = state.defaults[fragment.outputIndex] || '';
        }
      },
      incrementTagCounter: function() {
        state.tagCount = state.tagCount + 1;
      },
      decrementTagCounter: function() {
        state.tagCount = state.tagCount - 1;
      },
      nextFragment: function() {
        state.fragmentIndex ++;
      },
      isMatchedClosingTag: function() {
        return state.tagCount === 0;
      },
      isInsideFragment: function() {
        return state.insideFragment;
      },
      setInsideFragment: function(value) {
        state.insideFragment = value;
        state.tagCount = 0;
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
                  if(state.output[i]) { outputHTML += state.output[i]; }
               }
               next({fragmentErrors: errors}, outputHTML);
            } else {
                if((Date.now() - timeoutStart) > timeout) {
                    var errorMsg = 'Timeout exceeded, failed to respond in <%= timeout %>ms.',
                        error = _.template(errorMsg)({timeout:timeout});
                    for (i = 0, len = state.fragmentOutput.length; i < len; i++) {
                        if(!state.fragmentOutput[i].done) {
                            errorMsg += '  Attribs: ' + JSON.stringify(state.fragmentOutput[i].attribs);
                        }
                    }
                    next({statusCode: 500, content: error});
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
