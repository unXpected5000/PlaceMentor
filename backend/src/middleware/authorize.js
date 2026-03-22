const { HttpError } = require("../utils/httpError");

function authorize(...allowedRoles) {
  return function authorizeRole(req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have access to this resource"));
    }

    next();
  };
}

module.exports = { authorize };
