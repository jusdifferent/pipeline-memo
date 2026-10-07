// Builds the site into /dist. No dependencies: `node build.mjs`.
// Vercel runs this on every deploy (see vercel.json).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseFrontmatter, renderMarkdown, escapeHtml as e } from './src/markdown.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/deep-dives.json'), 'utf8'));
const SERIES = data.series;
const seriesBy = Object.fromEntries(SERIES.map((s) => [s.slug, s]));
const DD = data.deepDives;
// The free preview runs to the first ## heading, capped at this many paragraphs.
const PREVIEW_PARAGRAPHS = 12;

// ------------------------------------------------------------------ logos
// 1. A file in public/logos/<company>.svg|png|webp always wins.
// 2. Otherwise, with a Brandfetch client ID in site.config.json, the official logo is
//    loaded from Brandfetch's Logo API. If Brandfetch has no logo, the tile shows the name.
const companySlug = (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.35;
};
for (const dd of DD) {
  for (const ext of ['svg', 'png', 'webp']) {
    const f = path.join(ROOT, 'public/logos', `${companySlug(dd.company)}.${ext}`);
    if (fs.existsSync(f)) { dd.logo = `/logos/${companySlug(dd.company)}.${ext}`; dd.logoLocal = true; break; }
  }
  if (!dd.logo && cfg.brandfetchClientId && dd.domain) {
    // Ask for the variant made for this background; if it doesn't exist, fall back to the standard logo.
    const theme = isDark(dd.brand.bg) ? 'light' : 'dark';
    const base = `https://cdn.brandfetch.io/domain/${dd.domain}/w/480`;
    const id = `?c=${encodeURIComponent(cfg.brandfetchClientId)}`;
    const type = dd.logoType || 'logo'; // 'symbol' shows just the mark, e.g. Figma's multicolor icon
    dd.logo = `${base}/theme/${theme}/fallback/404/type/${type}${id}`;
    dd.logoAlt = `${base}/fallback/404/type/${type}${id}`;
    // logoTheme: false uses the standard full-color version directly (e.g. Figma's multicolor symbol).
    if (dd.logoTheme === false) { dd.logo = dd.logoAlt; dd.logoAlt = ''; }
  }
}

