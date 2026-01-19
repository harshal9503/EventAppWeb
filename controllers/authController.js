// Auth logic is handled in routes/auth.js
// This file exports email utilities for use elsewhere

const { sendEmail, sendOTPEmail } = require("../utils/emailService");

module.exports = {
  sendEmail,
  sendOTPEmail,
};
