import nodemailer from 'nodemailer'

const publicUrl = (process.env.BOOKIFY_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '')
const from = process.env.SMTP_FROM || process.env.SMTP_USER

let transporter

function mailer() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass || !from) throw new Error('Email delivery is not configured.')
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
  return transporter
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character]))

function emailLayout(title, name, message, buttonLabel, href) {
  return `<!doctype html>
<html><body style="margin:0;background:#f5efdf;color:#173f35;font-family:Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="font-family:Georgia,serif;font-size:30px;margin-bottom:30px">Bookify <span style="color:#c49a4a">✦</span></div>
    <div style="background:#fffaf0;border-radius:16px;padding:32px">
      <h1 style="font-family:Georgia,serif;font-weight:400">${escapeHtml(title)}</h1>
      <p>Hi ${escapeHtml(name)},</p>
      <p style="line-height:1.6">${escapeHtml(message)}</p>
      <p style="margin:28px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#173f35;color:#fffaf0;padding:13px 20px;border-radius:24px;text-decoration:none;font-weight:bold">${escapeHtml(buttonLabel)}</a></p>
      <p style="font-size:13px;line-height:1.5;color:#6c5a45">This link expires in one hour. If you did not request this, you can safely ignore this email.</p>
    </div>
  </div>
</body></html>`
}

async function sendActionEmail({ to, name, subject, message, buttonLabel, path }) {
  const href = `${publicUrl}${path}`
  await mailer().sendMail({
    from,
    to,
    subject,
    text: `Hi ${name},\n\n${message}\n\n${href}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.`,
    html: emailLayout(subject, name, message, buttonLabel, href),
  })
}

export const sendVerificationEmail = ({ to, name, token }) => sendActionEmail({
  to,
  name,
  subject: 'Confirm your Bookify email',
  message: 'Confirm your email address to finish creating your Bookify account.',
  buttonLabel: 'Confirm email',
  path: `/?verify=${encodeURIComponent(token)}`,
})

export const sendPasswordResetEmail = ({ to, name, token }) => sendActionEmail({
  to,
  name,
  subject: 'Reset your Bookify password',
  message: 'Use the button below to choose a new password for your Bookify account.',
  buttonLabel: 'Reset password',
  path: `/?reset=${encodeURIComponent(token)}`,
})
