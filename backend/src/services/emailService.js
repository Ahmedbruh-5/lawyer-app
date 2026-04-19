const nodemailer = require('nodemailer');

/**
 * Gmail SMTP: 2FA must be ON, then create an App Password at
 * https://myaccount.google.com/apppasswords — use that 16-character value as SMTP_PASS (not your Gmail login password).
 */
function readSmtpPass() {
  const raw =
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    '';
  return raw ? String(raw).trim().replace(/\s/g, '') : '';
}

const SMTP_USER = (process.env.SMTP_USER || 'contact.advocatedesk@gmail.com').trim();
const SMTP_PASS = readSmtpPass();
const SMTP_FROM = process.env.SMTP_FROM || `AdvokateDesk <${SMTP_USER}>`;

let transporter;

function buildTransport() {
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const useSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (process.env.NODE_ENV !== 'production' && SMTP_PASS.length > 0 && SMTP_PASS.length !== 16) {
    console.warn(
      '[email] Gmail App Passwords are 16 characters (after removing spaces). Current SMTP_PASS length:',
      SMTP_PASS.length,
      '— fix .env or create a new app password.'
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: useSecure,
    ...(port === 587 && {
      requireTLS: true,
    }),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function getTransporter() {
  if (!SMTP_PASS) return null;
  if (!transporter) {
    transporter = buildTransport();
  }
  return transporter;
}

/** Clear cached transport (e.g. after changing .env during dev). */
function resetTransporter() {
  transporter = null;
}

/**
 * Sends signup OTP via Gmail SMTP.
 */
async function sendSignupOtpEmail(to, otp, fullName) {
  const safeName = (fullName || 'there').trim() || 'there';

  const mail = {
    from: SMTP_FROM,
    to,
    subject: 'Your AdvokateDesk verification code',
    text: [
      `Hi ${safeName},`,
      '',
      `Your verification code is: ${otp}`,
      '',
      'This code expires in 15 minutes.',
      '',
      'If you did not create an AdvokateDesk account, you can ignore this email.',
      '',
      '— AdvokateDesk',
    ].join('\n'),
    html: `
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0;">${escapeHtml(otp)}</p>
      <p style="color:#64748b;font-size:14px;">This code expires in 15 minutes.</p>
      <p style="color:#64748b;font-size:14px;">If you did not create an AdvokateDesk account, you can ignore this email.</p>
      <p>— AdvokateDesk</p>
    `,
  };

  const transport = getTransporter();

  if (!transport) {
    console.warn(`[email] SMTP_PASS not set — OTP for ${to}: ${otp}`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Email delivery is not configured. Set SMTP_PASS (Gmail App Password) on the server.'
      );
    }
    return;
  }

  try {
    await transport.sendMail(mail);
  } catch (err) {
    resetTransporter();
    console.error('[email] sendMail failed:', err.message);
    const msg = String(err.message || '');
    if (
      msg.includes('534') ||
      msg.includes('535') ||
      msg.includes('BadCredentials')
    ) {
      throw new Error(
        'Gmail rejected the login. Create a 16-character App Password at https://myaccount.google.com/apppasswords ' +
          '(select Mail + your device). Put that in SMTP_PASS — not your normal Gmail password. ' +
          `SMTP_USER must be ${SMTP_USER}.`
      );
    }
    throw err;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  sendSignupOtpEmail,
  getTransporter,
  resetTransporter,
};