// ------------------------------------------------------------------ essays
const essayDir = path.join(ROOT, 'content/deep-dives');
for (const dd of DD) {
  const file = path.join(essayDir, `${dd.slug}.md`);
  if (!fs.existsSync(file)) continue;
  const { data: fm, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (fm.published === false) continue;
  Object.assign(dd, { essay: body, date: fm.date, dek: fm.dek || dd.dek, readUrl: fm.readUrl || '', published: true, minutes: Math.max(1, Math.round(body.split(/\s+/).length / 230)) });
}
const ordered = [...DD].sort((a, b) => (b.published ? 1 : 0) - (a.published ? 1 : 0) || String(b.date || '').localeCompare(String(a.date || '')));
const INDUSTRIES = [...new Set(DD.map((d) => d.industry))].sort((a, b) => (a === 'Across companies') - (b === 'Across companies') || a.localeCompare(b));

// ------------------------------------------------------------------ helpers
const url = (dd) => `/deep-dives/${dd.slug}`;
const code = (dd) => `${seriesBy[dd.series].short} ${String(dd.number).padStart(2, '0')}`;
const fmtDate = (d) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');
const status = (dd) => (dd.published ? fmtDate(dd.date) : 'In research');
const brandVars = (dd) => `--ep-bg:${dd.brand.bg};--ep-fg:${dd.brand.fg};--ep-ac:${dd.brand.ac}`;
const ONERR = `if(this.dataset.alt){this.src=this.dataset.alt;this.removeAttribute('data-alt')}else{this.closest('[data-logo-box]').classList.add('no-logo');this.remove()}`;

function logoBox(dd, cls) {
  return `<span class="${cls}${dd.logo ? '' : ' no-logo'}${dd.logoMono ? ' is-mono' : ''}" data-logo-box>
    ${dd.logo ? `<img src="${e(dd.logo)}"${dd.logoAlt ? ` data-alt="${e(dd.logoAlt)}"` : ''} alt="${e(dd.company)} logo" loading="lazy" decoding="async"${dd.logoLocal ? '' : ` onerror="${ONERR}"`}>` : ''}
    <span class="logo-name" style="--len:${Math.max(4, Math.max(...dd.company.split(' ').map((w) => w.length)))}">${e(dd.company)}</span>
  </span>`;
}

// ------------------------------------------------------------------ essays (text-only list)
const ESSAY_TITLES = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/essays.json'), 'utf8')).essays;
const slugify = (t) => t.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ALL_ESSAYS = ESSAY_TITLES.map((title) => ({ title, slug: slugify(title) }));
for (const es of ALL_ESSAYS) {
  const file = path.join(ROOT, 'content/essays', `${es.slug}.md`);
  if (!fs.existsSync(file)) continue;
  const { data: fm, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (fm.published === false) continue;
  Object.assign(es, { essay: body, date: fm.date, dek: fm.dek || '', readUrl: fm.readUrl || '', published: true, minutes: Math.max(1, Math.round(body.split(/\s+/).length / 230)) });
}
// Only published essays are built or listed; the rest of essays.json stays a private backlog.
// Newest first by date; essays with the same date keep their order in essays.json.
const ESSAYS = ALL_ESSAYS.filter((x) => x.published).sort((a, b) => String(b.date).localeCompare(String(a.date)));
const essayUrl = (es) => `/essays/${es.slug}`;
const ESSAY_VARS = '--ep-bg:#141414;--ep-fg:#FAF8F3;--ep-ac:#FFFFFF';

const css = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'src/site.js'), 'utf8');
const ver = crypto.createHash('md5').update(css + js).digest('hex').slice(0, 8);
const CLOSE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
const SEARCH = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;

