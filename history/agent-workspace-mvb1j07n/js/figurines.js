/* Figurine bundle: lists what drops/xenopolis_figurines_bundle.js holds, in the ☰ panel.
   The last good read is kept in memory (figBundle), so it shows at once; the 2 MB file is only opened
   when the panel opens, with a time limit, and a dropped bundle is read the same way. */
(function (A) {
  const C = window.cabinet, box = document.getElementById('figBox'); if (!box) return;
  const KEY = 'drops/xenopolis_figurines_bundle.js';
  const GROUPS = [['res_', 'Residential'], ['com_', 'Commercial'], ['ind_', 'Industry'], ['civ_', 'Civic'], ['lm_', 'Landmarks'], ['veh_', 'Vehicles'], ['cit_', 'Citizens']];
  const S = { status: '', name: KEY, models: [], bytes: 0, busy: false, retry: false, read: false, src: '' };
  // What the bundle held when this version was built (read from the store on Oct 16, 2026): shown until a live read confirms it.
  const BUILT = ('cit_blob_a 38,cit_blob_b 37,cit_blob_c 39,civ_energy_pylon 48,civ_glow_garden 40,civ_healing_bloom 61,civ_hive_council 54,civ_mist_condenser 53,civ_mist_well 29,civ_plasma_reactor 55,'
    + 'civ_star_academy 36,civ_ufo_port 61,com_holo_bazaar 41,com_mushroom_market 57,com_trade_ring 68,ind_crystal_refinery 28,ind_plasma_harvester 53,lm_monolith_echoes 34,lm_mothership_dock 72,lm_sky_whale 73,'
    + 'res_bubble_1 51,res_bubble_2 79,res_bubble_3 108,res_coralspire_1 26,res_coralspire_2 39,res_coralspire_3 54,res_sporepod_1 30,res_sporepod_2 55,res_sporepod_3 79,veh_cargo_ufo 39,veh_saucer 51')
    .split(',').map((x) => { const [id, kb] = x.split(' '); return { id, kb: +kb }; });
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ID = /^[a-z][a-z0-9_]{1,48}$/;
  try {
    const m = C && C.recall ? C.recall('figBundle', null) : null;
    if (m && Array.isArray(m.models)) { S.models = m.models.filter((x) => typeof x === 'string' && ID.test(x)).map((id) => ({ id, kb: 0 })); if (typeof m.name === 'string') S.name = m.name.slice(0, 120); S.bytes = Number.isFinite(m.bytes) ? m.bytes : 0; if (S.models.length) S.src = 'memory'; }
  } catch (e) {}
  if (!S.models.length) { S.models = BUILT; S.bytes = 2168766; S.src = 'built'; }
  // {"res_sporepod_1": "<base64 GLB>", …}: jump from key to key, so 2 MB of base64 parses in one pass.
  function parse(text) {
    const out = [], seen = new Set(), re = /"([a-z][a-z0-9]*_[a-z0-9_]+)"\s*:\s*"/g; let m;
    while ((m = re.exec(text))) {
      const end = text.indexOf('"', re.lastIndex);
      if (!seen.has(m[1])) { seen.add(m[1]); out.push({ id: m[1], kb: end > 0 ? Math.round((end - re.lastIndex) * 0.75 / 1024) : 0 }); }
      if (end > 0) re.lastIndex = end + 1;
    }
    if (!out.length) (text.match(/\b(?:res|com|ind|civ|lm|veh|cit)_[a-z0-9_]+/g) || []).forEach((id) => { if (!seen.has(id)) { seen.add(id); out.push({ id, kb: 0 }); } });
    return out;
  }
  const groupOf = (id) => { const g = GROUPS.find(([p]) => id.startsWith(p)); return g ? g[1] : 'Other'; };
  function draw() {
    const n = S.models.length, mb = S.bytes ? ' · ' + (S.bytes / 1048576).toFixed(1) + ' MB' : '';
    let h = '<div><b>' + esc(S.name.split('/').pop()) + '</b> · ' + (n ? n + ' models' + mb : esc(S.status || 'Open this panel to read it')) + '</div>';
    if (n && (S.status || S.src === 'built')) h += '<div>' + esc(S.status || 'As read when this version was built (Oct 16)') + '</div>';
    const by = {}; S.models.forEach((m) => (by[groupOf(m.id)] = by[groupOf(m.id)] || []).push(m));
    Object.keys(by).forEach((g) => { h += '<div class="g">' + g + ' · ' + by[g].length + '</div>' + by[g].map((m) => '<div class="r"><span>' + esc(m.id) + '</span><span>' + (m.kb ? m.kb + ' KB' : '') + '</span></div>').join(''); });
    if (S.retry) h += '<button id="figRetry">Try again</button>';
    box.innerHTML = h;
  }
  function take(name, text) {
    const ms = parse(text); S.busy = false; S.retry = false;
    if (!ms.length) { S.status = 'No models found in ' + name.split('/').pop(); return draw(); }
    S.name = name; S.bytes = text.length; S.models = ms; S.status = ''; S.src = 'live';
    try { C.remember('figBundle', { name, models: ms.map((m) => m.id), bytes: text.length, at: Date.now() }); } catch (e) {}
    draw();
  }
  const within = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('slow')), ms))]);
  function read() {
    if (S.busy) return; if (!C || !C.store) { S.status = 'The store is not reachable here.'; return draw(); }
    S.busy = true; S.retry = false; S.read = true; S.status = 'Checking the store for the latest copy…'; draw();
    within(Promise.resolve().then(() => C.store.get(KEY)), 25000).then((r) => {
      if (r && typeof r.text === 'string') return take(KEY, r.text);
      S.busy = false; S.status = 'No bundle in the store now: drop xenopolis_figurines_bundle.js on the game.'; draw();
    }).catch((e) => { S.busy = false; S.retry = true; S.status = e && e.message === 'slow' ? 'The store is slow to open 2 MB right now; showing the list from Oct 16.' : 'Could not read the bundle; showing the list from Oct 16.'; draw(); });
  }
  box.addEventListener('click', (e) => { if (e.target.id === 'figRetry') read(); });
  // Opened lazily: the panel calls this; a cached list skips the 2 MB read.
  A.bundle = { open() { if (!S.read && S.src === 'built') read(); else draw(); }, read };
  draw();
  if (C && C.onDrop) C.onDrop((files) => {
    (files || []).forEach((f) => {
      if (!/\.(js|json|txt)$/i.test(f.name || '')) return;
      if (typeof f.text === 'string' && f.text.length) take(f.storeKey || f.name, f.text);
      else if (f.storeKey) within(Promise.resolve().then(() => C.store.get(f.storeKey)), 25000).then((r) => r && r.text && take(f.storeKey, r.text)).catch(() => {});
    });
  });
  try {
    C.actions.define('figurineBundle', { description: 'List the models in the figurine bundle', readOnly: true, input: { type: 'object', properties: {} } }, async () => {
      let ms = S.models;
      if (!ms.length) { let r = null; try { r = await within(C.store.get(KEY), 25000); } catch (e) {} ms = r && r.text ? parse(r.text) : []; }
      return { message: ms.length ? ms.length + ' figurines: ' + ms.map((m) => m.id).join(', ') : 'The bundle is not in the store.', count: ms.length };
    });
  } catch (e) {}
})(window.App);
