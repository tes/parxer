var Core = require('../core');

function match(tagname, attribs, config, state) {
    if(attribs && attribs[config.prefix + 'test']) {
      state.setCurrentOutput(Core.createTag(tagname, attribs));
      state.setCurrentOutput(Core.render(attribs['cx-test'], config.variables));
      return true;
    } else {
      return false;
    }
}

module.exports = {
  name:'test',
  match: match
};
