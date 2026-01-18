const mongoose = require("mongoose");

const contentConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    label: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ContentConfig", contentConfigSchema);
