// backend/utils/sendOtpEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
          font-size: 2.5rem;
          font-weight: bold;
          letter-spacing: 12px;
          color: #32be8f;
          background: #f0fff8;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 24px 0;
        ">${otp}</div>
        <p style="color: #888; font-size: 0.85rem;">
          If you did not attempt to log in, someone may have your admin credentials.
          Change your password immediately.
        </p>
      </div>
    `,
  });
};

module.exports = sendOtpEmail;