function subForm({ id, button = 'Subscribe', mode = 'subscribe', source = 'site' }) {
  return `<form class="quick" action="/api/subscribe" method="post" data-sub-form data-mode="${mode}">
  <label class="sr-only" for="${id}">Email address</label>
  <input id="${id}" type="email" name="email" autocomplete="email" placeholder="Your email" required>
  <input type="hidden" name="source" value="${e(source)}">
  <div class="hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>
  <button class="btn" type="submit" data-label="${e(button)}">${e(button)}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}

function layout({ title, description = cfg.description, pathName = '/', body, isHome = false, searchIn = 'deep-dives' }) {
  const full = title ? `${title} | ${cfg.name}` : `${cfg.name}: ${cfg.tagline}`;
  const canon = cfg.url + (pathName === '/' ? '' : pathName);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(full)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${e(canon)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${e(title || cfg.name)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(canon)}">
<meta property="og:image" content="${e(cfg.url)}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${e(cfg.name)}" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${cfg.brandfetchClientId ? '<link rel="preconnect" href="https://cdn.brandfetch.io" crossorigin>' : ''}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/styles.css?v=${ver}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="head-row">
    <a class="wordmark" href="/">${e(cfg.name)}</a>
    <form class="search" action="${searchIn === 'essays' ? '/essays' : '/'}" method="get" role="search" data-search>
      <label class="sr-only" for="q">Search deep dives</label>
      <input id="q" name="q" type="search" placeholder="${searchIn === 'essays' ? 'Search essays' : 'Search deep dives'}" autocomplete="off">
      <button type="submit" aria-label="Search">${SEARCH}</button>
    </form>
    <div class="head-actions">
      <button type="button" class="pill" data-open-menu aria-haspopup="dialog">Menu</button>
      <a class="pill pill-dark" href="/subscribe" data-open-subscribe>Subscribe</a>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
<section class="signup-band" aria-labelledby="band-h" data-band>
  <div class="wrap band-inner">
    <h2 id="band-h">${e(cfg.signupHeadline)}</h2>
    <p>${e(cfg.signupText)}</p>
    ${subForm({ id: 'band-email', source: 'footer-band' })}
  </div>
</section>
<footer class="site-foot">
  <div class="wrap foot-grid">
    <div><a class="wordmark" href="/">${e(cfg.name)}</a><p class="foot-tag">${e(cfg.tagline)}</p></div>
    <div><h2 class="foot-h">The series</h2><ul class="foot-links">${SERIES.map((s) => `<li><a href="/?series=${s.slug}">${e(s.name)}</a></li>`).join('')}</ul></div>
    <div><h2 class="foot-h">More</h2><ul class="foot-links"><li><a href="/about">About</a></li><li><a href="/advisory">Work with me</a></li></ul></div>
    <div><h2 class="foot-h">Elsewhere</h2><ul class="foot-links">${cfg.linkedin ? `<li><a href="${e(cfg.linkedin)}" rel="noopener">LinkedIn</a></li>` : ''}${cfg.contactEmail ? `<li><a href="mailto:${e(cfg.contactEmail)}">Email</a></li>` : ''}<li><a href="/feed.xml">RSS</a></li></ul></div>
  </div>
  <div class="wrap foot-base"><p>© ${new Date().getFullYear()} ${e(cfg.author || cfg.name)}. Company names and logos belong to their owners and are used for identification only.</p></div>
</footer>

<div class="float-sub" data-float hidden>
  <p class="float-label">${searchIn === 'essays' ? 'Get every essay by email' : 'Get every deep dive by email'}</p>
  ${subForm({ id: 'float-email', source: searchIn === 'essays' ? 'floating-pill-essays' : 'floating-pill' })}
  <button type="button" class="float-x" data-float-close aria-label="Dismiss">${CLOSE}</button>
</div>

<dialog class="modal modal-menu" id="menu-modal" aria-labelledby="menu-h">
  <button type="button" class="modal-x" data-close aria-label="Close menu">${CLOSE}</button>
  <h2 id="menu-h" class="sr-only">Menu</h2>
  <nav aria-label="Browse">
    <h3>Series</h3>
    <ul>${SERIES.map((s) => `<li><a href="/?series=${s.slug}">${e(s.name)}</a></li>`).join('')}</ul>
    <h3>Industry</h3>
    <ul class="menu-cols">${INDUSTRIES.map((i) => `<li><a href="/?industry=${encodeURIComponent(i)}">${e(i)}</a></li>`).join('')}</ul>
    <h3>More</h3>
    <ul><li><a href="/">All deep dives</a></li><li><a href="/essays">All essays</a></li><li><a href="/about">About</a></li><li><a href="/advisory">Work with me</a></li></ul>
  </nav>
</dialog>
<dialog class="modal modal-sub" id="subscribe-modal" aria-labelledby="sub-modal-h">
  <button type="button" class="modal-x" data-close aria-label="Close">${CLOSE}</button>
  <h2 id="sub-modal-h">${e(cfg.signupHeadline)}</h2>
  <p>${e(cfg.signupText)}</p>
  ${subForm({ id: 'modal-email', source: 'header-modal' })}
</dialog>
<dialog class="modal modal-preview" id="preview-modal" aria-label="Deep dive preview">
  <button type="button" class="modal-x" data-close aria-label="Close">${CLOSE}</button>
  <div data-preview-body></div>
</dialog>
<script src="/site.js?v=${ver}" defer></script>
</body>
</html>`;
}

