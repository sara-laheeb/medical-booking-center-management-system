'use strict';

const AppError = require('../errors/AppError');

/**
 * validate — runs a Joi schema against req.body, req.query, or req.params.
 */
const validate = (schema, source = 'body') => (req, res, next) => {

  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, '')
    }));

    return next(
      new AppError(
        'فشل التحقق من البيانات المرسلة',
        422,
        errors
      )
    );
  }

  // req.query is read-only in Express, so we cannot replace it directly.
  if (source === 'query') {
    Object.keys(req.query).forEach((key) => {
      delete req.query[key];
    });

    Object.assign(req.query, value);
  } else {
    req[source] = value;
  }

  next();
};

module.exports = validate;