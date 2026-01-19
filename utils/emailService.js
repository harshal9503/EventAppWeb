const nodemailer = require("nodemailer");

console.log("=== EMAIL SERVICE INIT ===");
console.log("EMAIL_USER:", process.env.EMAIL_USER || "NOT SET");
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS
    ? "SET (" + process.env.EMAIL_PASS.length + " chars)"
    : "NOT SET",
);

// Create transporter with proper settings
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 3,
    rateDelta: 20000,
    rateLimit: 5,
  });
};

const generateOTPEmailTemplate = (otp, type = "login") => {
  const title = type === "login" ? "Login Code" : "Verification Code";
  const message =
    type === "login"
      ? "Use this code to log in to your account"
      : "Use this code to verify your email address";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
<table width="100%" style="padding:40px 20px;"><tr><td align="center">
<table width="400" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">${title}</h1></td></tr>
<tr><td style="padding:40px;text-align:center;">
<p style="color:#666;font-size:16px;margin:0 0 30px;">${message}</p>
<table style="margin:0 auto;"><tr>
<td style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:25px 40px;">
<span style="font-size:36px;font-weight:700;color:#fff;letter-spacing:8px;font-family:monospace;">${otp}</span>
</td></tr></table>
<p style="color:#999;font-size:14px;margin:30px 0 0;">Expires in <strong>10 minutes</strong></p>
</td></tr>
<tr><td style="background:#f9f9f9;padding:20px;text-align:center;border-top:1px solid #eee;">
<p style="color:#999;font-size:12px;margin:0;">© 2024 Event App</p>
</td></tr></table></td></tr></table></body></html>`;
};

const sendEmail = async (options) => {
  console.log("=== EMAIL SERVICE START ===");
  console.log("Sending to:", options.email);
  console.log("Subject:", options.subject);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("=== EMAIL ERROR: CREDENTIALS MISSING ===");
    return { success: false, error: "Email credentials missing" };
  }

  try {
    const transporter = createTransporter();

    console.log("Created transporter, sending...");

    const info = await transporter.sendMail({
      from: `"Event App" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || `<p>${options.message}</p>`,
    });

    console.log("=== EMAIL SENT SUCCESS ===");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

    // Close the transporter
    transporter.close();

    return { success: true, data: info };
  } catch (error) {
    console.error("=== EMAIL FAILED ===");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (email, otp, type = "login") => {
  console.log("=== SENDING OTP ===");
  console.log("To:", email, "OTP:", otp);

  const subject =
    type === "login" ? "Your Login Code" : "Your Verification Code";
  return await sendEmail({
    email,
    subject,
    html: generateOTPEmailTemplate(otp, type),
  });
};

module.exports = sendEmail;
module.exports.sendEmail = sendEmail;
module.exports.sendOTPEmail = sendOTPEmail;
module.exports.generateOTPEmailTemplate = generateOTPEmailTemplate;
