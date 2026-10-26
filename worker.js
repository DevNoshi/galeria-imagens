// Cloudflare Worker: guarda a Access Key do Unsplash no servidor.
// Crie o Worker, cole este código e adicione o segredo UNSPLASH_KEY nas configurações.
const ORIGIN = 'https://github.com/DevNoshi'; // troque pelo endereço do seu site

export default {
  async fetch(req, env) {
    const q = new URL(req.url).searchParams;
    let target;
    if (q.get('action') === 'download') {
      // aviso de download exigido pelo Unsplash
      const u = q.get('url') || '';
      if (!u.startsWith('https://api.unsplash.com/photos/')) return new Response('bad request', { status: 400 });
      target = new URL(u);
    } else {
      target = new URL('https://api.unsplash.com/search/photos');
      ['query', 'page', 'lang'].forEach(k => q.has(k) && target.searchParams.set(k, q.get(k)));
      target.searchParams.set('per_page', Math.min(Number(q.get('per_page')) || 24, 30));
    }
    const r = await fetch(target, { headers: { Authorization: `Client-ID ${env.UNSPLASH_KEY}`, 'Accept-Version': 'v1' } });
    return new Response(r.body, {
      status: r.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ORIGIN,
        'Cache-Control': q.get('action') === 'download' ? 'no-store' : 'public, max-age=3600'
      }
    });
  }
};
