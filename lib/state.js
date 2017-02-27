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
      blocks: {},
      blockCloseTags: {},
      tagCount: 0,
      content: {},
      statistics: {},
      commonState: config.commonState || {}, // optional: shared between different requests
  };

  state.commonState.additionalHeaders = state.commonState.additionalHeaders || {};
  state.commonState.alreadyImported = state.commonState.alreadyImported || {};

  function closeTag(tagname) {
    return tagname + ':' + state.tagCount;
  }

  // Return a closure over private state
  return {
      setStatistic: function(type, key, data) {
        state.statistics[type] = state.statistics[type] || {};
        state.statistics[type][key] = data;
      },
      setOutput: function(data) {
        if(state.blocks['inside-fragment']) {
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
      setFragmentDefaultOutput: function(fragment) {
        state.output[fragment.outputIndex] = state.defaults[fragment.outputIndex] || '';
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
      closeTag: function(tagname) {
        return tagname + ':' + state.tagCount;
      },
      isBlock: function(type) {
        return state.blocks[type] ? state.blocks[type] : false;
      },
      setBlock: function(type, tagname) {
        state.blocks[type] = true;
        state.blockCloseTags[type] = state.blockCloseTags[type] || {};
        state.blockCloseTags[type][closeTag(tagname)] = true;
      },
      isBlockCloseTag: function(type, tagname) {
        return state.blockCloseTags[type] && state.blockCloseTags[type][closeTag(tagname)];
      },
      clearBlocksForClosingTag: function(tagname) {
        var tagKey = closeTag(tagname);
        _.mapValues(state.blockCloseTags, function(value, key) {
          if(value[tagKey]) {
            state.blocks[key] = false;
            delete state.blockCloseTags[key][tagKey];
          }
        });
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
      setContent: function(context) {
        state.content[context] = true;
      },
      getContent: function(context) {
        return !!state.content[context];
      },
      _raw: function() {
        return _.clone(state);
      },
      waitFor: function(config, firstPass, next) {
         var timeoutStart = Date.now(), timeout = config.parserTimeout || 5000;
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
               next({fragmentErrors: errors, statistics: _.clone(state.statistics)}, outputHTML);
               state = {}; // Clear for GC
            } else {
                if((Date.now() - timeoutStart) > timeout) {
                    var errorMsg = 'Timeout exceeded, failed to respond in <%= timeout %>ms.',
                        error = _.template(errorMsg)({timeout:timeout});
                    for (i = 0, len = state.fragmentOutput.length; i < len; i++) {
                        if(!state.fragmentOutput[i].done && state.fragmentOutput[i].attribs && state.fragmentOutput[i].attribs['cx-url']) {
                            error += '  Failed Fragment: ' + state.fragmentOutput[i].attribs['cx-url'];
                        }
                    }
                    next({statusCode: 500, statistics: _.clone(state.statistics), content: error});
                } else {
                   setImmediate(checkDone);
                }
            }
         }
         checkDone();
      },
      setAdditionalHeader: function (name, value) {
        state.commonState.additionalHeaders[name] = value;
      },
      getAdditionalHeader: function (name) {
        return state.commonState.additionalHeaders[name];
      },
      filterImported: function (type, libs) {
        return _.filter(libs, function (lib) {
          var key = type + ':' + lib;
          if (key in state.commonState.alreadyImported) {
            return false;
          }
          state.commonState.alreadyImported[key] = true;
          return true;
        });
      }
  };
}

module.exports = {
  create: create
}
