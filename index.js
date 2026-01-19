require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

// Log environment check
console.log("=== SERVER STARTING ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT || 5000);
console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
console.log(
  "RESEND_API_KEY value:",
  process.env.RESEND_API_KEY
    ? process.env.RESEND_API_KEY.substring(0, 12) + "..."
    : "MISSING",
);

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://merry-praline-55aec6.netlify.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// Routes
const registrationRoutes = require("./routes/registration");
const authRoutes = require("./routes/auth");

app.use("/api/registration", registrationRoutes);
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
