const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: 'RentHub <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Your RentHub Admin Login OTP',
    html: `
      <div style="font-family: helvetica, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #32be8f;">RentHub Admin Verification</h2>
        <p>Use the OTP below to complete your admin login. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 12px;
          color: #32be8f; background: #f0fff8; padding: 20px;
          border-radius: 8px; text-align: center; margin: 24px 0;">${otp}</div>
        <p style="color: #888; font-size: 0.85rem;">If you did not attempt to log in, change your password immediately.</p>
      </div>`,
  });
};

const sendRegistrationOtpEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: 'RentHub <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Verify your RentHub account',
    html: `
      <div style="font-family: helvetica, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #32be8f;">Welcome to RentHub!</h2>
        <p>Enter the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size: 2.5rem; font-weight: bold; letter-spacing: 12px;
          color: #32be8f; background: #f0fff8; padding: 20px;
          border-radius: 8px; text-align: center; margin: 24px 0;">${otp}</div>
        <p style="color: #888; font-size: 0.85rem;">If you didn't create a RentHub account, ignore this email.</p>
      </div>`,
  });
};

const sendPasswordChangedEmail = async (toEmail, userName) => {
  await resend.emails.send({
    from: 'RentHub <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Your RentHub password was changed',
    html: `
      <div style="font-family: helvetica, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #32be8f;">Password Changed Successfully</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your password was changed on <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>.</p>
        <div style="background: #fff3f3; border-left: 4px solid #e74c3c;
          padding: 14px 18px; border-radius: 6px; margin: 20px 0;
          color: #c0392b; font-size: 0.9rem;">
          <strong>Wasn't you?</strong> Reset your password immediately via "Forgot Password".
        </div>
        <p style="color: #888; font-size: 0.85rem;">— The RentHub Team</p>
      </div>`,
  });
};

module.exports = { sendOtpEmail, sendRegistrationOtpEmail, sendPasswordChangedEmail };
