// backend/src/services/mailer.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Zaynarah" <${process.env.SMTP_USER}>`;

async function sendMail({ to, subject, html, attachments }) {
  return transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
    attachments,
  });
}

exports.sendVerificationEmail = async ({ to, token }) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  return sendMail({
    to,
    subject: 'Verify your email – Zaynarah',
    html: `
      <div style="font-family:Arial;padding:24px">
        <h2>Verify your email</h2>
        <p>Please verify your email to activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 20px;
           background:#B76E79;color:#fff;border-radius:24px;
           text-decoration:none;font-weight:bold">
           Verify Email
        </a>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async ({ to, token }) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  return sendMail({
    to,
    subject: 'Reset your password – Zaynarah',
    html: `
      <div style="font-family:Arial;padding:24px">
        <h2>Password reset request</h2>
        <p>You requested to reset your password.</p>
        <p>If this was not you, you can safely ignore this email.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 20px;
           background:#111;color:#fff;border-radius:24px;
           text-decoration:none;font-weight:bold;margin-top:16px">
           Reset Password
        </a>
        <p style="margin-top:24px;font-size:12px;color:#777">
          This link expires in 30 minutes.
        </p>
      </div>
    `,
  });
};

exports.sendPasswordResetSuccessEmail = async ({ to, password }) => {
  return sendMail({
    to,
    subject: 'Your password has been reset – Zaynarah',
    html: `
      <div style="font-family:Arial;padding:24px">
        <h2>Password reset successful</h2>
        <p>Your password has been reset. Use the temporary password below to log in:</p>
        <div style="margin:16px 0;padding:12px;
             background:#f5f5f5;border-radius:8px;
             font-family:monospace;font-size:16px">
          ${password}
        </div>
        <p>Please log in and change your password immediately from your profile.</p>
      </div>
    `,
  });
};

exports.sendNotificationEmail = async ({
  to,
  subject,
  title,
  message,
  actionUrl,
  attachments = [],
}) => {
  return sendMail({
    to,
    subject,
    attachments,
    html: `
      <div style="font-family:Arial;padding:32px;max-width:560px">
        <h2 style="margin-bottom:12px">${title}</h2>
        <p style="color:#444;font-size:15px">${message}</p>
        ${
          actionUrl
            ? `<a href="${process.env.FRONTEND_URL}${actionUrl}"
                 style="display:inline-block;margin-top:20px;
                 padding:12px 20px;background:#111;color:#fff;
                 border-radius:24px;text-decoration:none;font-weight:bold">
                 View details
               </a>`
            : ''
        }
        <p style="margin-top:32px;font-size:12px;color:#777">
          Zaynarah · Crafted Heritage
        </p>
      </div>
    `,
  });
};
