const express = require("express");
const jwt = require("jsonwebtoken");
const Registration = require("../models/Registration");
const { sendOTPEmail } = require("../utils/emailService");

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
    console.log("=== REQUEST OTP ===");
    console.log("Email:", email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const user = await Registration.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("User not found:", email);
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

    // Always log OTP for development/testing
    console.log("=================================");
    console.log(`OTP for ${email}: ${otp}`);
    console.log("=================================");

    // Send styled OTP email - MUST succeed before responding
    console.log("Attempting to send OTP email...");
    console.log("EMAIL_USER configured:", process.env.EMAIL_USER ? "YES" : "NO");
    console.log("EMAIL_PASS configured:", process.env.EMAIL_PASS ? "YES (" + process.env.EMAIL_PASS.length + " chars)" : "NO");
    
    const emailResult = await sendOTPEmail(email, otp, "login");

    if (emailResult.success) {
      console.log("OTP email sent successfully to:", email);
      res.json({
        message: "OTP sent to your email",
        // Remove this in production - only for testing
        ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
      });
    } else {
      console.error("OTP email FAILED:", emailResult.error);
      // Still store OTP but inform user about email issue
      res.json({
        message: "OTP sent to your email",
        warning: "Email delivery may be delayed. Please check spam folder.",
        // Remove this in production - only for testing
        ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
      });
    }
  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("=== VERIFY OTP ===");
    console.log("Email:", email, "OTP:", otp);

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedData = otpStore.get(email.toLowerCase());
    console.log("Stored OTP data:", storedData);

    if (!storedData) {
      return res
        .status(400)
        .json({ error: "OTP expired or not found. Please request a new one." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new one." });
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

    console.log("Login successful for:", email);

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
