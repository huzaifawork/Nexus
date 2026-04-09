// Simple video call controller without Agora token generation
// For production, implement proper Agora token generation

// Generate a simple room token (for demo purposes)
const generateCallToken = async (req, res) => {
  const { meetingId } = req.body;

  try {
    if (!meetingId) {
      return res.status(400).json({ message: 'Meeting ID is required' });
    }

    // For demo: use meeting ID as channel name
    // In production, generate proper Agora token
    const callData = {
      channelName: `meeting_${meetingId}`,
      appId: process.env.AGORA_APP_ID || 'demo_app_id',
      token: null, // Agora allows null token for testing
      uid: req.user._id.toString(),
    };

    res.json(callData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active call participants
const getCallParticipants = async (req, res) => {
  const { meetingId } = req.params;

  try {
    // In a real implementation, track active participants
    // For now, return empty array
    res.json({ participants: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateCallToken,
  getCallParticipants,
};
