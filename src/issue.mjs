// Renders a monthly issue (content/issues/<slug>.json) into a standalone HTML page.
// Pure function with no Node APIs, so build.mjs and tools/issue-preview.html can both run it.
//
// Layout: the cover and back cover stand alone; every other page pairs into a spread.
// Wide screens see spreads side by side (src/issue.css, "magazine mode"); phones get the
// same pages stacked. Image-led "poster" pages keep the page shape on phones; text pages
// reflow at normal reading size.
import { renderMarkdown, escapeHtml as e } from './markdown.mjs';

const md = (s) => renderMarkdown(s || '').html;

function logo(dive, cls) {
  if (!dive) return '';
  const onerr = `if(this.dataset.alt){this.src=this.dataset.alt;this.removeAttribute('data-alt')}else{this.closest('[data-logo-box]').classList.add('no-logo');this.remove()}`;
  return `<span class="${cls}${dive.logo ? '' : ' no-logo'}${dive.logoMono ? ' is-mono' : ''}" data-logo-box>
    ${dive.logo ? `<img src="${e(dive.logo)}"${dive.logoAlt ? ` data-alt="${e(dive.logoAlt)}"` : ''} alt="${e(dive.company)}" decoding="async" onerror="${onerr}">` : ''}
    <span class="logo-name">${e(dive.company)}</span>
  </span>`;
}

const barcode = (label) => `<span class="barcode" aria-hidden="true"><span class="bars"></span><span class="code">${e(label)}</span></span>`;
const bleed = (x, src, alt = '') => `<div class="bleed"><img src="${e(x.asset(src))}" alt="${e(alt)}" decoding="async"></div>`;
const polaroid = (x, src, caption, cls = '') => `<figure class="polaroid ${cls}"><span class="tape" aria-hidden="true"></span><img src="${e(x.asset(src))}" alt="" decoding="async"><figcaption>${e(caption)}</figcaption></figure>`;
const scriptTitle = (title, script, cls = 'disp') => `<h2 class="${cls}">${e(title)} <span class="script">${e(script)}</span></h2>`;

const PAGES = {
  cover(p, x) {
    return `${bleed(x, p.image)}<div class="shade shade--cover"></div>
    <div class="pg-in">
      <p class="cv-mast">${e(x.cfg.name)}</p>
      <p class="cv-date"><span>${e(x.issue.title)}</span><span>No. ${String(x.issue.number).padStart(2, '0')}</span><span>${e(x.issue.year)}</span></p>
      <ul class="cv-lines">${p.lines.map((l) => `<li><span class="k">${e(l.kicker)}</span>${e(l.text)}</li>`).join('')}</ul>
      <div class="cv-foot">
        <div class="cv-star"><p class="cv-name">${e(p.star)}</p><p class="cv-line">${e(p.starLine)}</p></div>
        ${barcode(`${x.issue.month.slice(0, 3).toUpperCase()} ${x.issue.year}`)}
      </div>
      ${p.pending ? `<p class="pending">${e(p.pending)}</p>` : ''}
    </div>`;
  },
  contents(p, x) {
    const rows = x.toc.map((t) => `<li><a href="#p${t.n}" data-goto="${t.n}"><span class="n">${t.n}</span><span class="t"><strong>${e(t.toc)}</strong>${t.tocText ? `<em>${e(t.tocText)}</em>` : ''}</span></a></li>`).join('');
    return `<div class="pg-in">
      <p class="script ct-script">this month</p>
      <h2 class="disp ct-title">Contents</h2>
      <ol class="toc">${rows}</ol>
      <div class="ct-pics">${(p.polaroids || []).map((q, i) => polaroid(x, q.image, q.caption, `pol-${i + 1}`)).join('')}</div>
    </div>`;
  },
  note(p, x) {
    return `<div class="pg-in">
      <p class="kicker">Editor’s <span class="script">note</span></p>
      <h2 class="disp nt-title">${e(p.title)}</h2>
      <div class="prose drop">${p.image ? polaroid(x, p.image, p.caption, 'nt-pol') : ''}${md(p.body)}</div>
      <p class="sign script">${e(p.sign)}</p>
    </div>`;
  },
  open(p, x) {
    const d = x.dive(p.dive);
    return `${bleed(x, p.image)}<div class="shade shade--open"></div>
    <div class="pg-in">
      <div class="op-top"><p class="kicker">${e(p.kicker)}</p>${logo(d, 'op-logo')}</div>
      <div><h2 class="op-head">${e(d.title)}</h2><p class="op-dek">${e(p.dek)}</p></div>
    </div>`;
  },
  text(p, x) {
    const src = p.dive ? x.dive(p.dive) : x.essay(p.essay);
    return `<div class="pg-in">
      <p class="kicker">${e(p.kicker)}</p>
      ${p.title ? `<h2 class="tx-head">${e(p.title)}</h2>` : ''}
      ${p.pull ? `<blockquote class="pull">${e(p.pull)}</blockquote>` : ''}
      <div class="prose cols drop">${md(p.body)}</div>
      <a class="more" href="${e(src.url)}">${e(p.more)} <span aria-hidden="true">→</span></a>
    </div>`;
  },
  profile(p) {
    return `<div class="pg-in">
      <p class="kicker">Who’s that <span class="script">founder?</span></p>
      <figure class="polaroid pf-portrait"><span class="tape" aria-hidden="true"></span><span class="pf-slot" role="img" aria-label="Portrait placeholder"><span>Portrait</span></span><figcaption>${e(p.pending)}</figcaption></figure>
      <p class="pf-name">${e(p.name)} <em>${e(p.pos)}</em></p>
      <ol class="defs">${p.defs.map((d) => `<li>${e(d)}</li>`).join('')}</ol>
      <blockquote class="pf-quote">“${e(p.quote)}”</blockquote>
    </div>`;
  },
  machine(p) {
    return `<div class="pg-in">
      ${scriptTitle(p.title, p.script, 'disp mc-title')}
      <ol class="parts">${p.items.map((it, i) => `<li><span class="n">${i + 1}.</span><strong>${e(it.title)}</strong><p>${e(it.text)}</p></li>`).join('')}</ol>
    </div>`;
  },
  moodboard(p, x) {
    return `${bleed(x, p.image)}
    <div class="pg-in">
      ${scriptTitle(p.title, p.script, 'disp mb-title')}
      <p class="mb-sub">${e(p.sub)}</p>
      <ul class="mb-notes">${p.notes.map((n, i) => `<li class="mb-n mb-${i + 1}"><span class="yr">${e(n.year)}</span>“${e(n.text)}”</li>`).join('')}</ul>
      <p class="src mb-src">${e(p.source)}</p>
    </div>`;
  },
  quotes(p) {
    return `<div class="pg-in">
      ${scriptTitle(p.title, p.script, 'disp qt-title')}
      <ul class="clips">${p.quotes.map((q, i) => `<li class="clip clip-${i + 1}"><q>${e(q.text)}</q><span>${e(q.by)}</span></li>`).join('')}</ul>
      <p class="src">${e(p.note)}</p>
    </div>`;
  },
  word(p, x) {
    return `${bleed(x, p.image)}<div class="shade shade--word"></div>
    <div class="pg-in">
      <p class="kicker">Word of the month</p>
      <p class="wd">${e(p.word)}</p>
      <p class="wd-meta"><span>[${e(p.pron)}]</span> <em>${e(p.pos)}</em></p>
      <div class="wd-panel">
        <ol class="defs">${p.defs.map((d) => `<li>${e(d)}</li>`).join('')}</ol>
        <p class="wd-note">${e(p.note)} <span class="src">${e(p.source)}</span></p>
      </div>
    </div>`;
  },
  photo(p, x) {
    return `${bleed(x, p.image)}<div class="shade shade--photo"></div>
    <div class="pg-in"><h2 class="ph-title"><span class="script">${e(p.script)}</span> ${e(p.title)}</h2></div>`;
  },
  letter(p) {
    return `<div class="pg-in">
      <h2 class="disp lt-title">${e(p.title)}</h2>
      <div class="prose letter">${md(p.body)}</div>
      <p class="sign script">${e(p.sign)}</p>
    </div>`;
  },
  back(p, x) {
    return `<div class="pg-in">
      <p class="bk-mast">${e(x.cfg.name)}</p>
      <p class="bk-line">${e(p.line)}</p>
      <p class="bk-theme">${e(x.issue.theme)}</p>
      <div class="bk-foot">
        <div><p class="kicker">${e(p.next)}</p><a class="bk-cta" href="${e(p.href)}">${e(p.cta)} <span aria-hidden="true">→</span></a></div>
        ${barcode(`No. ${String(x.issue.number).padStart(2, '0')}`)}
      </div>
    </div>`;
  },
};

