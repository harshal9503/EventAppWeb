const nodemailer = require("nodemailer");

console.log("=== EMAIL SERVICE LOADING ===");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const generateOTPEmailTemplate = (otp, type = "login") => {
  const title = type === "login" ? "Login Code" : "Verification Code";
  const message =
    type === "login"
      ? "Use this code to log in to your account"
      : "Use this code to verify your email address";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
<tr><td align="center">
<table width="400" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:600;">${title}</h1></td></tr>
<tr><td style="padding:40px 30px;text-align:center;">
<p style="color:#666666;font-size:16px;margin:0 0 30px 0;line-height:1.5;">${message}</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
<td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:25px 40px;">
<span style="font-size:36px;font-weight:700;color:#ffffff;letter-spacing:8px;font-family:'Courier New',monospace;">${otp}</span>
</td></tr></table>
<p style="color:#999999;font-size:14px;margin:30px 0 0 0;">This code will expire in <strong>10 minutes</strong></p>
<p style="color:#999999;font-size:12px;margin:20px 0 0 0;">If you didn't request this code, please ignore this email.</p>
</td></tr>
<tr><td style="background-color:#f9f9f9;padding:20px 30px;text-align:center;border-top:1px solid #eeeeee;">
<p style="color:#999999;font-size:12px;margin:0;">© 2024 Event App. All rights reserved.</p>
</td></tr></table></td></tr></table></body></html>`;
};

const sendEmail = async (options) => {
  console.log("=== EMAIL SERVICE START ===");
  console.log("Sending to:", options.email);
  console.log("Subject:", options.subject);

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Event App" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || `<p>${options.message}</p>`,
    };

    console.log("Sending email via Gmail...");
    const info = await transporter.sendMail(mailOptions);

    console.log("=== EMAIL SENT SUCCESS ===");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);

    return { success: true, data: info };
  } catch (error) {
    console.error("=== EMAIL ERROR ===");
    console.error("Error:", error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (email, otp, type = "login") => {
  console.log("=== SEND OTP EMAIL ===");
  console.log("To:", email, "OTP:", otp, "Type:", type);

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
