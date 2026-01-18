const mongoose = require('mongoose');

/**
 * Middleware to validate ObjectId parameters
 * @param {string|Array} paramNames - Parameter names to validate (default: 'id')
 */
const validateObjectId = (paramNames = 'id') => {
  // Convert single param name to array
  const paramsToValidate = Array.isArray(paramNames) ? paramNames : [paramNames];
  
  return (req, res, next) => {
    try {
      for (const paramName of paramsToValidate) {
        const paramValue = req.params[paramName];
        
        if (paramValue && !mongoose.Types.ObjectId.isValid(paramValue)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${paramName}: '${paramValue}' is not a valid ObjectId`
          });
        }
      }
      
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ObjectId format'
      });
    }
  };
};

module.exports = validateObjectId;