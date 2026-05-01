const sanitizeHtml = require('sanitize-html');

const sanitizeText = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      accumulator[key] = sanitizeObject(nestedValue);
      return accumulator;
    }, {});
  }

  return sanitizeText(value);
};

module.exports = {
  sanitizeObject,
  sanitizeText,
};
