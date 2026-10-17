// Vercel serverless function: POST /api/profile
// The second signup step: saves a new subscriber's role, seniority and industry to their Beehiiv
// subscription as custom fields. Create the "Role", "Seniority" and "Industry" custom fields in
// Beehiiv first; Beehiiv drops values for fields that don't exist.
// Uses the same environment variables as /api/subscribe.

const { verify } = require('./_token');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  const clean = (v, n = 80) => String(v || '').trim().slice(0, n);
  const email = clean(body.email, 254).toLowerCase();
  const role = clean(body.role);
  const seniority = clean(body.seniority);
  const industry = clean(body.industry);

  if (!verify(email, body.token)) return res.status(403).json({ error: 'This form has expired. You’re still subscribed.' });
  if (!role || !seniority || !industry) return res.status(400).json({ error: 'Choose your role, seniority and industry.' });

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) return res.status(503).json({ error: 'Subscriptions aren’t open yet.' });

  const custom_fields = [
    ['Role', role], ['Seniority', seniority], ['Industry', industry],
  ].filter(([, v]) => v).map(([name, value]) => ({ name, value }));

  try {
    const r = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(pubId)}/subscriptions/by_email/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_fields }),
    });
    if (!r.ok) {
      console.error('Beehiiv profile error', r.status, await r.text());
      return res.status(502).json({ error: 'That didn’t save. Try again in a minute.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Beehiiv profile request failed', err);
    return res.status(502).json({ error: 'That didn’t save. Try again in a minute.' });
  }
};
