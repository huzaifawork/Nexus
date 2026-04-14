// Mock Email Service - For Development/Testing
// Stores OTP codes in memory instead of sending emails

let mockEmailLog = [];

const mockEmailService = {
  // Store OTP in memory for testing
  sendMockOTP: async (email, otp) => {
    const record = {
      email,
      otp,
      timestamp: new Date(),
      code: otp,
    };
    mockEmailLog.push(record);

    // Keep only last 50 emails in memory
    if (mockEmailLog.length > 50) {
      mockEmailLog.shift();
    }

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║        🔐 MOCK EMAIL SERVICE          ║");
    console.log("╚════════════════════════════════════════╝");
    console.log(`📧 To: ${email}`);
    console.log(`📝 Subject: Nexus 2FA OTP Code`);
    console.log(`\n🔐 YOUR OTP CODE: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log(`📌 Timestamp: ${record.timestamp.toLocaleString()}`);
    console.log("════════════════════════════════════════\n");

    return true;
  },

  // Get all mock emails (for testing dashboard)
  getMockEmails: () => {
    return mockEmailLog;
  },

  // Get latest OTP for email
  getLatestOTP: (email) => {
    const emails = mockEmailLog.filter((e) => e.email === email);
    if (emails.length === 0) return null;
    return emails[emails.length - 1].code;
  },

  // Clear mock logs
  clearMockEmails: () => {
    mockEmailLog = [];
    console.log("✅ Mock email log cleared");
  },
};

module.exports = mockEmailService;
