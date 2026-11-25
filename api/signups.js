// Vercel serverless function: GET /api/signups
// Downloads every stored signup as a CSV, ready to import into Beehiiv (Subscribers > Import).
// Protected by a password: set EXPORT_PASSWORD in Vercel > Project > Settings > Environment Variables.
// Your browser asks for a username (anything) and that password. Without EXPORT_PASSWORD this page doesn't exist.

const crypto = require('crypto');
const store = require('./_store');

const COLUMNS = ['email', 'signed_up', 'name', 'role', 'company', 'seniority', 'industry', 'source', 'referrer'];
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // stop spreadsheet formulas
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

module.exports = async function handler(req, res) {
  const pass = process.env.EXPORT_PASSWORD;
  if (!pass || !store.enabled()) return res.status(404).send('Not found');

  const [, b64 = ''] = String(req.headers.authorization || '').split(' ');
  const given = Buffer.from(b64, 'base64').toString().split(':').slice(1).join(':');
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(pass).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Buyline signups"');
    return res.status(401).send('Password required');
  }

  try {
    const rows = await store.listSignups();
    const csv = [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="buyline-signups-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Signup export failed', err);
    return res.status(500).send('Export failed. Try again in a minute.');
  }
};