function card(dd) {
  const hay = `${dd.company} ${dd.title} ${dd.industry} ${seriesBy[dd.series].name}`.toLowerCase();
  return `<li class="card" data-series="${dd.series}" data-industry="${e(dd.industry)}" data-search="${e(hay)}">
  <a href="${url(dd)}" data-preview style="${brandVars(dd)}">
    <span class="tile-stack">
      <span class="tile-page" aria-hidden="true">
        <span class="page-code">${e(code(dd))}</span>
        <span class="page-dek">${e(dd.dek)}</span>
        <span class="page-lines"></span>
      </span>
      <span class="tile">
        ${logoBox(dd, 'tile-mark')}
        ${dd.published ? '<span class="tile-new">New</span>' : ''}
      </span>
    </span>
    <span class="card-title">${e(dd.title)}</span>
  </a>
</li>`;
}

function tabs(active) {
  const items = [['/', 'deep-dives', 'Company deep dives'], ['/essays', 'essays', 'Essays']];
  return `<nav class="tabs" aria-label="Content"><div class="tabs-track" data-current="${active}"><span class="tabs-thumb" aria-hidden="true"></span>${items.map(([h, k, l]) => `<a href="${h}" data-tab="${k}"${k === active ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</div></nav>`;
}

function essayList() {
  return `
<section class="essays" aria-label="Essays" data-filterable>
  <h1 class="sr-only">Essays</h1>
  <div class="active-filters" data-active hidden>
    <p>Showing <strong data-active-label></strong> <span data-active-count></span></p>
    <button type="button" class="pill" data-reset>Show all</button>
  </div>
  <ul class="essay-list">${ESSAYS.map((x) => `<li data-search="${e(x.title.toLowerCase())}"><a href="${essayUrl(x)}" data-preview>${e(x.title)}</a>${x.published ? `<span class="essay-status">${e(fmtDate(x.date))}</span>` : ''}</li>`).join('')}</ul>
  <div class="empty" data-empty hidden><p>No essays match that search.</p><button type="button" class="pill" data-reset>Show all</button></div>
</section>`;
}

function grid() {
  return `
<section class="episodes" aria-label="Deep dives" data-filterable>
  <h1 class="sr-only">${e(cfg.name)}: deep dives</h1>
  <div class="active-filters" data-active hidden>
    <p>Showing <strong data-active-label></strong> <span data-active-count></span></p>
    <button type="button" class="pill" data-reset>Show all</button>
  </div>
  <ul class="grid" data-grid>${ordered.map(card).join('')}</ul>
  <div class="empty" data-empty hidden><p>No deep dives match that search.</p><button type="button" class="pill" data-reset>Show all</button></div>
</section>`;
}

// ------------------------------------------------------------------ deep dive: preview + gate + rest
const CHAPTERS = {
  build: [['The founding insight', 'What the founders saw that the market didn\u2019t.'], ['The wedge', 'The first product, and the first buyer it was built for.'], ['The first go-to-market motion', 'How the company found early customers, and what it learned.'], ['The scaling machine', 'The systems that turned early traction into repeatable growth.'], ['The turning points', 'The few decisions that changed the trajectory.'], ['The mechanism', 'The reusable pattern underneath the story.']],
  gtm: [['The motion in one sentence', 'What the playbook is, stripped to its core.'], ['How the machine is built', 'Teams, channels, incentives, and the handoffs between them.'], ['The economics', 'What it costs to run, and what it returns.'], ['Where it breaks', 'The conditions under which the playbook stops working.'], ['What transfers', 'What other companies can copy, and what they can\u2019t.']],
  inflection: [['Before', 'The business, and the pressure building on it.'], ['The decision', 'What was decided, by whom, and what the alternatives were.'], ['The cost', 'What the company gave up to make the change.'], ['What changed in the machine', 'How sales, product, pricing, and positioning had to adapt.'], ['The lesson', 'What the decision reveals about timing and conviction.']],
  category: [['The unnamed problem', 'The pain buyers felt before anyone had a word for it.'], ['The frame', 'How the problem was named, and why the name stuck.'], ['How the category spread', 'Events, content, analysts, and the people who carried the idea.'], ['Who captured the value', 'Whether the category\u2019s creator ended up owning it.'], ['The mechanism', 'Why this category play worked, or didn\u2019t.']],
};

function splitEssay(html) {
  const blocks = html.split('\n');
  let paras = 0, i = 0;
  for (; i < blocks.length; i++) {
    if (blocks[i].startsWith('<p>')) paras++;
    if (paras > PREVIEW_PARAGRAPHS || (paras > 0 && blocks[i].startsWith('<h2'))) break;
  }
  return { preview: blocks.slice(0, i).join('\n'), rest: blocks.slice(i).join('\n') };
}

function deepDiveArticle(dd) {
  let sheet;
  if (dd.published) {
    const { preview, rest } = splitEssay(renderMarkdown(dd.essay).html);
    const mode = dd.readUrl ? 'redirect' : 'unlock';
    sheet = `<div class="prose preview-text">${preview}</div>
    <div class="gate" data-gate data-mode="${mode}"${dd.readUrl ? ` data-read-url="${e(dd.readUrl)}"` : ''} style="${brandVars(dd)}">
      <h2>Keep reading</h2>
      <p>Enter your email to read the rest of this deep dive. You'll also get the next one the day it's published.</p>
      ${subForm({ id: `gate-${dd.slug}`, button: 'Read the rest', mode, source: dd.slug })}
      <p class="gate-fine">Free. Unsubscribe anytime.</p>
    </div>
    ${dd.readUrl ? '' : `<div class="prose essay-rest" data-rest hidden>${rest}</div>`}`;
  } else {
    sheet = `<div class="prose">
      <h2>What this deep dive covers</h2>
      <ol class="chapters">${CHAPTERS[dd.series].map(([t, d]) => `<li><strong>${e(t)}</strong><span>${e(d)}</span></li>`).join('')}</ol>
    </div>
    <div class="gate" data-gate data-mode="notify" style="${brandVars(dd)}">
      <h2>This deep dive is in research</h2>
      <p>Enter your email and it arrives the day it's published.</p>
      ${subForm({ id: `gate-${dd.slug}`, button: 'Notify me', mode: 'notify', source: dd.slug })}
      <p class="gate-fine">Free. Unsubscribe anytime.</p>
    </div>`;
  }
  return `<article class="dd" data-dd="${dd.slug}">
  <header class="dd-head" style="${brandVars(dd)}">
    <div class="dd-head-grid">
      <div>
        <p class="crumb"><a href="/?series=${dd.series}">${e(code(dd))}</a><span>${e(dd.industry)}</span><span>${e(status(dd))}${dd.published ? `, ${dd.minutes} min read` : ''}</span></p>
        <h1>${e(dd.title)}</h1>
        <p class="dd-dek">${e(dd.dek)}</p>
      </div>
      ${logoBox(dd, 'dd-logo')}
    </div>
  </header>
  <div class="dd-sheet">${sheet}</div>
</article>`;
}

function essayArticle(es) {
  let sheet;
  if (es.published) {
    const { preview, rest } = splitEssay(renderMarkdown(es.essay).html);
    const mode = es.readUrl ? 'redirect' : 'unlock';
    sheet = `<div class="prose preview-text">${preview}</div>
    <div class="gate" data-gate data-mode="${mode}"${es.readUrl ? ` data-read-url="${e(es.readUrl)}"` : ''} style="${ESSAY_VARS}">
      <h2>Keep reading</h2>
      <p>Enter your email to read the rest of this essay. You'll also get new essays and deep dives the day they're published.</p>
      ${subForm({ id: `gate-${es.slug}`, button: 'Read the rest', mode, source: `essay-${es.slug}` })}
      <p class="gate-fine">Free. Unsubscribe anytime.</p>
    </div>
    ${es.readUrl ? '' : `<div class="prose essay-rest" data-rest hidden>${rest}</div>`}`;
  } else {
    sheet = `<div class="gate" data-gate data-mode="notify" style="${ESSAY_VARS}">
      <h2>This essay is in research</h2>
      <p>Enter your email and it arrives the day it's published.</p>
      ${subForm({ id: `gate-${es.slug}`, button: 'Notify me', mode: 'notify', source: `essay-${es.slug}` })}
      <p class="gate-fine">Free. Unsubscribe anytime.</p>
    </div>`;
  }
  return `<article class="dd essay" data-dd="${es.slug}">
  <header class="dd-head essay-head" style="${ESSAY_VARS}">
    <p class="crumb"><a href="/essays">Essays</a><span>${es.published ? `${e(fmtDate(es.date))}, ${es.minutes} min read` : 'In research'}</span></p>
    <h1>${e(es.title)}</h1>
    ${es.dek ? `<p class="dd-dek">${e(es.dek)}</p>` : ''}
  </header>
  <div class="dd-sheet">${sheet}</div>
</article>`;
}

function essayPage(es) {
  const related = ESSAYS.filter((x) => x !== es).slice(0, 6);
  return layout({
    title: es.title, description: es.dek || `${es.title}: an essay from ${cfg.name}.`, pathName: essayUrl(es), searchIn: 'essays',
    body: `<div class="dd-page">${essayArticle(es)}</div>
<section class="related essays-related"><h2>More essays</h2>
<ul class="essay-list">${related.map((x) => `<li><a href="${essayUrl(x)}" data-preview>${e(x.title)}</a></li>`).join('')}</ul></section>`,
  });
}

function deepDivePage(dd) {
  const related = DD.filter((d) => d !== dd && (d.series === dd.series || d.industry === dd.industry))
    .sort((a, b) => (b.industry === dd.industry) - (a.industry === dd.industry)).slice(0, 6);
  return layout({
    title: dd.title, description: dd.dek, pathName: url(dd),
    body: `<div class="dd-page">${deepDiveArticle(dd)}</div>
<section class="related"><h2>Related deep dives</h2><ul class="grid">${related.map(card).join('')}</ul></section>`,
  });
}

// ------------------------------------------------------------------ simple pages
function prosePage({ title, pathName, description, lede, html }) {
  return layout({ title, pathName, description, body: `<section class="page-head wrap"><h1>${e(title)}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</section>
<section class="wrap"><div class="prose prose-page">${html}</div></section>` });
}
const about = () => prosePage({
  title: 'About', pathName: '/about', description: `About ${cfg.name}.`, lede: e(cfg.tagline),
  html: `${(cfg.bio || []).map((p) => `<p>${e(p)}</p>`).join('\n')}
<h2>Why ${e(cfg.name)}</h2>
<p>${e(cfg.intro)}</p>
<p>Information about B2B growth is everywhere. Judgment is scarce: which signals matter, why a system that looks healthy stops producing pipeline, and what to fix first. Each piece is written for someone about to make that call.</p>
<h2>Deep dives and essays</h2>
<p>The deep dives take one company's growth machine apart at a time: the decisions that mattered, how the go-to-market was built, and the mechanism underneath. The essays use that evidence to explain how buyers decide and why pipeline breaks.</p>
<h2>How they're researched</h2>
<p>Public sources only: filings, earnings calls, interviews, investor letters, and independent reporting. Every figure is sourced, and interpretation is kept separate from fact. Company names and logos identify the subject of each deep dive and don't imply endorsement.</p>`,
});
const advisory = () => prosePage({
  title: 'Work with me', pathName: '/advisory', description: 'Advisory work on positioning, paid social, and pipeline.',
  lede: 'For the problems that decide growth. A small number of engagements each year.',
  html: `<p>Most growth problems get treated as channel problems: more spend, a new agency, better creative. Usually the real constraint sits elsewhere: positioning, targeting, how leads are handled, or incentives between marketing and sales. The work starts by finding it.</p>
<h2>How an engagement runs</h2>
<ol class="steps"><li><strong>Diagnose.</strong> Find where growth or pipeline is actually breaking, and why.</li><li><strong>Define.</strong> Decide what buyers need to believe, and what has to change to get there.</li><li><strong>Deploy.</strong> Put that narrative into the market through the channels that reach the buyer.</li><li><strong>Refine.</strong> Adjust against business outcomes, not clicks or lead counts.</li></ol>
${cfg.contactEmail ? `<p><a class="btn" href="mailto:${e(cfg.contactEmail)}?subject=Advisory">Get in touch</a></p>` : ''}`,
});
const subscribePage = () => layout({ title: 'Subscribe', pathName: '/subscribe', description: `Subscribe to ${cfg.name}.`,
  body: `<section class="page-head wrap narrow"><h1>${e(cfg.signupHeadline)}</h1><p class="lede">${e(cfg.signupText)}</p>${subForm({ id: 'page-email', source: 'subscribe-page' })}</section>` });
