(function (A) {
  const N = A.N, T = A.TYPES, $ = (id) => document.getElementById(id);
  const ic = (body) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
  const ICON = {
    look: ic('<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11m0-1V5a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-4L4 13.5a1.4 1.4 0 0 1 2.3-1.6L8 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
    r: ic('<ellipse cx="12" cy="17" rx="7" ry="4.5" fill="#5ef2d6"/><ellipse cx="12" cy="11" rx="5" ry="3.5" fill="#8ff5e0"/><circle cx="12" cy="5.5" r="1.8" fill="#ff5ec8"/>'),
    c: ic('<rect x="11" y="11" width="2.4" height="9" rx="1" fill="#fff1e0"/><path d="M3 12a9 7 0 0 1 18 0z" fill="#ff5ec8"/><circle cx="8" cy="9.5" r="1" fill="#fff"/><circle cx="14" cy="8" r="1" fill="#fff"/>'),
    i: ic('<rect x="3" y="15" width="18" height="5" rx="1.5" fill="#6b58a8"/><path d="M8 15l2-9 2 9zM13 15l2.5-7 2 7z" fill="#ff5ec8"/>'),
    p: ic('<path d="M3 18C8 18 9 6 21 6" stroke="#5ff8ff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="3" cy="18" r="2" fill="#bff"/><circle cx="21" cy="6" r="2" fill="#bff"/>'),
    pw: ic('<path d="M10.5 21l1.5-14 1.5 14z" fill="#9a7bff"/><circle cx="12" cy="5" r="3" fill="#bff6ff"/><circle cx="12" cy="5" r="4.6" fill="none" stroke="#5ef2d6" stroke-width="1"/>'),
    rx: ic('<rect x="5" y="17" width="14" height="4" rx="1.5" fill="#5a4a8c"/><circle cx="12" cy="11" r="4" fill="#ff5ec8"/><ellipse cx="12" cy="11" rx="8" ry="2.5" fill="none" stroke="#5ef2d6" stroke-width="1.4"/>'),
    mw: ic('<rect x="5" y="15" width="14" height="5" rx="2" fill="#7a68b8"/><circle cx="12" cy="11" r="4" fill="#eadfff" opacity=".8"/><circle cx="14" cy="6" r="2.5" fill="#eadfff" opacity=".6"/>'),
    mc: ic('<rect x="4" y="17" width="16" height="4" rx="1.5" fill="#5a4a8c"/><rect x="6" y="9" width="3" height="8" fill="#7a68b8"/><rect x="15" y="9" width="3" height="8" fill="#7a68b8"/><circle cx="12" cy="13" r="2.5" fill="#bff6ff"/><circle cx="7.5" cy="6" r="2.4" fill="#eadfff" opacity=".7"/><circle cx="16.5" cy="5" r="2.8" fill="#eadfff" opacity=".6"/>'),
    park: ic('<path d="M4 15a4 3 0 0 1 8 0zM11 12a5 4 0 0 1 10 0z" fill="#5ef2d6"/><rect x="7.4" y="15" width="1.2" height="5" fill="#fff1e0"/><rect x="15.4" y="12" width="1.4" height="8" fill="#fff1e0"/>'),
    hall: ic('<path d="M3 19a9 9 0 0 1 18 0z" fill="#b9d0ff" opacity=".8"/><path d="M7 19a5 5 0 0 1 10 0z" fill="#9a7bff"/><path d="M12 3l1.5 3h-3z" fill="#ffc46b"/>'),
    heal: ic('<g fill="#ff9fd0"><ellipse cx="12" cy="7" rx="2.5" ry="4.5"/><ellipse cx="7" cy="12" rx="4.5" ry="2.5"/><ellipse cx="17" cy="12" rx="4.5" ry="2.5"/><ellipse cx="12" cy="17" rx="2.5" ry="4.5"/></g><circle cx="12" cy="12" r="2.4" fill="#b8ff7a"/>'),
    acad: ic('<rect x="9" y="9" width="6" height="12" rx="3" fill="#8a7ae0"/><path d="M12 2l1.4 3 3 .4-2.2 2 .6 3-2.8-1.6-2.8 1.6.6-3-2.2-2 3-.4z" fill="#bff6ff"/>'),
    port: ic('<ellipse cx="12" cy="13" rx="9" ry="3" fill="#d8dcf0"/><path d="M8 12a4 4 0 0 1 8 0" fill="#b8ff7a"/><rect x="5" y="18" width="14" height="2" rx="1" fill="#5a4a8c"/>'),
    mono: ic('<rect x="9.5" y="3" width="5" height="18" rx="1" fill="#2a2048"/><rect x="11.6" y="4" width=".8" height="16" fill="#ff5ec8"/><ellipse cx="12" cy="12" rx="7" ry="2" fill="none" stroke="#5ef2d6"/>'),
    whale: ic('<ellipse cx="12" cy="11" rx="8" ry="3.6" fill="#8fb6ff"/><path d="M3 11l-2-3v6z" fill="#8fb6ff"/><circle cx="17" cy="10" r=".9" fill="#1a1430"/><path d="M6 20h12" stroke="#bda8ff" stroke-width="2" stroke-linecap="round"/>'),
    mother: ic('<ellipse cx="12" cy="9" rx="10" ry="3.4" fill="#c8c8e8"/><path d="M8 11l-3 9h14l-3-9z" fill="#bff6ff" opacity=".35"/><g fill="#ffc46b"><circle cx="5" cy="9.5" r=".9"/><circle cx="12" cy="11" r=".9"/><circle cx="19" cy="9.5" r=".9"/></g>'),
    x: ic('<path d="M5 19l9-9m-4-4l8 8M13 3l8 8-3 3-8-8z" stroke="#ff7aa8" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    undo: ic('<path d="M9 7L4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/>')
  };
  const CATS = [['look', 'Look', ['look']], ['zones', 'Zones', ['r', 'c', 'i']], ['p', 'Paths', ['p']], ['util', 'Utilities', ['pw', 'rx', 'mw', 'mc']], ['civic', 'Civic', ['park', 'hall', 'heal', 'acad', 'port']], ['lm', 'Landmarks', ['mono', 'whale', 'mother']], ['x', 'Bulldoze', ['x']]];
  const iconOf = { look: 'look', zones: 'r', p: 'p', util: 'pw', civic: 'hall', lm: 'mono', x: 'x' };
  A.ui = {};
  A.ui.init = function () {
    $('bar').innerHTML = CATS.map((c) => '<button class="tb" data-cat="' + c[0] + '" aria-label="' + c[1] + '">' + ICON[iconOf[c[0]]] + '<span>' + c[1] + '</span></button>').join('') + '<button class="tb" id="undoB" aria-label="Undo">' + ICON.undo + '<span>Undo</span></button>';
    $('bar').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.id === 'undoB') return A.actions.undo(); openCat(b.dataset.cat); });
    $('sub').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) A.ui.setTool(b.dataset.t); });
    document.querySelectorAll('[data-speed]').forEach((b) => b.addEventListener('click', () => A.actions.setSpeed(+b.dataset.speed)));
    $('menuB').addEventListener('click', () => togglePanel());
    $('closeP').addEventListener('click', () => togglePanel(false));
    $('tax').addEventListener('input', (e) => A.actions.setTax(+e.target.value));
    $('soundB').addEventListener('click', () => A.audio.toggle());
    $('newB').addEventListener('click', () => { if (A.S.ai) { togglePanel(false); return A.ai.sheet(true); } $('confirm').hidden = false; });
    $('noB').addEventListener('click', () => { $('confirm').hidden = true; });
    $('yesB').addEventListener('click', () => { $('confirm').hidden = true; togglePanel(false); A.actions.newCity(''); });
    const go = () => { const v = $('cityName').value.trim() || 'Xenopolis'; A.S.name = v.slice(0, 40); A.S.started = true; if (!A.S.log.length) A.log(A.S.name + ' founded as an Outpost.'); $('namePrompt').hidden = true; A.save(true); A.ui.refresh(); };
    $('foundB').addEventListener('click', go); $('cityName').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    $('namePrompt').hidden = A.S.started; if (!A.S.started) setTimeout(() => $('cityName').focus(), 300);
    $('mini').addEventListener('click', (e) => { const r = e.target.getBoundingClientRect(); A.world.target.x = ((e.clientX - r.left) / r.width - 0.5) * N; A.world.target.z = ((e.clientY - r.top) / r.height - 0.5) * N; });
    $('advice').addEventListener('click', () => { if (A.ai.on) return; const a = A.advice(); if (!a.tool) return; if (['pw', 'rx', 'mw', 'mc'].includes(a.tool)) { try { const i = A.buildNear(a.tool); A.world.target.x = i % N - N / 2 + 0.5; A.world.target.z = ((i / N) | 0) - N / 2 + 0.5; A.ui.toast('✓ ' + T[a.tool].name + ' built by the center · Undo to take it back'); } catch (e) { A.ui.toast(e.message); } return; } const c = CATS.find((x) => x[2].includes(a.tool)); if (c) { openCat(c[0]); A.ui.setTool(a.tool); A.ui.toast('Picked ' + T[a.tool].name + (T[a.tool].zone ? ': drag beside a path' : ': tap a cell')); } });
    $('goal').style.cursor = 'pointer';
    $('goal').addEventListener('click', () => { const g = A.goalNow(); if (!g) return; const t = g[3]; if (!t) { A.ui.toast('Grow population: zone homes beside paths, keep ⚡ and 💧 up.'); return; } const why = A.canPlace(t, -1) ; const d = T[t]; if (d.need && A.S.tier < d.need) return A.ui.toast(d.name + ' unlocks at ' + A.TIERS[d.need][0]); const c = CATS.find((x) => x[2].includes(t)); if (c) { openCat(c[0]); A.ui.setTool(t); A.ui.toast('★ Picked ' + d.name + ' · tap a cell · ◈' + d.cost); } });
    const pick = (t) => { openCat('util'); A.ui.setTool(t); A.ui.toast('Picked ' + T[t].name + ': tap a cell · ◈' + T[t].cost); };
    $('miniB').addEventListener('click', () => A.ui.cycleMini());
    const fix = (k, big, ok) => { if (ok) return pick(k); const t = A.S.tier >= 1 && A.S.lumen >= T[big].cost ? big : k; try { const i = A.buildNear(t); A.world.target.x = i % N - N / 2 + 0.5; A.world.target.z = ((i / N) | 0) - N / 2 + 0.5; A.ui.toast('✓ ' + T[t].name + ' built · Undo to take it back'); } catch (e) { A.ui.toast(e.message); } };
    $('pwB').addEventListener('click', () => fix('pw', 'rx', A.stats.pOK && !A.stats.imp)); $('wtB').addEventListener('click', () => fix('mw', 'mc', A.stats.wOK && !A.stats.wimp));
    // The one keyboard handler (world.js only tracks held camera keys).
    addEventListener('keydown', (e) => {
      const tg = e.target.tagName, k = e.key.toLowerCase(), mod = e.metaKey || e.ctrlKey;
      if (tg === 'INPUT') return;
      if (mod && k === 'z') { e.preventDefault(); A.actions.undo(); return; }
      if (e.key === 'Escape') { const m = ['confirm', 'aiSheet'].find((id) => !$(id).hidden); if (m) $(m).hidden = true; else if (!$('panel').hidden) togglePanel(false); else if (A.world.tool !== 'look') { openCat('look'); A.ui.toast('Back to Look'); } else if (A.ai.on) A.ai.toggle(false); return; }
      if (mod || !A.S.started) return;
      if (e.code === 'Space' && tg !== 'BUTTON') { e.preventDefault(); A.ui._lastSp = A.S.speed || A.ui._lastSp || 1; A.actions.setSpeed(A.S.speed ? 0 : A.ui._lastSp); A.ui.toast(A.S.speed ? '▶ Resumed at ' + A.S.speed + 'x' : '❚❚ Paused · Space to resume'); return; }
      if (/^[1-7]$/.test(k)) { openCat(CATS[+k - 1][0]); A.ui.toast(CATS[+k - 1][1] + ' (' + k + ')'); return; }
      const go = { g: () => $('goal').click(), m: () => A.ui.cycleMini(), b: () => togglePanel(), f: () => $('advice').click(), i: () => A.ai.key(),
        h: () => A.ui.toast('♥ ' + Math.round(A.stats.happy) + '% · land ' + Math.round(A.stats.land.reduce((a, b) => a + b, 0) / (N * N) * 100) + ' · ' + A.advice().t) }[k];
      if (go) go();
    });
    let pc = 'look'; try { const p = window.cabinet && cabinet.recall ? cabinet.recall('prefs', null) : null; if (p && CATS.some((x) => x[0] === p.cat)) pc = p.cat; } catch (e) {}
    openCat(pc); A.ui.refresh();
  };
  const savePrefs = A.ui.savePrefs = () => { try { window.cabinet && cabinet.remember && cabinet.remember('prefs', { v: 1, mini: A.ui.mini, cat, slot: A.S && A.S.ai ? 'ai' : 'city', ai: !!(A.ai && A.ai.on) }); } catch (e) {} };
  let cat = 'look';
  function openCat(c) {
    const ch = cat !== c; cat = c; const def = CATS.find((x) => x[0] === c); if (ch) savePrefs();
    document.querySelectorAll('#bar .tb').forEach((b) => b.classList.toggle('on', b.dataset.cat === c));
    const tools = def[2];
    if (tools.length === 1) { $('sub').hidden = true; A.ui.setTool(tools[0]); return; }
    $('sub').hidden = false;
    $('sub').innerHTML = tools.map((t) => { const d = T[t], lock = d.need && A.S.tier < d.need;
      return '<button class="st' + (lock ? ' lock' : '') + '" data-t="' + t + '" aria-label="' + d.name + '">' + ICON[t] + '<b>' + d.name.replace(' zone', '') + '</b><i>' + (lock ? '🔒 ' + A.TIERS[d.need][0] : '◈' + d.cost + (d.power ? ' · +' + d.power + '⚡' : d.water ? ' · +' + d.water + '💧' : '')) + '</i></button>'; }).join('');
    A.ui.setTool(tools[0]);
  }
  A.ui.setTool = function (t) {
    A.world.tool = t; document.querySelectorAll('#sub .st').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    if (t === 'look' && cat !== 'look') openCat('look');
    $('hint').textContent = t === 'look' ? 'Drag to pan · 1–7 tools · G goal · F fix · B budget · Space' : t === 'x' ? 'Drag over cells to bulldoze' : T[t].zone ? 'Drag a rectangle to zone · needs a path beside it' : t === 'p' ? 'Drag to lay a glowing path (crosses the sea)' : 'Tap a cell to place · ◈' + T[t].cost; if (t !== 'look') $('hint').textContent += ' · Esc to stop';
  };
  function togglePanel(v) { const p = $('panel'); p.hidden = v === undefined ? !p.hidden : !v; if (!p.hidden) { A.ui.refresh(); if (A.bundle) A.bundle.open(); } }
  const fmt = (n) => Math.abs(n) >= 10000 ? (n / 1000).toFixed(1) + 'k' : Math.round(n).toLocaleString();
  A.ui.refresh = function () {
    const s = A.S, st = A.stats;
    $('cname').textContent = s.name || 'Xenopolis'; $('tier').textContent = A.TIERS[s.tier][0];
    $('pop').textContent = fmt(st.pop); $('lumen').textContent = fmt(s.lumen); $('lumen').parentNode.classList.toggle('neg', s.lumen < 0);
    $('happy').textContent = Math.round(st.happy) + '%'; const nt = st.income - st.expense, ne = $('netH'); if (ne) { ne.textContent = (nt >= 0 ? '+' : '') + nt + '/ph'; ne.className = nt >= 0 ? 'up' : 'dn'; } $('date').textContent = A.dateStr(s.month);
    document.querySelectorAll('[data-speed]').forEach((b) => b.classList.toggle('on', +b.dataset.speed === s.speed));
    ['r', 'c', 'i'].forEach((k) => { const d = st.dem[k], el = $('d' + k); el.style.height = Math.abs(d) * 50 + '%'; el.classList.toggle('neg', d < 0); });
    $('pw').textContent = Math.round(st.pd) + '/' + st.ps + (s.month < (s.auroraUntil || 0) ? '✦' : ''); $('pw').className = st.pOK ? (st.ps && st.pd / st.ps > 0.85 ? 'warn' : '') : 'bad';
    $('wt').textContent = Math.round(st.wd) + '/' + st.ws + (s.month < (s.tideUntil || 0) ? '✦' : ''); $('wt').className = st.wOK ? (st.ws && st.wd / st.ws > 0.85 ? 'warn' : '') : 'bad';
    if (!$('panel').hidden) {
      $('tax').value = s.tax; $('taxV').textContent = s.tax + '%';
      $('inc').textContent = '+' + st.income; $('exp').textContent = '−' + st.expense; $('net').textContent = (st.income - st.expense >= 0 ? '+' : '') + (st.income - st.expense);
      $('tiers').innerHTML = A.TIERS.map((t, k) => '<li class="' + (k <= s.tier ? 'got' : '') + '"><span>' + t[0] + '</span><i>' + (k <= s.tier ? '✓' + (s.reached && s.reached[k] != null ? ' ' + A.dateStr(s.reached[k]).replace('Cycle ', 'C') : '') : fmt(t[1]) + ' pop') + '</i></li>').join('');
      $('log').innerHTML = s.log.slice(-12).reverse().map((e) => '<li><i>' + A.PHASES[e.m % 12] + ' ' + (Math.floor(e.m / 12) + 1) + (e.d ? ' · ' + new Date(e.d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '') + '</i>' + esc(e.t) + '</li>').join('') || '<li>No events yet.</li>';
      $('soundB').textContent = A.audio.on ? 'Soundtrack: on' : 'Soundtrack: off'; $('newB').textContent = s.ai ? 'New AI world' : 'New city';
    }
    const nx = A.TIERS[s.tier + 1];
    if (nx) { const lo = A.TIERS[s.tier][1]; $('tbar').style.width = Math.max(2, Math.min(100, (st.pop - lo) / (nx[1] - lo) * 100)) + '%'; $('tnext').textContent = fmt(st.pop) + ' / ' + fmt(nx[1]) + ' → ' + nx[0]; }
    else { $('tbar').style.width = '100%'; $('tnext').textContent = 'Star Capital reached'; }
    if (!$('panel').hidden) { const ev = s.evc || {}, evn = Object.values(ev).reduce((a, b) => a + b, 0); $('best').textContent = 'Peak population: ' + fmt(Math.max(s.best || 0, st.pop)) + ' · peak ◈' + fmt(Math.max(s.peakL || 0, s.lumen)) + (st.edu ? ' · academies +' + Math.round(st.edu * 100) + '% taxes' : '') + (evn ? ' · ' + evn + ' events seen' : ''); }
    const ub = $('undoB'); if (ub) { const n = A.undoStack.length; ub.disabled = !n; ub.style.opacity = n ? '' : '.45'; ub.querySelector('span').textContent = n ? 'Undo ' + n : 'Undo'; ub.title = n ? n + ' steps to undo (⌘Z)' : 'Nothing to undo'; }
    drawMini();
    const gl = A.goalNow ? A.goalNow() : null; $('goal').title = 'Tap to pick the tool for this goal'; $('goal').textContent = s.started ? (gl ? (gl[3] ? '★ ▸ ' : '★ ') + gl[0] + (/citizens|\(\d/.test(gl[0]) ? ' (' + Math.min(100, Math.round(st.pop / (+(gl[0].match(/[\d,]+/) || ['1'])[0].replace(/,/g, '') || 1) * 100)) + '%)' : '') + ' · +◈' + gl[2] : '★ Every goal met') : '';
    const adv = A.ai.on ? { k: 'ai', t: A.ai.say || '🤖 The AI is planning its next move…' } : A.advice(); $('advice').textContent = s.started ? adv.t : ''; $('advice').className = adv.k + (adv.tool ? ' act' : '');
    if (!$('panel').hidden) drawSpark();
    A.ai.paint(!$('panel').hidden);
    if (cat !== 'look' && !$('sub').hidden) { const keep = A.world.tool; openCat(cat); A.ui.setTool(keep); }
  };
  function drawSpark() {
    const cv = $('spark'), h = A.S.hist || [], w = cv.clientWidth || 250, H = 56, d = Math.min(devicePixelRatio, 2);
    cv.width = w * d; cv.height = H * d; const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
    if (h.length < 2) { x.fillStyle = '#cdbdf0'; x.font = '11px system-ui'; x.fillText('History fills in as phases pass.', 8, 32); $('sparkL').textContent = ''; return; }
    const line = (k, col) => { const v = h.map((e) => e[k]), lo = Math.min(...v), hi = Math.max(...v) || 1; x.beginPath();
      v.forEach((y, j) => { const px = 4 + j / (v.length - 1) * (w - 8), py = H - 6 - (hi === lo ? 0.5 : (y - lo) / (hi - lo)) * (H - 12); j ? x.lineTo(px, py) : x.moveTo(px, py); });
      x.strokeStyle = col; x.lineWidth = 2; x.lineJoin = x.lineCap = 'round'; x.stroke(); };
    line('l', '#ffc46b'); line('p', '#5ef2d6');
    const a = h[0], b = h[h.length - 1];
    const nets = h.filter((e) => Number.isFinite(e.n)).slice(-6), avg = nets.length ? Math.round(nets.reduce((t, e) => t + e.n, 0) / nets.length) : null;
    $('sparkL').innerHTML = (avg != null ? '<span style="color:' + (avg >= 0 ? '#9ff8e4' : '#ff9aaa') + '">net ' + (avg >= 0 ? '+' : '') + avg + '/ph</span>' : '') + '<span style="color:#5ef2d6">👽 ' + fmt(a.p) + ' → ' + fmt(b.p) + '</span><span style="color:#ffc46b">◈ ' + fmt(a.l) + ' → ' + fmt(b.l) + '</span>';
  }
  A.ui.openCat = (c) => openCat(c); A.ui.CATS = CATS;
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const MC = { r: '#5ef2c0', c: '#79aaff', i: '#ffa860', p: '#bff8ff' };
  const MODES = ['city', 'land', 'smog'], MLAB = { city: 'Map: city', land: 'Map: land value', smog: 'Map: spore smog' };
  A.ui.mini = (function () { try { const p = window.cabinet && cabinet.recall ? cabinet.recall('prefs', null) : null; return p && MODES.includes(p.mini) ? p.mini : 'city'; } catch (e) { return 'city'; } })();
  A.ui.cycleMini = function () { A.ui.mini = MODES[(MODES.indexOf(A.ui.mini) + 1) % 3]; savePrefs(); A.ui.refresh(); A.ui.toast(MLAB[A.ui.mini] + (A.ui.mini === 'land' ? ' · brighter is richer' : A.ui.mini === 'smog' ? ' · red is smoggy' : '')); };
  function drawMini() {
    const cv = $('mini'), x = cv.getContext('2d'), s = A.S, st = A.stats, mode = A.ui.mini; cv.width = cv.height = N * 3;
    const mb = $('miniB'); if (mb) mb.textContent = '◐ ' + MLAB[mode].replace('Map: ', '');
    if (mode !== 'city') { for (let i = 0; i < N * N; i++) { if (A.ter[i] === 'w') x.fillStyle = '#4a3a8a'; else if (mode === 'land') { const v = st.land[i]; x.fillStyle = 'hsl(' + (170 + v * 30) + ',70%,' + (15 + v * 55) + '%)'; } else { const v = Math.min(1, st.poll[i] / 2); x.fillStyle = v < 0.02 ? '#2a4a5a' : 'hsl(' + (40 - v * 40) + ',90%,' + (30 + v * 30) + '%)'; } x.fillRect((i % N) * 3, ((i / N) | 0) * 3, 3, 3); } return; }
    for (let i = 0; i < N * N; i++) { const t = s.cells[i]; x.fillStyle = t ? (MC[t] || '#ffd27a') : A.ter[i] === 'w' ? '#8d78d8' : A.ter[i] === 'f' ? '#6a3c8a' : '#2f6f78';
      if (t && MC[t] && t !== 'p' && !s.lv[i]) x.globalAlpha = 0.5; x.fillRect((i % N) * 3, ((i / N) | 0) * 3, 3, 3); x.globalAlpha = 1; }
  }
  A.ui.tip = function (i, px, py, sticky) {
    const el = $('tip'); if (i == null || i < 0) { if (!el.dataset.sticky || sticky) { el.hidden = true; el.dataset.sticky = ''; } return; }
    const s = A.S, st = A.stats, t = s.cells[i], tool = A.world.tool;
    let h = '';
    if (tool !== 'look') { const why = A.canPlace(tool, i); h = '<b>' + (tool === 'x' ? 'Bulldoze' : T[tool].name) + '</b>' + (why ? '<span class="bad">' + why + '</span>' : '<span>' + (tool === 'x' ? 'Clear this cell' : '◈' + T[tool].cost) + '</span>'); }
    else {
      const name = t ? T[t].name + (T[t].zone ? ' · L' + s.lv[i] : '') : A.ter[i] === 'w' ? 'Lavender sea' : A.ter[i] === 'f' ? 'Fungal forest' : A.ter[i] === 'x' ? 'Crystal outcrop' : 'Open land';
      h = '<b>' + name + '</b>' + (A.ter[i] === 'x' && !t ? '<span>Industry beside it is crystal-fed: +40% jobs</span>' : '') + '<span>Land value ' + Math.round(st.land[i] * 100) + ' · Smog ' + Math.round(st.poll[i] * 20) + '</span>' + (t && T[t].up ? '<span>Upkeep ◈' + T[t].up + ' / phase</span>' : '');
      if (t && T[t].zone) h += '<span>' + (A.pathNear(i) ? '✓ path' : '✗ no path') + ' · ' + (st.pOK ? '✓' : '✗') + ' energy · ' + (st.wOK ? '✓' : '✗') + ' water</span><span class="why">' + A.whyIdle(i) + '</span>';
    }
    el.innerHTML = h; el.hidden = false; el.dataset.sticky = sticky ? '1' : '';
    const w = el.offsetWidth; el.style.left = Math.min(innerWidth - w - 8, Math.max(8, px + 14)) + 'px'; el.style.top = Math.max(50, py - 60) + 'px';
  };
  let toastT = 0;
  A.ui.toast = function (m) { const el = $('toast'); if (!el.dataset.w) { el.dataset.w = 1; el.addEventListener('click', () => el.classList.remove('show')); } el.title = m; el.style.bottom = ($('dock').offsetHeight + 12) + 'px'; el.textContent = m; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3800); };
})(window.App);
