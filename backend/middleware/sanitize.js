const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

// Apply sanitization middleware
const sanitizeInputs = [
  // Sanitize data against NoSQL injection
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.log(`Potential NoSQL injection attempt on ${key}`);
    },
  }),
  // Sanitize data against XSS
  xss(),
];

// Manual sanitization function for custom validation
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potential HTML/script tags
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 500); // Limit length
};

const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  
  return email
    .toLowerCase()
    .trim()
    .substring(0, 255);
};

const validateAndSanitize = (data) => {
  return {
    name: sanitizeString(data.name),
    email: sanitizeEmail(data.email),
    password: data.password, // Never sanitize password, just validate
  };
};

module.exports = {
  sanitizeInputs,
  sanitizeString,
  sanitizeEmail,
  validateAndSanitize,
};