const simple = (title, pathName, html) => layout({ title, pathName, body: `<section class="page-head wrap narrow">${html}</section>` });

// ------------------------------------------------------------------ write
fs.rmSync(DIST, { recursive: true, force: true });
const write = (rel, content) => { const p = path.join(DIST, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); };
write('index.html', layout({ body: tabs('deep-dives') + grid(), isHome: true }));
write('essays.html', layout({ title: 'Essays', pathName: '/essays', description: `Essays on how B2B buyers decide, where pipeline breaks, and what drives growth.`, searchIn: 'essays', body: tabs('essays') + essayList() }));
ESSAYS.forEach((x) => write(`essays/${x.slug}.html`, essayPage(x)));
DD.forEach((d) => write(`deep-dives/${d.slug}.html`, deepDivePage(d)));
write('about.html', about());
write('advisory.html', advisory());
write('subscribe.html', subscribePage());
write('welcome.html', simple('Subscribed', '/welcome', `<h1>You're subscribed</h1><p class="lede">The next ${e(cfg.name)} will arrive at the address you gave.</p><p><a class="textlink" href="/">Back to the deep dives</a></p>`));
write('404.html', simple('Page not found', '/404', `<h1>That page doesn't exist</h1><p class="lede">The link may be old, or the deep dive may have moved.</p><p><a class="textlink" href="/">Browse all deep dives</a></p>`));
write('styles.css', css);
write('site.js', js);
const live = [...DD.filter((d) => d.published), ...ESSAYS.filter((x) => x.published).map((x) => ({ ...x, dek: x.dek || x.title, slug: x.slug, isEssay: true }))];
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${e(cfg.name)}</title><link>${e(cfg.url)}</link><description>${e(cfg.description)}</description>
${live.map((d) => `<item><title>${e(d.title)}</title><link>${e(cfg.url + (d.isEssay ? essayUrl(d) : url(d)))}</link><guid>${e(cfg.url + (d.isEssay ? essayUrl(d) : url(d)))}</guid><pubDate>${new Date(`${d.date}T12:00:00Z`).toUTCString()}</pubDate><description>${e(d.dek)}</description></item>`).join('\n')}
</channel></rss>`);
const pages = ['', '/essays', '/about', '/advisory', '/subscribe', ...DD.map(url), ...ESSAYS.map(essayUrl)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((p) => `<url><loc>${e(cfg.url + p)}</loc></url>`).join('')}</urlset>`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${cfg.url}/sitemap.xml\n`);
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
const local = DD.filter((d) => d.logoLocal).length, remote = DD.filter((d) => d.logo && !d.logoLocal).length;
console.log(`Built ${DD.length} deep dives (${live.length} published). Logos: ${local} local, ${remote} from Brandfetch, ${DD.length - local - remote} showing names.`);
