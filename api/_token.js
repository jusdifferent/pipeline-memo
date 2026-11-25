// Signs an email address after it subscribes, so /api/profile only updates the reader who just signed up.
// Files starting with "_" aren't routes on Vercel. The key is the Beehiiv API key, or the signup database token
// when Beehiiv isn't connected yet, so no extra secret is needed.
const crypto = require('crypto');
const { secret } = require('./_store');
const KEY = process.env.BEEHIIV_API_KEY || secret;

const sign = (email) => crypto.createHmac('sha256', KEY).update(`profile:${email}`).digest('hex').slice(0, 32);

const verify = (email, token) => {
  if (!KEY) return false;
  const want = Buffer.from(sign(email));
  const got = Buffer.from(String(token || ''));
  return got.length === want.length && crypto.timingSafeEqual(got, want);
};

module.exports = { sign, verify };
