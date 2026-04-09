const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Helper function to check for scheduling conflicts
const checkConflict = async (userId, startTime, endTime, excludeMeetingId = null) => {
  const query = {
    $or: [
      { organizerId: userId },
      { participantId: userId }
    ],
    status: { $in: ['pending', 'accepted'] }, // Only check non-cancelled/rejected meetings
    $or: [
      // New meeting starts during existing meeting
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New meeting ends during existing meeting
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New meeting completely contains existing meeting
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
    ]
  };

  // Exclude current meeting when updating
  if (excludeMeetingId) {
    query._id = { $ne: excludeMeetingId };
  }

  const conflicts = await Meeting.find(query);
  return conflicts.length > 0 ? conflicts : null;
};

// GET /api/meetings - Get all meetings for logged-in user
const getMeetings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const query = {
      $or: [
        { organizerId: req.user._id },
        { participantId: req.user._id }
      ]
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const meetings = await Meeting.find(query)
      .populate('organizerId', 'name email avatarUrl role')
      .populate('participantId', 'name email avatarUrl role')
      .sort({ startTime: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/meetings/:id - Get single meeting by ID
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizerId', 'name email avatarUrl role')
      .populate('participantId', 'name email avatarUrl role');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is part of this meeting
    if (
      meeting.organizerId._id.toString() !== req.user._id.toString() &&
      meeting.participantId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this meeting' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/meetings - Create new meeting
const createMeeting = async (req, res) => {
  const { title, description, participantId, startTime, endTime, meetingLink, location, notes, collaborationId } = req.body;

  try {
    // Validate required fields
    if (!title || !participantId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, participant, start time, and end time are required' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Cannot schedule meetings in the past' });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Cannot schedule meeting with yourself
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot schedule a meeting with yourself' });
    }

    // Check for conflicts for organizer
    const organizerConflicts = await checkConflict(req.user._id, start, end);
    if (organizerConflicts) {
      return res.status(409).json({ 
        message: 'You have a scheduling conflict',
        conflicts: organizerConflicts 
      });
    }

    // Check for conflicts for participant
    const participantConflicts = await checkConflict(participantId, start, end);
    if (participantConflicts) {
      return res.status(409).json({ 
        message: `${participant.name} has a scheduling conflict`,
        conflicts: participantConflicts 
      });
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      description,
      organizerId: req.user._id,
      participantId,
      startTime: start,
      endTime: end,
      meetingLink,
      location,
      notes,
      collaborationId,
    });

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizerId', 'name email avatarUrl role')
      .populate('participantId', 'name email avatarUrl role');

    res.status(201).json(populatedMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/meetings/:id - Update meeting
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only organizer can update meeting details
    if (meeting.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can update meeting details' });
    }

    const { title, description, startTime, endTime, meetingLink, location, notes } = req.body;

    // If updating time, check for conflicts
    if (startTime || endTime) {
      const newStart = startTime ? new Date(startTime) : meeting.startTime;
      const newEnd = endTime ? new Date(endTime) : meeting.endTime;

      if (newEnd <= newStart) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }

      // Check conflicts for both users
      const organizerConflicts = await checkConflict(meeting.organizerId, newStart, newEnd, meeting._id);
      if (organizerConflicts) {
        return res.status(409).json({ 
          message: 'Scheduling conflict detected',
          conflicts: organizerConflicts 
        });
      }

      const participantConflicts = await checkConflict(meeting.participantId, newStart, newEnd, meeting._id);
      if (participantConflicts) {
        return res.status(409).json({ 
          message: 'Participant has a scheduling conflict',
          conflicts: participantConflicts 
        });
      }

      meeting.startTime = newStart;
      meeting.endTime = newEnd;
    }

    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
    if (location !== undefined) meeting.location = location;
    if (notes !== undefined) meeting.notes = notes;

    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizerId', 'name email avatarUrl role')
      .populate('participantId', 'name email avatarUrl role');

    res.json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/meetings/:id/status - Accept/Reject/Cancel meeting
const updateMeetingStatus = async (req, res) => {
  const { status } = req.body;

  try {
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be accepted, rejected, or cancelled' });
    }

    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Participant can accept/reject, organizer can cancel
    const isParticipant = meeting.participantId.toString() === req.user._id.toString();
    const isOrganizer = meeting.organizerId.toString() === req.user._id.toString();

    if (!isParticipant && !isOrganizer) {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }

    // Only participant can accept/reject
    if ((status === 'accepted' || status === 'rejected') && !isParticipant) {
      return res.status(403).json({ message: 'Only the participant can accept or reject the meeting' });
    }

    // Both can cancel
    if (status === 'cancelled' && !isParticipant && !isOrganizer) {
      return res.status(403).json({ message: 'Not authorized to cancel this meeting' });
    }

    meeting.status = status;
    await meeting.save();

    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate('organizerId', 'name email avatarUrl role')
      .populate('participantId', 'name email avatarUrl role');

    res.json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/meetings/:id - Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only organizer can delete
    if (meeting.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the organizer can delete the meeting' });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
  deleteMeeting,
};
