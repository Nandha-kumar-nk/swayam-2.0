const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get reminder settings
// @route   GET /api/reminders/settings
// @access  Private
router.get('/settings', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('reminderSettings');
    
    res.status(200).json({
      success: true,
      data: user.reminderSettings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update reminder settings
// @route   PUT /api/reminders/settings
// @access  Private
router.put('/settings', protect, async (req, res, next) => {
  try {
    const { email, intervals } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        reminderSettings: {
          email: email !== undefined ? email : req.user.reminderSettings.email,
          intervals: intervals || req.user.reminderSettings.intervals
        }
      },
      { new: true, runValidators: true }
    ).select('reminderSettings');

    res.status(200).json({
      success: true,
      message: 'Reminder settings updated successfully',
      data: user.reminderSettings
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;