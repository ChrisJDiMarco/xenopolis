window.App = window.App || {};
(function (A) {
  const N = 28; A.N = N;
  A.TYPES = {
    r: { name: 'Residential zone', cost: 10, zone: 1 },
    c: { name: 'Commercial zone', cost: 10, zone: 1 },
    i: { name: 'Industrial zone', cost: 10, zone: 1 },
    p: { name: 'Levitation path', cost: 5 },
    pw: { name: 'Energy pylon', cost: 120, power: 90, up: 4 },
    rx: { name: 'Plasma reactor', cost: 400, power: 260, up: 9, need: 1 },
    mw: { name: 'Mist well', cost: 100, water: 90, up: 3 },
    mc: { name: 'Mist condenser', cost: 380, water: 260, up: 8, need: 1 },
    park: { name: 'Glow garden', cost: 40, up: 1 },
    hall: { name: 'Hive Council', cost: 500, up: 10, unique: 1 },
    heal: { name: 'Healing bloom', cost: 300, up: 8 },
    acad: { name: 'Star academy', cost: 350, up: 9 },
    port: { name: 'UFO port', cost: 600, up: 12 },
    mono: { name: 'Monolith of Echoes', cost: 1500, lm: 1, need: 1, unique: 1 },
    whale: { name: 'Sky Whale Sanctuary', cost: 3000, lm: 1, need: 2, unique: 1 },
    mother: { name: 'Mothership dock', cost: 6000, lm: 1, need: 3, unique: 1 }
  };
  A.TIERS = [['Outpost', 0], ['Colony', 150], ['Hive', 800], ['Metropolis', 2500], ['Star Capital', 7000]];
  // Planet palettes: [name, land A, land B, forest, sea]. Your city keeps the first; each AI world rolls its own.
  A.BIOMES = [['Teal Bloom', 0x2f7f86, 0x5a3c98, 0x8a3c9a, 0xd0bcff], ['Ember Dunes', 0x9a5a52, 0x6a3a72, 0xff7a5a, 0xffc8b4],
    ['Frost Veil', 0x5a86c4, 0x6a5ab8, 0x7ae8ff, 0xd8f4ff], ['Verdant Glow', 0x3a8a5e, 0x2a5a7e, 0xc8ff6a, 0xb0ffe4]];
  A.PHASES = ['Glimmer', 'Sporefall', 'Tidewane', 'Emberdusk', 'Driftmoon', 'Coralrise', 'Hollowlight', 'Veilsong', 'Starbloom', 'Mistcall', 'Ringturn', 'Nightbirth'];
  A.rng = function (seed) { let a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  function noiseFn(seed) {
    const r = A.rng(seed), S = 6, g = [];
    for (let i = 0; i < (S + 1) * (S + 1); i++) g.push(r());
    const sm = (t) => t * t * (3 - 2 * t);
    const at = (a, b) => g[Math.min(S, b) * (S + 1) + Math.min(S, a)];
    return function (x, y) { x *= S; y *= S; const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
      return (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) + (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v; };
  }
  A.genTerrain = function (seed) {
    const n1 = noiseFn(seed), n2 = noiseFn(seed + 77), r = A.rng(seed + 5);
    A.ter = []; A.hue = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / (N - 1), v = y / (N - 1);
      const ex = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2;
      const h = n1(u, v) * 0.75 + 0.3 - ex * ex * 0.55 + (1 - ex) * 0.12;
      const f = n2(u, v);
      let t = '';
      if (h < 0.3) t = 'w'; else if (f > 0.62) t = 'f'; else if (r() < 0.05) t = 'x';
      A.ter.push(t); A.hue.push(f);
    }
  };
  A.fresh = function (name) {
    return { v: 1, name: name || '', seed: (Math.random() * 1e9) | 0, month: 0, lumen: 6000, tax: 9,
      cells: Array(N * N).fill(''), lv: Array(N * N).fill(0), log: [], tier: 0, speed: 1, started: false, boost: 0, boostUntil: 0, hist: [], best: 0 };
  };
  A.validate = function (r) {
    const s = A.fresh();
    if (!r || typeof r !== 'object') return s;
    if (typeof r.name === 'string') s.name = r.name.slice(0, 40);
    if (Number.isFinite(r.seed)) s.seed = r.seed | 0;
    if (Number.isFinite(r.month)) s.month = Math.max(0, r.month | 0);
    if (Number.isFinite(r.lumen)) s.lumen = Math.round(r.lumen);
    if (Number.isFinite(r.tax)) s.tax = Math.min(20, Math.max(0, r.tax | 0));
    if (Array.isArray(r.cells) && r.cells.length === N * N) s.cells = r.cells.map((t) => (t && A.TYPES[t] ? t : ''));
    if (Array.isArray(r.lv) && r.lv.length === N * N) s.lv = r.lv.map((l) => Math.min(3, Math.max(0, l | 0)));
    if (Array.isArray(r.log)) s.log = r.log.filter((e) => e && typeof e.t === 'string').slice(-60).map((e) => ({ m: Math.max(0, e.m | 0), t: e.t.slice(0, 200), ...(typeof e.d === 'string' && /^\d{4}-\d\d-\d\d$/.test(e.d) ? { d: e.d } : {}) }));
    if (Number.isFinite(r.tier)) s.tier = Math.min(4, Math.max(0, r.tier | 0));
    if ([0, 1, 3].includes(r.speed)) s.speed = r.speed;
    s.started = !!r.started;
    if (Array.isArray(r.hist)) s.hist = r.hist.filter((e) => e && Number.isFinite(e.p) && Number.isFinite(e.l)).slice(-120).map((e) => ({ m: e.m | 0, p: e.p | 0, l: Math.round(e.l), h: e.h | 0 }));
    if (Number.isFinite(r.boost)) { s.boost = Math.max(0, Math.min(20, r.boost)); s.boostUntil = Math.max(0, r.boostUntil | 0); }
    if (Number.isFinite(r.auroraUntil)) s.auroraUntil = Math.max(0, r.auroraUntil | 0);
    if (Number.isFinite(r.tideUntil)) s.tideUntil = Math.max(0, r.tideUntil | 0);
    if (Number.isFinite(r.peakL)) s.peakL = Math.max(0, Math.round(r.peakL));
    if (Number.isFinite(r.best)) s.best = Math.max(0, r.best | 0);
    if (Number.isFinite(r.lastSeen) && r.lastSeen <= Date.now()) s.lastSeen = r.lastSeen;
    if (r.reached && typeof r.reached === 'object') { s.reached = {}; for (const k of ['1', '2', '3', '4']) if (Number.isFinite(r.reached[k])) s.reached[k] = Math.max(0, r.reached[k] | 0); }
    if (Number.isFinite(r.goal)) s.goal = Math.max(0, Math.min(99, r.goal | 0));
    if (Number.isFinite(r.harvest)) s.harvest = r.harvest | 0;
    if (Number.isFinite(r.hollow)) s.hollow = r.hollow | 0;
    if (typeof r.lantern === 'string') s.lantern = r.lantern.slice(0, 10);
    if (Array.isArray(r.hist)) s.hist.forEach((e, k) => { const n = r.hist.slice(-120)[k]; if (n && Number.isFinite(n.n)) e.n = Math.round(n.n); if (n && Number.isFinite(n.e)) e.e = Math.max(0, Math.min(100, n.e | 0)); if (n && Number.isFinite(n.w)) e.w = Math.max(0, Math.min(100, n.w | 0)); });
    if (Number.isFinite(r.ringFair)) s.ringFair = r.ringFair | 0;
    if (r.evc && typeof r.evc === 'object') { s.evc = {}; for (const k in r.evc) if (/^[a-z]{2,12}$/.test(k) && Number.isFinite(r.evc[k])) s.evc[k] = Math.max(0, r.evc[k] | 0); }
    if (typeof r.moths === 'string') s.moths = r.moths.slice(0, 10);
    if (r.ai) { s.ai = 1; s.style = typeof r.style === 'string' && /^[a-z]{3,10}$/.test(r.style) ? r.style : 'grid'; s.biome = Math.min(A.BIOMES.length - 1, Math.max(0, r.biome | 0)); }
    s.v = 1;
    return s;
  };
  // Two save slots: your own city, and the sandbox world the AI builds (so it never touches yours).
  const KEYS = { city: ['city', 'xenopolis.city'], ai: ['aiWorld', 'xenopolis.ai'] };
  A.load = function (slot) {
    const k = KEYS[slot] || KEYS.city; let raw = null;
    try { if (window.cabinet && cabinet.recall) raw = cabinet.recall(k[0], null); } catch (e) {}
    if (!raw) { try { raw = JSON.parse(localStorage.getItem(k[1]) || 'null'); } catch (e) {} }
    if (slot === 'ai') return raw && raw.ai ? A.validate(raw) : null;
    return A.validate(raw && !raw.ai ? raw : null);
  };
  A.loadUndo = function () {
    try { const u = window.cabinet && cabinet.recall ? cabinet.recall('undo', null) : null; if (!u || u.seed !== A.S.seed || !Array.isArray(u.list)) return [];
      return u.list.filter((x) => x && Array.isArray(x.batch) && Number.isFinite(x.spent) && x.batch.every((b) => b && Number.isInteger(b.i) && b.i >= 0 && b.i < N * N && (b.t === '' || A.TYPES[b.t]))).map((x) => ({ spent: Math.round(x.spent), batch: x.batch.map((b) => ({ i: b.i, t: b.t || '', l: Math.min(3, Math.max(0, b.l | 0)) })) }));
    } catch (e) { return []; }
  };
  let saveT = 0;
  A.save = function (now) {
    clearTimeout(saveT);
    const s = A.S, k = KEYS[s.ai ? 'ai' : 'city'];
    const go = () => {
      s.lastSeen = Date.now();
      try { if (window.cabinet && cabinet.remember) cabinet.remember(k[0], s); } catch (e) {}
      try { localStorage.setItem(k[1], JSON.stringify(s)); } catch (e) {}
      if (!s.ai) try { if (window.cabinet && cabinet.remember) cabinet.remember('undo', { v: 1, seed: s.seed, list: (A.undoStack || []).slice(-10) }); } catch (e) {}
    };
    A._pendingSave = go;
    if (now) { A._pendingSave = null; go(); } else saveT = setTimeout(() => { A._pendingSave = null; go(); }, s.ai ? 4000 : 1200);
  };
  A.flushSave = function () { if (A._pendingSave) { clearTimeout(saveT); const g = A._pendingSave; A._pendingSave = null; g(); } };
  addEventListener('pagehide', () => A.flushSave());
  document.addEventListener('visibilitychange', () => { if (document.hidden) A.flushSave(); });
  A.dateStr = function (m) { return 'Cycle ' + (Math.floor(m / 12) + 1) + ' · ' + A.PHASES[m % 12]; };
})(window.App);