// Image-led pages keep the page shape on phones, like a poster.
const POSTER = new Set(['cover', 'open', 'moodboard', 'word', 'photo', 'back']);

export function renderIssue(issue, { cfg, dive, essay, asset = (p) => `/${p}`, css = '/issue.css', js = '/issue.js' }) {
  const toc = issue.pages.map((p, i) => ({ ...p, n: i + 1 })).filter((p) => p.toc);
  const x = { cfg, dive, essay, asset, issue, toc };
  const last = issue.pages.length;

  const page = (p, i) => {
    const n = i + 1;
    const folio = p.type === 'cover' || p.type === 'back' ? '' : `<p class="folio"><span>${e(cfg.name)}</span><span>${e(issue.month)} ${e(issue.year)}</span><span>${n}</span></p>`;
    const d = p.type === 'open' ? dive(p.dive) : null;
    const style = d ? ` style="--bg:${d.brand.bg};--ac:${d.brand.ac}"` : '';
    return `<article class="pg pg--${p.type}${POSTER.has(p.type) ? ' poster' : ''}" id="p${n}" data-page="${n}"${style}>${PAGES[p.type](p, x)}${folio}</article>`;
  };

  // Spreads: cover alone, then pairs, then the back cover alone.
  const spreads = [[0]];
  for (let i = 1; i < last - 1; i += 2) spreads.push(i + 1 < last - 1 ? [i, i + 1] : [i]);
  spreads.push([last - 1]);
  const body = spreads.map((s) => `<section class="spread${s.length === 1 ? ' spread--single' : ''}">${s.map((i) => page(issue.pages[i], i)).join('')}</section>`).join('\n');

  const title = `${cfg.name}: ${issue.title} ${issue.year}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(title)}</title>
<meta name="robots" content="noindex">
<meta name="description" content="${e(issue.theme)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Pinyon+Script&family=IBM+Plex+Sans:wght@500;600&family=IBM+Plex+Sans+Condensed:wght@500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="${e(css)}">
</head>
<body class="issue">
<header class="iss-bar">
  <a class="iss-mark" href="/">${e(cfg.name)}</a>
  <span class="iss-label">${e(issue.title)} · ${e(issue.year)}</span>
  <span class="iss-count" data-count aria-live="polite"></span>
</header>
<main class="iss-track" data-track tabindex="-1">
${body}
</main>
<nav class="iss-nav" aria-label="Pages">
  <button type="button" data-prev aria-label="Previous pages">←</button>
  <button type="button" data-next aria-label="Next pages">→</button>
</nav>
<script src="${e(js)}" defer></script>
</body>
</html>`;
}
