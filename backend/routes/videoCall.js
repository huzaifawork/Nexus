const express = require('express');
const router = express.Router();
const { generateCallToken, getCallParticipants } = require('../controllers/videoCallController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// POST /api/video-call/token - Generate call token
router.post('/token', generateCallToken);

// GET /api/video-call/:meetingId/participants - Get active participants
router.get('/:meetingId/participants', getCallParticipants);

module.exports = router;
