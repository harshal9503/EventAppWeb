const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const ContentLog = require("../models/ContentLog");
const ContentConfig = require("../models/ContentConfig");

const router = express.Router();

// Get content URLs
router.get("/urls", authenticateUser, async (req, res) => {
  try {
    const configs = await ContentConfig.find({});
    const urls = {
      videos: process.env.VIDEOS_URL,
      pdf: process.env.PDF_URL,
      feedback: process.env.FEEDBACK_URL,
    };

    // Override with database configs if they exist
    configs.forEach((config) => {
      urls[config.key] = config.url;
    });

    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch content URLs" });
  }
});

// Log content access
router.post("/log", authenticateUser, async (req, res) => {
  try {
    const { contentType } = req.body;

    if (!["videos", "pdf", "feedback"].includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const log = new ContentLog({
      email: req.user.email,
      contentType,
    });
    await log.save();

    res.json({ message: "Access logged" });
  } catch (error) {
    res.status(500).json({ error: "Failed to log access" });
  }
});

module.exports = router;
