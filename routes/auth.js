const express = require("express");
const jwt = require("jsonwebtoken");
const Registration = require("../models/Registration");
const LoginLog = require("../models/LoginLog");
const { sendOTPEmail } = require("../services/emailService");

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Request OTP
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Registration.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res
        .status(404)
        .json({ error: "Email not registered. Please register first." });
    }

    if (user.status === "blocked") {
      return res
        .status(403)
        .json({ error: "Access denied. Please contact support." });
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// Verify OTP and login
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await Registration.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "Email not registered" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new one." });
    }

    // Clear OTP
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Log the login
    const loginLog = new LoginLog({
      email: user.email,
      userAgent: req.headers["user-agent"],
      browser: req.useragent?.browser || "Unknown",
      os: req.useragent?.os || "Unknown",
      device: req.useragent?.isMobile
        ? "Mobile"
        : req.useragent?.isTablet
          ? "Tablet"
          : "Desktop",
      ip: req.clientIp,
    });
    await loginLog.save();

    // Generate JWT
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Registration.findOne({ email: decoded.email }).select(
      "-otpCode -otpExpiry",
    );

    if (!user || user.status === "blocked") {
      return res.status(401).json({ error: "Access denied" });
    }

    res.json({ user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
