const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending',
  },
  meetingLink: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  collaborationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collaboration',
  },
}, { timestamps: true });

// Index for faster queries
MeetingSchema.index({ organizerId: 1, startTime: 1 });
MeetingSchema.index({ participantId: 1, startTime: 1 });

// Validate that endTime is after startTime
MeetingSchema.pre('save', function() {
  if (this.endTime <= this.startTime) {
    throw new Error('End time must be after start time');
  }
});

module.exports = mongoose.model('Meeting', MeetingSchema);
