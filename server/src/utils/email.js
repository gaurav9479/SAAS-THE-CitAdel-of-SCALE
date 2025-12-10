import nodemailer from 'nodemailer';

const hasCreds = process.env.EMAIL_USER && process.env.EMAIL_PASS;
const transporter = hasCreds
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

export async function sendEmail({ to, subject, text }) {
  if (!transporter) {
    console.log(`[DEV] Email send skipped (no SMTP creds). To: ${to}, Subject: ${subject}, Text: ${text}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
  });
}


