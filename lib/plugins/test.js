var Core = require('../core');

function match(tagname, attribs, config, state) {
    if(attribs && attribs[config.prefix + 'test']) {
      state.setOutput(Core.createTag(tagname, attribs));
      state.setOutput(Core.render(attribs['cx-test'], config.variables));
      return true;
    }
}

module.exports = {
  name:'test',
  match: match
};
