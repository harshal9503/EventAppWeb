// Redirect to new email service - delete nodemailer usage
const sendEmail = require("./emailService");
module.exports = sendEmail;
