const express = require('express');
const router = express.Router();
const {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
  deleteMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// All routes require authentication
router.use(protect);

// GET /api/meetings - Get all meetings for logged-in user
router.get('/', getMeetings);

// GET /api/meetings/:id - Get single meeting
router.get('/:id', getMeetingById);

// POST /api/meetings - Create new meeting
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('participantId').notEmpty().withMessage('Participant is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
  ],
  createMeeting
);

// PUT /api/meetings/:id - Update meeting
router.put('/:id', updateMeeting);

// PATCH /api/meetings/:id/status - Accept/Reject/Cancel meeting
router.patch('/:id/status', updateMeetingStatus);

// DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', deleteMeeting);

module.exports = router;
