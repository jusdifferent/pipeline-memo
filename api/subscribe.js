// Vercel serverless function: POST /api/subscribe
// Adds a subscriber to Beehiiv with name, role and company as custom fields.
// Required environment variables (set in Vercel > Project > Settings > Environment Variables):
//   BEEHIIV_API_KEY         API key from Beehiiv > Settings > Integrations > API
//   BEEHIIV_PUBLICATION_ID  Publication ID, starts with "pub_"
// Optional:
//   BEEHIIV_SEND_WELCOME    "false" to skip Beehiiv's welcome email (default: sent)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function wantsJson(req) {
  return (req.headers.accept || '').includes('application/json') || (req.headers['content-type'] || '').includes('application/json');
}

function reply(req, res, status, body) {
  if (wantsJson(req)) return res.status(status).json(body);
  if (status < 300) { res.setHeader('Location', '/welcome'); return res.status(303).end(); }
  return res.status(status).send(body.error || 'Something went wrong.');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to request access.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  const clean = (v, n = 200) => String(v || '').trim().slice(0, n);
  const email = clean(body.email, 254).toLowerCase();
  const name = clean(body.name);
  const role = clean(body.role);
  const company = clean(body.company);
  const source = clean(body.source, 100);

  // Honeypot: real people never fill the hidden "website" field.
  if (clean(body.website)) return reply(req, res, 200, { ok: true });

  if (!EMAIL.test(email)) return reply(req, res, 400, { error: 'Enter a valid work email address.' });

  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) {
    console.error('Missing BEEHIIV_API_KEY or BEEHIIV_PUBLICATION_ID');
    return reply(req, res, 503, { error: 'Subscriptions aren\u2019t open yet. Email us and we\u2019ll add you by hand.' });
  }

  const custom_fields = [
    ['Name', name], ['Role', role], ['Company', company],
  ].filter(([, v]) => v).map(([n, value]) => ({ name: n, value }));

  try {
    const r = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(pubId)}/subscriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: process.env.BEEHIIV_SEND_WELCOME !== 'false',
        utm_source: 'website',
        utm_medium: 'site_form',
        utm_campaign: source,
        referring_site: req.headers.referer || '',
        custom_fields,
      }),
    });
    if (!r.ok) {
      console.error('Beehiiv error', r.status, await r.text());
      return reply(req, res, 502, { error: 'Your request didn\u2019t go through. Try again in a minute.' });
    }
    return reply(req, res, 200, { ok: true });
  } catch (err) {
    console.error('Beehiiv request failed', err);
    return reply(req, res, 502, { error: 'Your request didn\u2019t go through. Try again in a minute.' });
  }
};
