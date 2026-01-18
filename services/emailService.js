const sendEmail = require("../utils/emailService");

const sendConfirmationEmail = async (email, name, portalLink) => {
  console.log("=== SENDING CONFIRMATION EMAIL ===");

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #333;">Registration Confirmed!</h2>
      <p>Hello ${name},</p>
      <p>Your registration is confirmed. Welcome to our event!</p>
      <p>Access your portal here:</p>
      <a href="${portalLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Access Portal
      </a>
      <p style="margin-top: 20px; color: #666;">Thank you for registering!</p>
    </div>
  `;

  return await sendEmail({
    email,
    subject: "Registration Confirmed - Welcome to Our Event!",
    html,
  });
};

module.exports = { sendConfirmationEmail, sendEmail };
