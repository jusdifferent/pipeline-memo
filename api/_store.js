// Keeps a copy of every signup in a Redis database (Upstash, added through Vercel > Storage), so emails are
// captured even before Beehiiv is connected. Download them as a CSV from /api/signups.
// Uses the environment variables the Vercel integration adds: KV_REST_API_URL + KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). Files starting with "_" aren't routes on Vercel.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const enabled = () => Boolean(URL_ && TOKEN);

async function pipeline(commands) {
  const r = await fetch(`${URL_.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error(`Redis ${r.status}: ${await r.text()}`);
  const out = await r.json();
  const bad = out.find((x) => x.error);
  if (bad) throw new Error(`Redis: ${bad.error}`);
  return out.map((x) => x.result);
}

const flat = (fields) => Object.entries(fields).filter(([, v]) => v).flatMap(([k, v]) => [k, String(v)]);

// New signup: remember when they first signed up; later signups with the same email update the details.
async function saveSignup(email, fields) {
  const now = new Date();
  const cmds = [['ZADD', 'signups', 'NX', String(now.getTime()), email], ['HSETNX', `signup:${email}`, 'signed_up', now.toISOString()]];
  const rest = flat(fields);
  if (rest.length) cmds.push(['HSET', `signup:${email}`, ...rest]);
  await pipeline(cmds);
}

// Second signup step (role, seniority, industry) for someone who is already on the list.
async function updateSignup(email, fields) {
  const [score] = await pipeline([['ZSCORE', 'signups', email]]);
  if (score == null) return false;
  const rest = flat(fields);
  if (rest.length) await pipeline([['HSET', `signup:${email}`, ...rest]]);
  return true;
}

async function listSignups() {
  const [emails] = await pipeline([['ZRANGE', 'signups', '0', '-1']]);
  if (!emails.length) return [];
  const rows = await pipeline(emails.map((e) => ['HGETALL', `signup:${e}`]));
  return emails.map((email, i) => {
    const arr = rows[i] || [];
    const o = { email };
    for (let k = 0; k < arr.length; k += 2) o[arr[k]] = arr[k + 1];
    return o;
  });
}

module.exports = { enabled, saveSignup, updateSignup, listSignups, secret: TOKEN || '' };
