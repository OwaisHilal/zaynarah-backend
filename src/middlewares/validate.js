// src/middlewares/validate.js
module.exports = (schemaObj) => (req, res, next) => {
  try {
    let bodySchema = schemaObj.body || schemaObj;
    let paramsSchema = schemaObj.params;
    let querySchema = schemaObj.query;

    if (bodySchema?.parse) {
      req.validatedBody = bodySchema.parse(req.body);
    }

    if (paramsSchema?.parse) {
      req.validatedParams = paramsSchema.parse(req.params);
    }

    if (querySchema?.parse) {
      req.validatedQuery = querySchema.parse(req.query);
    }

    next();
  } catch (err) {
    return res.status(400).json({
      message: err.errors?.[0]?.message || 'Invalid input',
    });
  }
};
