'use strict';

module.exports = {
  getAttr: function getAttr(attr, attrs) {
    if (!attrs) {
      return null;
    }

    if (attr in attrs) {
      return attr;
    }

    if ('data-' + attr in attrs) {
      return 'data-' + attr;
    }

    return null;
  }
};
