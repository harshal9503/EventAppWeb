const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const Registration = require("../models/Registration");
const LoginLog = require("../models/LoginLog");
const ContentConfig = require("../models/ContentConfig");
const { authenticateAdmin } = require("../middleware/auth");

const router = express.Router();

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin login attempt:", email);

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      message: "Login successful",
      token,
      admin: { name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Create admin (protected - use this once to create initial admin)
router.post("/create", async (req, res) => {
  try {
    const { email, password, name, secretKey } = req.body;

    // Simple protection for creating admins
    if (secretKey !== process.env.JWT_ADMIN_SECRET) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const admin = new Admin({ email, password, name });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create admin" });
  }
});

// Get all registrations
router.get("/registrations", authenticateAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Update user status
router.patch(
  "/registrations/:id/status",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["registered", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true },
      ).select("-otpCode -otpExpiry");

      if (!registration) {
        return res.status(404).json({ error: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  },
);

// Get login logs
router.get("/login-logs", authenticateAdmin, async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.email = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    const total = await LoginLog.countDocuments(query);
    const logs = await LoginLog.find(query)
      .sort({ loginTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch login logs" });
  }
});

// Export login logs
router.get("/login-logs/export", authenticateAdmin, async (req, res) => {
  try {
    const logs = await LoginLog.find({}).sort({ loginTime: -1 });

    const csv = [
      ["Email", "Login Time", "Browser", "OS", "Device", "IP"].join(","),
      ...logs.map((l) =>
        [
          l.email,
          l.loginTime.toISOString(),
          l.browser,
          l.os,
          l.device,
          l.ip || "N/A",
        ].join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=login-logs.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
});

// Get login stats
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const totalRegistrations = await Registration.countDocuments();
    const totalLogins = await LoginLog.countDocuments();
    const uniqueLogins = await LoginLog.distinct("email").then(
      (arr) => arr.length,
    );
    const blockedUsers = await Registration.countDocuments({
      status: "blocked",
    });

    // Logins by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const loginsByDay = await LoginLog.aggregate([
      { $match: { loginTime: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loginTime" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Registrations by ticket type
    const byTicketType = await Registration.aggregate([
      { $group: { _id: "$ticketType", count: { $sum: 1 } } },
    ]);

    res.json({
      totalRegistrations,
      totalLogins,
      uniqueLogins,
      blockedUsers,
      loginsByDay,
      byTicketType,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Update content URLs
router.put("/content-config", authenticateAdmin, async (req, res) => {
  try {
    const { videos, pdf, feedback } = req.body;

    const updates = [
      { key: "videos", url: videos },
      { key: "pdf", url: pdf },
      { key: "feedback", url: feedback },
    ].filter((item) => item.url);

    for (const update of updates) {
      await ContentConfig.findOneAndUpdate(
        { key: update.key },
        { ...update, updatedBy: req.admin.email },
        { upsert: true },
      );
    }

    res.json({ message: "Content URLs updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update content URLs" });
  }
});

// Get content config
router.get("/content-config", authenticateAdmin, async (req, res) => {
  try {
    const configs = await ContentConfig.find({});
    const result = {
      videos: process.env.VIDEOS_URL,
      pdf: process.env.PDF_URL,
      feedback: process.env.FEEDBACK_URL,
    };

    configs.forEach((c) => {
      result[c.key] = c.url;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

module.exports = router;
