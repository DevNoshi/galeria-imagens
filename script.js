(() => {
  const items = [...document.querySelectorAll('.gallery-item')];
  const chips = [...document.querySelectorAll('.chip')];
  const lb = document.querySelector('.lightbox');
  const img = lb.querySelector('.lightbox-img');
  const cap = lb.querySelector('.lightbox-cap');
  const count = lb.querySelector('.lightbox-count');
  const controls = [lb.querySelector('.close-lightbox'), lb.querySelector('.prev'), lb.querySelector('.next')];
  let list = [], current = 0, opener = null;

  const visible = () => [...document.querySelectorAll('.mode:not([hidden]) .gallery-item')]
    .filter(i => !i.hidden && !i.classList.contains('off'));
  const srcOf = i => i.dataset.full || i.querySelector('img').currentSrc || i.querySelector('img').src;
  const safe = u => /^https:\/\/unsplash\.com\//.test(u || '');
  function setCaption(i) {
    cap.replaceChildren();
    if (i.dataset.credit) {
      const a = document.createElement('a'), p = document.createElement('a');
      a.textContent = i.dataset.credit; p.textContent = i.dataset.source;
      if (safe(i.dataset.creditUrl)) a.href = i.dataset.creditUrl;
      if (safe(i.dataset.sourceUrl)) p.href = i.dataset.sourceUrl;
      [a, p].forEach(l => { l.target = '_blank'; l.rel = 'noopener noreferrer'; });
      cap.append('Foto de ', a, ' no ', p);
    } else {
      cap.textContent = `${i.dataset.label} · ${i.querySelector('img').alt}`;
    }
  }

  // Contagem em cada filtro
  chips.forEach(c => {
    const f = c.dataset.filter;
    const n = f === 'all' ? items.length : items.filter(i => i.classList.contains(f)).length;
    const s = document.createElement('span'); s.className = 'n'; s.textContent = n;
    c.append(s);
  });

  // Filtro com transição suave
  function applyFilter(f) {
    chips.forEach(c => {
      const on = c.dataset.filter === f;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on);
    });
    items.forEach(i => {
      const show = f === 'all' || i.classList.contains(f);
      if (show) {
        i.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => i.classList.remove('off')));
      } else {
        i.classList.add('off');
        setTimeout(() => { if (i.classList.contains('off')) i.hidden = true; }, 350);
      }
    });
  }
  document.querySelector('.filters').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (c) applyFilter(c.dataset.filter);
  });

  // Lightbox
  function show() {
    img.src = srcOf(list[current]);
    img.alt = list[current].querySelector('img').alt;
    setCaption(list[current]);
    document.dispatchEvent(new CustomEvent('lightbox:show', { detail: list[current] }));
    count.textContent = `${current + 1} / ${list.length}`;
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    lb.classList.toggle('single', list.length < 2);
    [-1, 1].forEach(d => { // pré-carrega vizinhas
      new Image().src = srcOf(list[(current + d + list.length) % list.length]);
    });
  }
  function open(item) {
    list = visible(); current = list.indexOf(item); opener = item;
    show();
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    controls[0].focus();
  }
  function close() {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (opener) opener.focus();
  }
  const step = d => { current = (current + d + list.length) % list.length; show(); };

  document.addEventListener('click', e => { const i = e.target.closest('.gallery-item'); if (i) open(i); });
  controls[0].addEventListener('click', close);
  controls[1].addEventListener('click', () => step(-1));
  controls[2].addEventListener('click', () => step(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') { // mantém o foco dentro do lightbox
      const act = controls.filter(b => getComputedStyle(b).display !== 'none');
      const i = act.indexOf(document.activeElement);
      e.preventDefault();
      act[(i + (e.shiftKey ? -1 : 1) + act.length) % act.length].focus();
    }
  });

  // Deslizar no celular
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50 && list.length > 1) step(dx < 0 ? 1 : -1);
  });

  // Luz que segue o cursor (só com mouse)
  const glow = document.querySelector('.glow');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let tx = innerWidth / 2, ty = innerHeight / 3, gx = tx, gy = ty;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    })();
  }
})();
