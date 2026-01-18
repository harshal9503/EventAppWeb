const sendEmail = require("../utils/emailService");

// ...existing code...

// In your registration function, wrap email in try-catch:
// Example (adjust based on your actual code):

try {
  await sendEmail({
    email: user.email,
    subject: "Welcome!",
    message: "Registration successful",
  });
} catch (emailError) {
  console.log("Email failed but registration continues:", emailError.message);
}

// ...existing code...
