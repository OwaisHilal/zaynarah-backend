// src/middlewares/validate.js
module.exports = (schemaObj) => (req, res, next) => {
  try {
    if (schemaObj.body) {
      req.validatedBody = schemaObj.body.parse(req.body);
    }

    if (schemaObj.params) {
      req.validatedParams = schemaObj.params.parse(req.params);
    }

    if (schemaObj.query) {
      req.validatedQuery = schemaObj.query.parse(req.query);
    }

    next();
  } catch (err) {
    return res.status(400).json({
      message: err.errors?.[0]?.message || 'Invalid input',
    });
  }
};
