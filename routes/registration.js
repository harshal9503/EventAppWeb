const express = require("express");
const { body, validationResult } = require("express-validator");
const Registration = require("../models/Registration");
const { sendConfirmationEmail } = require("../services/emailService");

const router = express.Router();

const validationRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone")
    .matches(/^[\d\s\-+()]{10,}$/)
    .withMessage("Valid phone number is required"),
  body("gender")
    .isIn(["male", "female", "other", "prefer-not-to-say"])
    .withMessage("Gender is required"),
  body("ticketType")
    .isIn(["standard", "vip", "premium", "student"])
    .withMessage("Ticket type is required"),
];

router.post("/", validationRules, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, gender, ticketType } = req.body;

    // Check if already registered
    const existing = await Registration.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create registration
    const registration = new Registration({
      name,
      email,
      phone,
      gender,
      ticketType,
      registrationSource: req.body.source || "web",
    });

    await registration.save();

    // Send confirmation email (fire and forget - don't await)
    const portalLink = `${process.env.FRONTEND_URL}/portal?email=${encodeURIComponent(email)}`;
    sendConfirmationEmail(email, name, portalLink).catch((err) => {
      console.error("Email failed (non-blocking):", err.message);
    });

    res.status(201).json({
      message: "Registration successful! Check your email for portal access.",
      data: { name, email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

module.exports = router;
