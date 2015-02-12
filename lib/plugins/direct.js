var Core = require('../core');

function match(tagname, attribs, config) {
    if(attribs && attribs[config.prefix + 'direct']) {
      return Core.render(attribs['cx-direct'], config.variables);
    }
}

module.exports = {
  name:'direct',
  match: match
};
