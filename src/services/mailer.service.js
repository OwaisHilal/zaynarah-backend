// backend/src/services/mailer.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendVerificationEmail = async ({ to, token }) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Zaynarah" <${process.env.SMTP_USER}>`,
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

exports.sendNotificationEmail = async ({
  to,
  subject,
  title,
  message,
  actionUrl,
}) => {
  await transporter.sendMail({
    from: `"Zaynarah" <${process.env.SMTP_USER}>`,
    to,
    subject,
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
