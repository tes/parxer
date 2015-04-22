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
      skipClosingTag: {},
      insideFragment: false,
      fragmentCloseTag: {},
      insideIfBlock: false,
      ifBlockCloseTag: {},
      skipBlock: false,
      skipBlockCloseTag: {},
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
      getTagCount: function() {
        return state.tagCount;
      },
      nextFragment: function() {
        state.fragmentIndex ++;
      },


      isInsideFragment: function() {
        return state.insideFragment;
      },
      setInsideFragment: function(tagname) {
        state.insideFragment = true;
        state.fragmentCloseTag[tagname + ':' + state.tagCount] = true;
      },
      clearInsideFragment: function(tagname) {
        state.insideFragment = false;
        delete state.fragmentCloseTag[tagname + ':' + state.tagCount];
      },
      isFragmentCloseTag: function(tagname) {
        return state.fragmentCloseTag[tagname + ':' + state.tagCount];
      },


      isInsideIfBlock: function() {
        return state.insideIfBlock;
      },
      setInsideIfBlock: function(tagname) {
        state.insideIfBlock = true;
        state.ifBlockCloseTag[tagname + ':' + state.tagCount] = true;
      },
      clearInsideIfBlock: function(tagname) {
        state.insideIfBlock = false;
        delete state.ifBlockCloseTag[tagname + ':' + state.tagCount];
      },
      isIfBlockCloseTag: function(tagname) {
        return state.ifBlockCloseTag[tagname + ':' + state.tagCount];
      },


      isSkipBlock: function() {
        return state.skipBlock;
      },
      setSkipBlock: function(tagname) {
        state.skipBlock = true;
        state.skipBlockCloseTag[tagname + ':' + state.tagCount] = true;
      },
      clearSkipBlock: function(tagname) {
        state.skipBlock = false;
        delete state.skipBlockCloseTag[tagname + ':' + state.tagCount];
      },
      isSkipBlockCloseTag: function(tagname) {
        return state.skipBlockCloseTag[tagname + ':' + state.tagCount];
      },



      isSkipClosingTag: function(tagname) {
        return state.skipClosingTag[tagname + ':' + state.tagCount];
      },
      setSkipClosingTag: function(tagname) {
        state.skipClosingTag[tagname + ':' + state.tagCount] = true;
      },
      clearSkipClosingTag: function(tagname) {
        delete state.skipClosingTag[tagname + ':' + state.tagCount];
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
                  if(state.output[i]) { outputHTML += _.clone(state.output[i]); }
               }
               state = {}; // Clear for GC
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
