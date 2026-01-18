const mongoose = require('mongoose');
const Course = require('../models/Course');
// Cache to store ID mappings
let courseIdMap = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize/refresh the course ID mapping cache
 */
async function refreshCourseIdMap() {
  try {
    const courses = await Course.find({}, '_id title').lean();
    courseIdMap.clear();
    
    courses.forEach((course, index) => {
      // Map simple numbers to ObjectIds
      courseIdMap.set((index + 1).toString(), course._id.toString());
      courseIdMap.set(course._id.toString(), course._id.toString()); // Also map ObjectId to itself
    });
    
    lastCacheUpdate = Date.now();
    console.log(`📋 ID Mapping refreshed: ${courseIdMap.size} mappings loaded`);
    
    // Log mappings for debugging
    console.log('Available course mappings:');
    courses.forEach((course, index) => {
      console.log(`  ${index + 1} → ${course._id} (${course.title})`);
    });
    
  } catch (error) {
    console.error('❌ Error refreshing course ID map:', error);
    
    // Fallback: Use simple ID mapping when MongoDB is not available
    console.log('📋 Using fallback ID mapping');
    courseIdMap.clear();
    
    // Simple mapping for fallback courses (1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      courseIdMap.set(i.toString(), i.toString());
    }
    
    lastCacheUpdate = Date.now();
  }
}

/**
 * Get mapped ObjectId for a given ID
 */
function getMappedId(id) {
  // Check if cache needs refresh
  if (Date.now() - lastCacheUpdate > CACHE_DURATION) {
    // Refresh cache in background
    refreshCourseIdMap().catch(console.error);
  }
  
  return courseIdMap.get(id) || id;
}

/**
 * Middleware to map simple IDs to ObjectIds
 * @param {string|Array} paramNames - Parameter names to map
 */
const idMapper = (paramNames = 'id') => {
  const paramsToMap = Array.isArray(paramNames) ? paramNames : [paramNames];
  
  return async (req, res, next) => {
    try {
      // Ensure cache is initialized
      if (courseIdMap.size === 0) {
        await refreshCourseIdMap();
      }
      
      // Map each parameter
      for (const paramName of paramsToMap) {
        const originalValue = req.params[paramName];
        
        if (originalValue) {
          const mappedId = getMappedId(originalValue);
          
          if (mappedId !== originalValue) {
            console.log(`🔄 Mapped ${paramName}: "${originalValue}" → "${mappedId}"`);
          }
          
          // Validate the mapped ID is a valid ObjectId (skip in fallback mode)
          if (mappedId && mappedId.length === 24 && !mongoose.Types.ObjectId.isValid(mappedId)) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${paramName}: '${originalValue}' could not be mapped to a valid course`
            });
          }
          
          req.params[paramName] = mappedId;
        }
      }
      
      next();
    } catch (error) {
      console.error('Error in ID mapper middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during ID mapping'
      });
    }
  };
};

// Initialize cache on module load
refreshCourseIdMap().catch(console.error);

// Export functions
module.exports = idMapper;
module.exports.refreshCourseIdMap = refreshCourseIdMap;
module.exports.getMappedId = getMappedId;