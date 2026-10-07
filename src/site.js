// Progressive enhancement: without JavaScript every link opens its page and every form posts normally.
(function () {
  var KEY = 'dd-subscribed';
  var store = {
    get: function (s, k) { try { return s.getItem(k); } catch (e) { return null; } },
    set: function (s, k, v) { try { s.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  var isSubscribed = function () { return store.get(localStorage, KEY) === '1'; };
  var root = document.documentElement;

  // ---------------------------------------------------------- gates
  var unlock = function (gate) {
    var article = gate.closest('[data-dd]') || document;
    var rest = article.querySelector('[data-rest]');
    if (rest) rest.hidden = false;
    gate.hidden = true;
    var fade = article.querySelector('.preview-text');
    if (fade) fade.classList.add('is-open');
  };
  var applySubscribed = function (scope) {
    if (!isSubscribed()) return;
    scope.querySelectorAll('[data-gate]').forEach(function (gate) {
      var mode = gate.getAttribute('data-mode');
      if (mode === 'unlock') unlock(gate);
      if (mode === 'redirect') gate.innerHTML = '<h2>Keep reading</h2><p>You\u2019re subscribed, so the full deep dive is yours.</p><a class="btn" href="' + gate.getAttribute('data-read-url') + '">Read the rest</a>';
      if (mode === 'notify') gate.innerHTML = '<h2>You\u2019re on the list</h2><p>This deep dive will arrive in your inbox the day it\u2019s published.</p>';
    });
  };

  // ---------------------------------------------------------- floating signup pill
  var float = document.querySelector('[data-float]');
  var floatAway = {};
  var setFloat = function () {
    if (!float) return;
    var away = Object.keys(floatAway).some(function (k) { return floatAway[k]; });
    float.classList.toggle('is-away', away);
  };
  if (float) {
    if (isSubscribed() || store.get(sessionStorage, 'float-dismissed')) float.remove();
    else {
      float.hidden = false;
      float.querySelector('[data-float-close]').addEventListener('click', function () {
        store.set(sessionStorage, 'float-dismissed', '1');
        floatAway.dismissed = true; setFloat();
      });
      // Step aside while another signup form is on screen, so they never compete.
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { floatAway[en.target.dataset.watch] = en.isIntersecting; });
          setFloat();
        }, { rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('[data-band], .dd-page [data-gate]').forEach(function (el, i) { el.dataset.watch = 'w' + i; io.observe(el); });
      }
    }
  }

  // ---------------------------------------------------------- email forms (delegated, so forms inside panels work too)
  document.addEventListener('submit', function (ev) {
    var form = ev.target.closest('[data-sub-form]');
    if (!form) return;
    ev.preventDefault();
    if (!form.reportValidity()) return;
    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector('.form-status');
    var data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true; button.textContent = 'Subscribing\u2026';
    status.className = 'form-status'; status.textContent = '';
    fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.body.error || 'That didn\u2019t go through. Check your email address and try again.');
        store.set(localStorage, KEY, '1');
        var mode = form.getAttribute('data-mode');
        var gate = form.closest('[data-gate]');
        if (mode === 'unlock' && gate) { unlock(gate); }
        else if (mode === 'redirect' && gate) { location.href = gate.getAttribute('data-read-url'); return; }
        else {
          var msg = mode === 'notify' ? 'You\u2019re on the list. This deep dive arrives in your inbox the day it\u2019s published.' : 'You\u2019re subscribed. Check your inbox for a confirmation.';
          form.outerHTML = '<p class="form-done" role="status">' + msg + '</p>';
        }
        if (float && !form.closest('[data-float]')) { floatAway.subscribed = true; setFloat(); }
        if (float && form.closest('[data-float]')) setTimeout(function () { floatAway.subscribed = true; setFloat(); }, 2600);
      })
      .catch(function (err) {
        status.className = 'form-status error';
        status.textContent = err.message && err.message !== 'Failed to fetch' ? err.message : 'That didn\u2019t go through because the connection dropped. Try again.';
        button.disabled = false; button.textContent = button.getAttribute('data-label');
      });
  });

  // ---------------------------------------------------------- panels
  var openDialog = function (d) { if (!d.open) { d.showModal(); root.classList.add('modal-open'); } };
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('close', function () { root.classList.remove('modal-open'); });
    d.addEventListener('click', function (ev) { if (ev.target === d) d.close(); });
  });
  document.addEventListener('click', function (ev) {
    var x = ev.target.closest('[data-close]');
    if (x) { x.closest('dialog').close(); return; }
    var sub = ev.target.closest('[data-open-subscribe]');
    if (sub) {
      ev.preventDefault();
      var m = document.getElementById('subscribe-modal');
      openDialog(m);
      var input = m.querySelector('input[type="email"]');
      if (input) input.focus();
      return;
    }
    if (ev.target.closest('[data-open-menu]')) openDialog(document.getElementById('menu-modal'));
  });

  // Deep-dive preview: fetch the deep-dive page and show its article in a panel.
  var preview = document.getElementById('preview-modal');
  var previewBody = preview && preview.querySelector('[data-preview-body]');
  var baseUrl = location.pathname + location.search, baseTitle = document.title;
  var openPreview = function (href, push) {
    previewBody.innerHTML = '<p class="loading">Loading\u2026</p>';
    openDialog(preview);
    preview.scrollTop = 0;
    fetch(href).then(function (r) { if (!r.ok) throw new Error(); return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var article = doc.querySelector('[data-dd]');
      if (!article) throw new Error();
      previewBody.innerHTML = '';
      previewBody.appendChild(document.importNode(article, true));
      var more = document.createElement('p');
      more.className = 'open-page';
      more.innerHTML = '<a class="textlink" href="' + href + '">Open as a full page</a>';
      previewBody.appendChild(more);
      applySubscribed(previewBody);
      document.title = doc.title;
      if (push) history.pushState({ preview: href }, '', href);
      var h = previewBody.querySelector('h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }).catch(function () { location.href = href; });
  };
  if (preview) {
    document.addEventListener('click', function (ev) {
      var a = ev.target.closest('a[data-preview]');
      if (!a || ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      openPreview(a.getAttribute('href'), true);
    });
    preview.addEventListener('close', function () {
      if (history.state && history.state.preview) history.pushState(null, '', baseUrl);
      document.title = baseTitle;
    });
    window.addEventListener('popstate', function (ev) {
      if (ev.state && ev.state.preview) openPreview(ev.state.preview, false);
      else if (preview.open) preview.close();
    });
  }

  applySubscribed(document);
  var menu = document.getElementById('menu-modal');
  if (menu) menu.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href]');
    if (a && !ev.defaultPrevented) setTimeout(function () { if (menu.open) menu.close(); }, 0);
  });

  // ---------------------------------------------------------- search and filters (both tabs)
  var gridEl = document.querySelector('[data-grid]');
  var searchForm = document.querySelector('[data-search]');
  var q = searchForm && searchForm.querySelector('input');
  var isHome = document.querySelector('[data-filterable]');
  var params = new URLSearchParams(location.search);
  if (q && params.get('q')) q.value = params.get('q');
  if (!isHome) return;

  var cards = gridEl ? Array.prototype.slice.call(gridEl.children) : Array.prototype.slice.call(isHome.querySelectorAll('li[data-search]'));
  var active = document.querySelector('[data-active]');
  var activeLabel = document.querySelector('[data-active-label]');
  var activeCount = document.querySelector('[data-active-count]');
  var emptyEl = document.querySelector('[data-empty]');
  var state = { q: params.get('q') || '', series: params.get('series') || '', industry: params.get('industry') || '' };
  var seriesName = function (slug) {
    var a = document.querySelector('#menu-modal a[href="/?series=' + slug + '"]');
    return a ? a.textContent : slug;
  };
  var apply = function (push) {
    var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
    cards.forEach(function (c) {
      var ok = (!state.series || c.getAttribute('data-series') === state.series) &&
        (!state.industry || c.getAttribute('data-industry') === state.industry) &&
        terms.every(function (t) { return c.getAttribute('data-search').indexOf(t) !== -1; });
      c.hidden = !ok; if (ok) shown++;
    });
    var labels = [];
    if (state.series) labels.push(seriesName(state.series));
    if (state.industry) labels.push(state.industry);
    if (state.q) labels.push('\u201c' + state.q + '\u201d');
    active.hidden = labels.length === 0 || shown === 0;
    activeLabel.textContent = labels.join(', ');
    activeCount.textContent = '(' + shown + ')';
    emptyEl.hidden = shown > 0;
    if (push) {
      var p = new URLSearchParams();
      if (state.q) p.set('q', state.q);
      if (state.series) p.set('series', state.series);
      if (state.industry) p.set('industry', state.industry);
      var qs = p.toString();
      baseUrl = location.pathname + (qs ? '?' + qs : '');
      history.replaceState(null, '', baseUrl);
    }
  };
  searchForm.addEventListener('submit', function (ev) { ev.preventDefault(); q.blur(); });
  q.addEventListener('input', function () { state.q = q.value.trim(); apply(true); });
  document.querySelectorAll('[data-reset]').forEach(function (b) {
    b.addEventListener('click', function () { state = { q: '', series: '', industry: '' }; q.value = ''; apply(true); });
  });
  // Menu links filter in place on the deep-dives tab instead of reloading.
  document.getElementById('menu-modal').addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="/?"]');
    if (!a || !gridEl) return;
    ev.preventDefault();
    var p = new URLSearchParams(a.getAttribute('href').slice(1));
    state = { q: '', series: p.get('series') || '', industry: p.get('industry') || '' };
    q.value = '';
    apply(true);
    document.getElementById('menu-modal').close();
    window.scrollTo({ top: 0 });
  });
  apply(false);
})();

// Tabs: slide the thumb like an iOS segmented control. Where cross-document view transitions
// are supported, the browser carries the thumb across the page change; elsewhere it slides first.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var crossDoc = 'onpagereveal' in window;
  var tabNav = false;
  // Only tab switches get the page transition; every other navigation stays instant.
  window.addEventListener('pageswap', function (e) { if (e.viewTransition && (!tabNav || reduce)) e.viewTransition.skipTransition(); });
  var track = document.querySelector('.tabs-track');
  if (!track) return;
  var current = track.getAttribute('data-current');
  track.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-tab]');
    if (!a || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    if (a.getAttribute('data-tab') === current) { ev.preventDefault(); return; }
    tabNav = true;
    if (crossDoc && !reduce) return;
    ev.preventDefault();
    track.setAttribute('data-current', a.getAttribute('data-tab'));
    setTimeout(function () { location.href = a.href; }, reduce ? 0 : 300);
  });
  // Coming back via the back button: restore the thumb to this page's tab.
  window.addEventListener('pageshow', function (e) { if (e.persisted) { tabNav = false; track.setAttribute('data-current', current); } });
})();
