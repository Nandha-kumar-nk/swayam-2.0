const express = require('express');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user's progress for all courses
// @route   GET /api/progress
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const progresses = await Progress.find({ userId: req.user.id })
      .populate('courseId', 'title thumbnail difficulty duration')
      .sort({ lastAccessedAt: -1 });

    res.status(200).json({
      success: true,
      data: progresses
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get progress for specific course
// @route   GET /api/progress/:courseId
// @access  Private
router.get('/:courseId', protect, async (req, res, next) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user.id,
      courseId: req.params.courseId
    }).populate('courseId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update course progress
// @route   POST /api/progress/:courseId
// @access  Private
router.post('/:courseId', protect, async (req, res, next) => {
  try {
    const { weekNumber, timeSpent } = req.body;

    const progress = await Progress.findOne({
      userId: req.user.id,
      courseId: req.params.courseId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    await progress.completeWeek(weekNumber, timeSpent);

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;