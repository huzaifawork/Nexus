const express = require('express');
const router = express.Router();
const { getCollaborations, createCollaboration, updateCollaborationStatus } = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCollaborations);
router.post('/', protect, createCollaboration);
router.patch('/:id', protect, updateCollaborationStatus);

module.exports = router;
