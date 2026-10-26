(() => {
  const cfg = window.UNSPLASH_CONFIG || {};
  const $ = id => document.getElementById(id);
  const form = $('searchForm'), input = $('searchInput'), grid = $('remoteGrid');
  const status = $('status'), more = $('moreBtn'), quick = $('quick');
  const PER = 24, UTM = 'utm_source=galeria-de-imagens&utm_medium=referral';
  const tracked = new Set();
  let state = { query: '', label: '', page: 1, loading: false, started: false };

  const configured = () => cfg.accessKey || cfg.proxyUrl;
  const withUtm = u => u + (u.includes('?') ? '&' : '?') + UTM;
  const headers = () => cfg.proxyUrl ? {} : { Authorization: `Client-ID ${cfg.accessKey}`, 'Accept-Version': 'v1' };

  // Abas: minhas fotos / Unsplash
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => {
      const on = x === t;
      x.classList.toggle('active', on); x.setAttribute('aria-selected', on);
      $('mode-' + x.dataset.mode).hidden = !on;
    });
    if (t.dataset.mode === 'remote' && !state.started) {
      state.started = true;
      search('nature', 'Natureza');
    }
  }));

  async function fetchPage(query, page) {
    const cacheKey = `us:${query}:${page}`;
    try { const c = sessionStorage.getItem(cacheKey); if (c) return JSON.parse(c); } catch {}
    const params = `query=${encodeURIComponent(query)}&per_page=${PER}&page=${page}&lang=pt`;
    const url = cfg.proxyUrl ? `${cfg.proxyUrl}?${params}` : `https://api.unsplash.com/search/photos?${params}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }

  // Aviso de download exigido pelas regras do Unsplash, uma vez por foto aberta
  document.addEventListener('lightbox:show', e => {
    const loc = e.detail.dataset.download;
    if (!loc || tracked.has(loc)) return;
    tracked.add(loc);
    const url = cfg.proxyUrl ? `${cfg.proxyUrl}?action=download&url=${encodeURIComponent(loc)}` : loc;
    fetch(url, { headers: headers() }).catch(() => {});
  });

  function skeletons(n) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'skeleton'; s.dataset.sk = '1'; grid.append(s);
    }
  }
  const clearSkeletons = () => grid.querySelectorAll('[data-sk]').forEach(s => s.remove());

  function tile(p) {
    const b = document.createElement('button');
    b.className = 'gallery-item';
    b.dataset.label = p.user.name;
    b.dataset.full = p.urls.regular;
    b.dataset.credit = p.user.name;
    b.dataset.creditUrl = withUtm(p.user.links.html);
    b.dataset.source = 'Unsplash';
    b.dataset.sourceUrl = withUtm('https://unsplash.com/');
    b.dataset.download = p.links.download_location;
    b.style.background = p.color || '';
    const im = document.createElement('img');
    im.src = p.urls.small; im.loading = 'lazy';
    im.alt = p.alt_description || `Foto de ${p.user.name}`;
    b.append(im);
    return b;
  }

  const message = t => { status.textContent = t; };

  async function load(reset) {
    if (state.loading) return;
    if (!configured()) { message('Adicione sua Access Key do Unsplash (ou a URL do proxy) em config.js para ativar a busca.'); return; }
    state.loading = true; more.hidden = true;
    if (reset) { grid.replaceChildren(); state.page = 1; }
    skeletons(reset ? 8 : 4);
    message('Buscando…');
    try {
      const d = await fetchPage(state.query, state.page);
      clearSkeletons();
      d.results.forEach(p => grid.append(tile(p)));
      if (!grid.children.length) message(`Nenhuma foto encontrada para “${state.label}”. Tente outro termo.`);
      else message(`${d.total.toLocaleString('pt-BR')} resultados para “${state.label}”`);
      more.hidden = state.page >= d.total_pages;
    } catch (e) {
      clearSkeletons();
      message(e.message === '403' || e.message === '429' ? 'O limite de buscas por hora do Unsplash foi atingido. Tente de novo mais tarde.'
        : e.message === '401' ? 'Access Key inválida. Confira o config.js.'
        : 'Não foi possível buscar as fotos. Verifique sua conexão e tente novamente.');
    } finally { state.loading = false; }
  }

  function search(q, label) {
    q = q.trim(); if (!q) { input.focus(); return; }
    state.query = q; state.label = label || q; input.value = state.label;
    quick.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.q === q));
    load(true);
  }

  form.addEventListener('submit', e => { e.preventDefault(); search(input.value); });
  quick.addEventListener('click', e => { const p = e.target.closest('.pill'); if (p) search(p.dataset.q, p.textContent); });
  more.addEventListener('click', () => { state.page++; load(false); });
})();
