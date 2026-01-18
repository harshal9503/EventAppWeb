require("dotenv").config();

const https = require("https");

const sendEmail = async (options) => {
  // Validate API key exists
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  const data = JSON.stringify({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: options.email,
    subject: options.subject,
    html: options.html || options.message,
  });

  const requestOptions = {
    hostname: "api.resend.com",
    port: 443,
    path: "/emails",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
    timeout: 30000, // 30 second timeout
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log("Resend API response:", res.statusCode, body);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Email failed (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Email request timed out"));
    });

    req.on("error", (err) => {
      console.error("Email request error:", err);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

module.exports = sendEmail;
