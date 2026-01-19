require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");

// Debug environment variables
console.log("=== SERVER STARTING ===");
console.log("PORT:", process.env.PORT || 5000);
console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "SET" : "NOT SET");

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
const adminRoutes = require("./routes/admin");

app.use("/api/registration", registrationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Connect and start
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
