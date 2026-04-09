const crypto = require("crypto");

// Generate RTC token for Agora (simple token generation for testing)
// For production use: npm install agora-token
const generateCallToken = async (req, res) => {
  const { meetingId } = req.body;

  try {
    if (!meetingId) {
      return res.status(400).json({ message: "Meeting ID is required" });
    }

    const appId = process.env.AGORA_APP_ID;
    if (!appId) {
      return res.status(500).json({ message: "Agora App ID not configured" });
    }

    const channelName = `meeting_${meetingId}`;
    const uid = req.user._id.toString();

    // For testing/demo: Generate a basic token
    // In production, use: npm install agora-access-token and proper token generation
    const token = generateDemoToken(appId, channelName, uid);

    res.json({
      channelName,
      appId,
      token,
      uid,
      message: "Token generated successfully",
    });
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate a demo token (for testing without app certificate)
// IMPORTANT: This is for development only. Use proper token generation for production.
const generateDemoToken = (appId, channelName, uid) => {
  // Try to use proper token builder if certificate is available
  if (
    process.env.AGORA_APP_CERTIFICATE &&
    process.env.AGORA_APP_CERTIFICATE !== "your_certificate_here"
  ) {
    try {
      const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

      const expirationTimeInSeconds = 3600;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        process.env.AGORA_APP_CERTIFICATE,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs,
      );

      return token;
    } catch (error) {
      console.log("Token builder error:", error.message);
    }
  }

  // Fallback: Generate a test token using crypto (for development without certificate)
  // This creates a simple base64-encoded token for testing
  // In production, always use agora-access-token with a certificate
  const tokenData = {
    appId: appId,
    channelName: channelName,
    uid: uid.toString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const tokenString = Buffer.from(JSON.stringify(tokenData)).toString("base64");
  console.log("⚠️  Using development token - no certificate configured");
  return tokenString;
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
