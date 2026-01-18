const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("=== EMAIL SERVICE START ===");
  console.log("Sending to:", options.email);
  console.log("Subject:", options.subject);

  // Check if email credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email credentials not set - skipping email");
    return { success: false, error: "Email credentials not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: options.subject,
      html: options.html || options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
