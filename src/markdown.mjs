// A small Markdown renderer covering what memos use: headings, paragraphs,
// bold, italic, links, lists, blockquotes (rendered as pull lines), rules,
// a {{diagram}} placeholder for the memo's diagram, and {{figure:name | caption}}
// lines, which pull in a figure through the `figure` resolver.

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const ext = /^https?:/.test(u);
      return `<a href="${u}"${ext ? ' rel="noopener" target="_blank"' : ''}>${t}</a>`;
    });
}

export function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v)) v = Number(v);
    data[k] = v;
  }
  return { data, body: src.slice(m[0].length) };
}

export function renderMarkdown(src, { diagram = '', figure = null } = {}) {
  const lines = src.split(/\r?\n/);
  const out = [];
  let i = 0;
  const h2s = [];
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.trim() === '{{diagram}}') {
      if (diagram) out.push(`<figure class="memo-figure bp">${diagram}</figure>`);
      i++; continue;
    }
    let m;
    if ((m = line.trim().match(/^\{\{figure:([a-z0-9-]+)(?:\s*\|\s*(.+?))?\}\}$/i))) {
      const html = figure ? figure(m[1]) : '';
      if (html) out.push(`<figure class="dd-figure" data-figure="${m[1]}">${html}${m[2] ? `<figcaption>${inline(m[2])}</figcaption>` : ''}</figure>`);
      i++; continue;
    }
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      const level = m[1].length;
      const id = m[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (level === 2) h2s.push({ id, text: m[2] });
      out.push(`<h${level} id="${id}">${inline(m[2])}</h${level}>`);
      i++; continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { out.push('<hr>'); i++; continue; }
    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote class="pull"><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items = [];
      while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i]))) {
        items.push(`<li>${inline(lines[i++].replace(/^([-*]|\d+\.)\s+/, ''))}</li>`);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>|[-*]\s|\d+\.\s|\{\{diagram\}\}|\{\{figure:)/.test(lines[i].trim())) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return { html: out.join('\n'), headings: h2s };
}
