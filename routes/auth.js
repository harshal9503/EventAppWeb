const express = require("express");
const jwt = require("jsonwebtoken");
const Registration = require("../models/Registration");
const sendEmail = require("../utils/emailService");

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs temporarily
const otpStore = new Map();

// Request OTP
router.post("/request-otp", async (req, res) => {
  try {
    console.log("=== REQUEST OTP ===");
    const { email } = req.body;
    console.log("Email:", email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await Registration.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "Email not registered" });
    }

    // Check if user is blocked
    if (user.status === "blocked") {
      return res.status(403).json({ error: "Account is blocked" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Log OTP to console (visible in Render logs)
    console.log("========================================");
    console.log(`OTP for ${email}: ${otp}`);
    console.log("========================================");

    // Try to send email (non-blocking)
    sendEmail({
      email: email,
      subject: "Your Login OTP",
      html: `<div style="font-family: Arial; padding: 20px;">
        <h2>Login OTP</h2>
        <p>Your OTP is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p>Valid for 10 minutes.</p>
      </div>`,
    }).catch((err) => console.log("Email failed:", err.message));

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    console.log("=== VERIFY OTP ===");
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ error: "OTP expired or not found" });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: "OTP expired" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(email.toLowerCase());

    const user = await Registration.findOne({ email: email.toLowerCase() });

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, ticketType: user.ticketType },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Registration.findOne({ email: decoded.email }).select("-__v");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
