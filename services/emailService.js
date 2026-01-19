const sendEmail = require("../utils/emailService");

const sendConfirmationEmail = async (email, name, portalLink) => {
  console.log("=== SENDING CONFIRMATION EMAIL ===");
  console.log("To:", email, "Name:", name);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="400" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              <!-- Header with gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Registration Confirmed!</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0; line-height: 1.5;">
                    Hello <strong>${name}</strong>,
                  </p>
                  <p style="color: #666666; font-size: 16px; margin: 0 0 30px 0; line-height: 1.5;">
                    Your registration is confirmed. Welcome to our event!
                  </p>
                  <!-- Button -->
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
                        <a href="${portalLink}" style="display: inline-block; padding: 15px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                          Access Portal
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #999999; font-size: 14px; margin: 30px 0 0 0;">
                    Thank you for registering!
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    © 2024 Event App. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const result = await sendEmail({
    email,
    subject: "Registration Confirmed - Welcome to Our Event!",
    html,
  });

  console.log("Confirmation email result:", result);
  return result;
};

module.exports = { sendConfirmationEmail, sendEmail };
