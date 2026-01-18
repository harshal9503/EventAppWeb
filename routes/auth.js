const express = require("express");
const jwt = require("jsonwebtoken");
const Registration = require("../models/Registration");
const sendEmail = require("../utils/emailService");

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Request OTP
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

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

    // Send OTP email (non-blocking)
    const emailResult = await sendEmail({
      email: email,
      subject: "Your Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #333;">Login OTP</h2>
          <p>Your OTP for login is:</p>
          <h1 style="color: #007bff; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    // For development/testing - log OTP to console
    console.log(`OTP for ${email}: ${otp}`);

    // Check if email was sent (but don't fail if it wasn't)
    if (emailResult.success === false) {
      console.log("Email failed, but OTP generated:", otp);
      // Still return success - user can check console in dev
    }

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
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

    // OTP verified - clear it
    otpStore.delete(email.toLowerCase());

    // Get user
    const user = await Registration.findOne({ email: email.toLowerCase() });

    // Generate JWT
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        ticketType: user.ticketType,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
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
      "-__v",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
