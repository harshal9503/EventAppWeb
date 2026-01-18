const mongoose = require("mongoose");

const contentLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    contentType: {
      type: String,
      enum: ["videos", "pdf", "feedback"],
      required: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ContentLog", contentLogSchema);
