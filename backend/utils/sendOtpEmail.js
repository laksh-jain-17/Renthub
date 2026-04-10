const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,  // SSL on 465 — works on Render
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Admin login OTP (existing)
const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"RentHub Admin" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your RentHub Admin Login OTP',
    html: `
      <div style="font-family: helvetica, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #32be8f;">RentHub Admin Verification</h2>
        <p>Use the OTP below to complete your admin login. It expires in <strong>10 minutes</strong>.</p>
        <div style="
          font-size: 2.5rem; font-weight: bold; letter-spacing: 12px;
          color: #32be8f; background: #f0fff8; padding: 20px;
          border-radius: 8px; text-align: center; margin: 24px 0;
        ">${otp}</div>
        <p style="color: #888; font-size: 0.85rem;">
          If you did not attempt to log in, someone may have your admin credentials.
          Change your password immediately.
        </p>
      </div>
    `,
  });
};

// New user registration OTP
const sendRegistrationOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"RentHub" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your RentHub account',
    html: `
      <div style="font-family: helvetica, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #32be8f;">Welcome to RentHub!</h2>
        <p>Thanks for signing up. Enter the OTP below to verify your email address.
           It expires in <strong>10 minutes</strong>.</p>
        <div style="
          font-size: 2.5rem; font-weight: bold; letter-spacing: 12px;
          color: #32be8f; background: #f0fff8; padding: 20px;
          border-radius: 8px; text-align: center; margin: 24px 0;
        ">${otp}</div>
        <p style="color: #888; font-size: 0.85rem;">
          If you didn't create a RentHub account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

// Password changed confirmation
const sendPasswordChangedEmail = async (toEmail, userName) => {
  await transporter.sendMail({
    from: `"RentHub" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your RentHub password was changed',
    html: `
      <div style="font-family: helvetica, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #32be8f;">Password Changed Successfully</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your RentHub account password was successfully changed on
           <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>.</p>
        <p>If this was you, no further action is needed.</p>
        <div style="
          background: #fff3f3; border-left: 4px solid #e74c3c;
          padding: 14px 18px; border-radius: 6px; margin: 20px 0;
          color: #c0392b; font-size: 0.9rem;
        ">
          <strong>Wasn't you?</strong> Reset your password immediately using the
          "Forgot Password" link on the login page, or contact our support team.
        </div>
        <p style="color: #888; font-size: 0.85rem;">— The RentHub Team</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail, sendRegistrationOtpEmail, sendPasswordChangedEmail };
