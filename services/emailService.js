const nodemailer = require("nodemailer");

/**
 * IMPORTANT:
 * - Do NOT use `service: "gmail"`
 * - Port MUST be number
 * - secure MUST be false for 587
 */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp.gmail.com
  port: Number(process.env.EMAIL_PORT), // 587
  secure: false, // MUST be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
  connectionTimeout: 20_000, // 20 seconds
  greetingTimeout: 20_000,
  socketTimeout: 20_000,
});

/**
 * Verify SMTP connection ONCE at startup
 */
(async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP server is ready to send emails");
  } catch (err) {
    console.error("❌ SMTP connection failed:", err.message);
  }
})();

/* ================= CONFIRMATION EMAIL ================= */

const sendConfirmationEmail = async (to, name, portalLink) => {
  const mailOptions = {
    from: `"Event App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Registration Confirmed - Welcome to Our Event!",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
          <div style="background:#667eea;color:#fff;padding:30px;text-align:center;">
            <h1>🎉 Welcome, ${name}!</h1>
            <p>Your registration is confirmed</p>
          </div>
          <div style="padding:30px;">
            <p>Thank you for registering for our event.</p>
            <p>Click below to access your portal:</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${portalLink}" style="background:#667eea;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;">
                Access Event Portal
              </a>
            </div>
            <p style="font-size:12px;color:#666;">${portalLink}</p>
          </div>
          <div style="background:#f8f9fa;padding:15px;text-align:center;font-size:13px;color:#777;">
            Event App Support
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/* ================= OTP EMAIL ================= */

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Event App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Your Login Code",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">
          <div style="background:#667eea;color:#fff;padding:30px;text-align:center;">
            <h1>🔐 Login Code</h1>
          </div>
          <div style="padding:30px;text-align:center;">
            <p>Your OTP code:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#667eea;margin:20px 0;">
              ${otp}
            </div>
            <p>This code expires in 10 minutes.</p>
          </div>
          <div style="background:#f8f9fa;padding:15px;text-align:center;font-size:13px;color:#777;">
            Event App
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendConfirmationEmail,
  sendOTPEmail,
};
