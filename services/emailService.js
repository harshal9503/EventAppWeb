const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendConfirmationEmail = async (to, name, portalLink) => {
  const mailOptions = {
    from: `"Event App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Registration Confirmed - Welcome to Our Event!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome, ${name}!</h1>
            <p>Your registration is confirmed</p>
          </div>
          <div class="content">
            <p>Thank you for registering for our event! We're excited to have you join us.</p>
            <p>Access your personal event portal to view exclusive content:</p>
            <center>
              <a href="${portalLink}" class="button">Access Event Portal</a>
            </center>
            <p>If the button doesn't work, copy this link:<br><small>${portalLink}</small></p>
          </div>
          <div class="footer">
            <p>Questions? Reply to this email for support.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Event App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Your Login Code",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .content { padding: 40px 30px; text-align: center; }
          .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; background: #f0f4ff; padding: 20px 40px; border-radius: 12px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Login Code</h1>
          </div>
          <div class="content">
            <p>Use this code to log in to your event portal:</p>
            <div class="otp-code">${otp}</div>
            <p>This code expires in 10 minutes.</p>
            <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>Event App - Your Event Portal</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendConfirmationEmail, sendOTPEmail };
