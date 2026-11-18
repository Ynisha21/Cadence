const ApiError = require('../utils/ApiError');

/** validate(schema, 'body' | 'query'). Parsed query lands in req.valid.query. */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, 'Validation failed', details));
  }
  if (source === 'body') req.body = result.data;
  else req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};
