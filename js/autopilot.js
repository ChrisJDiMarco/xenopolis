/* AI Mayor: watch an AI play your city, or dream up a wild sandbox world (your save stays untouched). */
(function () {
  const A = window.App, C = window.cabinet || {};
  // Store rule guard: the platform needs keep.last between 10 and 1,000,000; clamp every caller.
  try { if (C.keep && !C.keep.__clamped) { const k0 = C.keep.bind(C); C.keep = (n, o) => { o = Object.assign({}, o || {}); if (o.last !== undefined) o.last = Math.max(10, Math.min(1e6, Math.round(+o.last) || 10)); if (o.days !== undefined) o.days = Math.max(1, Math.round(+o.days) || 1); return Promise.resolve().then(() => k0(n, o)).catch(() => {}); }; C.keep.__clamped = true; } } catch (e) {}
  let tries = 0; function ready(fn) { if (A && A.S && A.ui && A.ui.refresh && A.world && A.world.target) { try { fn(); } catch (e) { console.warn('AI init', e); } } else if (++tries < 120) setTimeout(() => ready(fn), 300); }
  ready(init);
  // One-tap way in from the card: a Watch AI pill above the hint line.
  function pill() { const d = document.getElementById('dock'), h = document.getElementById('hint'); if (!d || !h || document.getElementById('aiWatch')) return; const w = document.createElement('button'); w.id = 'aiWatch'; w.textContent = '🤖 Watch AI build now · K for options'; w.setAttribute('aria-label', 'Watch the AI Mayor dream a world (K)'); w.style.cssText = 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;background:linear-gradient(135deg,#5ef2d6,#ff5ec8);color:#1d1240;box-shadow:0 0 14px rgba(255,94,200,.45)'; w.addEventListener('click', () => { if (A.AI && A.AI.quick) A.AI.quick(); else { const b = document.getElementById('aiB'); if (b) b.click(); } }); d.insertBefore(w, h); const upd = () => { w.hidden = !!(A && A.AI && A.AI.on) || !(A && A.S && A.S.started); const st = A && A.AI && A.AI.stats; if (st && !w.hidden) w.textContent = '🤖 Watch AI build now' + (st.bestCombo ? ' · best combo ×' + st.bestCombo : st.bestScore ? ' · best ★' + Math.round(st.bestScore / 100) / 10 + 'k' : '') + ' · K'; }; upd(); setInterval(upd, 1000); }
  setTimeout(pill, 1500);
  function init() {
    const N = A.N, T = A.TYPES, $ = (id) => document.getElementById(id);
    const AI = A.AI = { on: false, mode: '', builds: 0, quiet: false, focus: -1, last: 0, backup: null, undo: null, step: 0 };
    let stats = { v: 1, builds: 0, dreams: 0, dreamBestPop: 0, cityBuilds: 0 };
    try { const m = C.recall ? C.recall('ai', null) : null; if (m && typeof m === 'object') if (m && typeof m.dreamBestName === 'string') stats.dreamBestName = m.dreamBestName.slice(0, 40);
      if (m) for (const k of ['builds', 'dreams', 'dreamBestPop', 'cityBuilds', 'insane']) if (Number.isFinite(m[k])) stats[k] = Math.max(0, m[k] | 0);
      stats.pace = m && [1, 2, 4, 8].includes(m.pace) ? m.pace : 1; stats.watchMin = m && Number.isFinite(m.watchMin) ? Math.max(0, m.watchMin) : 0; stats.endless = !!(m && m.endless);
      stats.blessings = m && Number.isFinite(m.blessings) ? Math.max(0, m.blessings | 0) : 0;
      stats.style = m && ['balanced', 'sprawl', 'eco', 'mega', 'spiral', 'fractal', 'ring', 'isle', 'vine', 'wild'].includes(m.style) ? m.style : 'balanced'; stats.fast = {}; if (m && m.fast && typeof m.fast === 'object') for (const k in m.fast) if (/^[a-z]{3,10}$/.test(k) && Number.isFinite(m.fast[k]) && m.fast[k] > 0) stats.fast[k] = +(+m.fast[k]).toFixed(1);
      stats.history = (m && Array.isArray(m.history) ? m.history : []).filter((h) => h && typeof h.name === 'string' && Number.isFinite(h.pop)).slice(0, 8).map((h) => ({ name: h.name.slice(0, 40), pop: h.pop | 0, builds: h.builds | 0, insane: !!h.insane, at: Number(h.at) || 0, key: typeof h.key === 'string' && h.key.startsWith('dreams/') ? h.key : '', style: typeof h.style === 'string' && /^[a-z]{3,10}$/.test(h.style) ? h.style : '', score: Number.isFinite(h.score) ? h.score | 0 : 0, mins: Number.isFinite(h.mins) ? Math.max(0, Math.round(h.mins)) : 0, pts: Array.isArray(h.pts) ? h.pts.filter(Number.isFinite).slice(-16).map((x) => Math.max(0, x | 0)) : [] })); stats.bestScore = m && Number.isFinite(m.bestScore) ? m.bestScore | 0 : 0; stats.styleBest = {}; if (m && m.styleBest && typeof m.styleBest === 'object') for (const k in m.styleBest) if (/^[a-z]{3,10}$/.test(k) && Number.isFinite(m.styleBest[k])) stats.styleBest[k] = Math.max(0, m.styleBest[k] | 0); stats.cata = !!(m && m.cata); stats.lastMode = m && ['dream', 'insane', 'city'].includes(m.lastMode) ? m.lastMode : ''; stats.rebuilt = m && Number.isFinite(m.rebuilt) ? Math.max(0, m.rebuilt | 0) : 0; } catch (e) { stats.pace = 1; stats.history = []; stats.style = 'balanced'; }
    // Dream snapshots are pruned by hand (only the 8 in history are kept), so no keep rule is needed.
    // (no keep rule: the platform rejected it; pruneHist keeps the store tidy)
    try { const m1 = C.recall ? C.recall('ai', null) : null; stats.bestCombo = m1 && Number.isFinite(m1.bestCombo) ? Math.max(0, Math.min(999, m1.bestCombo | 0)) : 0; } catch (e) { stats.bestCombo = 0; }
    AI.stats = stats; let combo = 0, comboAt = 0;
    stats.bets = { won: 0, lost: 0 }; try { const m0 = C.recall ? C.recall('ai', null) : null; if (m0 && m0.bets) { stats.bets.won = Math.max(0, m0.bets.won | 0); stats.bets.lost = Math.max(0, m0.bets.lost | 0); } } catch (e) {}
    let swoop = 0;
    const prune = (key) => { try { if (key && C.store && C.store.remove && !stats.history.some((h) => h.key === key)) Promise.resolve(C.store.remove(key)).catch(() => {}); } catch (e) {} };
    const pushHist = (h) => { stats.history = stats.history.filter((x) => x.key !== h.key); stats.history.unshift(h); while (stats.history.length > 8) prune(stats.history.pop().key); };
    const score = () => { const st = A.stats || {}, c = st.counts || {}; return Math.round((st.pop || 0) + (st.happy || 0) * 20 + Object.keys(c).length * 150 + ((c.mono ? 1 : 0) + (c.whale ? 1 : 0) + (c.mother ? 1 : 0)) * 1000); };
    const SPEC = [['meteor', '☄ The AI calls down a meteor shower for star-glass'], ['comet', '🌠 A comet festival lights the dream sky'], ['spores', '✿ The AI seeds a spore bloom over the towers'], ['swarm', '🐝 Builder-mites swarm the skyline'], ['trader', '🛸 A trader fleet docks at the new city']]; let specT = 0;
    const MS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000];
    let errs = 0;
    const saveStats = () => { try { C.remember && C.remember('ai', stats); } catch (e) {} };

    // Never write a dream world over the real save.
    const origSave = A.save, origFlush = A.flushSave, origToast = A.ui.toast;
    // In a dream, keep the real city saved (bets change its Lumen) and remember the dream session to resume after a reload.
    const saveReal = () => { const s = AI.backup; if (!s) return; try { s.lastSeen = Date.now(); C.remember && C.remember('city', s); } catch (e) {} try { localStorage.setItem('xenopolis.city', JSON.stringify(s)); } catch (e) {} };
    const session = (on) => { try { C.remember && C.remember('aiSession', on && AI.on ? { v: 1, mode: AI.mode, insane: !!AI.insane, key: AI.mode === 'dream' && A.S.name ? 'dreams/' + A.S.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json' : '', at: Date.now() } : null); } catch (e) {} };
    A.save = (now) => { if (AI.mode === 'dream') { saveReal(); if (now) snapDream(); return; } origSave(now); };
    A.flushSave = () => { if (AI.mode === 'dream') { saveReal(); snapDream(); return; } origFlush(); };
    A.ui.toast = (m) => { if (AI.quiet) return; origToast(m); };
    const origNew = A.actions.newCity; A.actions.newCity = (n) => { if (AI.on) stop(true); return origNew(n); };

    // ---- UI
    const css = document.createElement('style');
    css.textContent = `#aiB{font-size:10px;padding:3px 6px;border-radius:7px;background:linear-gradient(135deg,rgba(94,242,214,.25),rgba(154,123,255,.35));font-weight:700}#aiB.on{background:linear-gradient(135deg,#5ef2d6,#ff5ec8);color:#1d1240}
#aiBar{display:flex;align-items:center;gap:8px;max-width:94%;min-width:0;font-size:11px;font-weight:600;padding:4px 4px 4px 10px;border-radius:999px;background:linear-gradient(90deg,rgba(40,20,90,.9),rgba(90,30,110,.88));border:1px solid rgba(255,140,230,.4);box-shadow:0 0 18px rgba(255,94,200,.35)}#aiBar[hidden]{display:none}
#aiBar .d{width:8px;height:8px;border-radius:50%;background:#5ef2d6;flex:none;box-shadow:0 0 8px #5ef2d6;animation:aip 1.2s ease-in-out infinite}@keyframes aip{50%{opacity:.35}}
#aiFeed{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}#aiN{color:#ffc46b;font-variant-numeric:tabular-nums;flex:none}
#aiPace{flex:none;padding:3px 8px;border-radius:999px;background:rgba(94,242,214,.22);font-weight:700;color:#5ef2d6;font-variant-numeric:tabular-nums}#aiPace:focus-visible,#aiStop:focus-visible{outline:2px solid #5ef2d6}#aiHist{margin:6px 0 0;padding:0;list-style:none;font-size:10.5px;color:#cdbdf0;text-align:left}#aiHist li{display:flex;justify-content:space-between;gap:8px;padding:2px 0;border-top:1px solid rgba(255,255,255,.08)}#aiHist b{color:#ffc46b;font-variant-numeric:tabular-nums}
#aiStyle button{padding:4px 9px!important;border-radius:999px;font-size:11px;background:rgba(255,255,255,.08)!important}#aiStyle button.sel{background:linear-gradient(135deg,#5ef2d6,#ff5ec8)!important;color:#1d1240}#aiHist .rv{padding:1px 7px!important;border-radius:999px;font-size:10px;background:rgba(94,242,214,.25)!important;margin-left:6px}
#aiBar{position:relative;overflow:hidden}#aiProg{position:absolute;left:0;bottom:0;height:2px;background:linear-gradient(90deg,#5ef2d6,#ffc46b);transition:width .6s;width:0}#aiStop{flex:none;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.16);font-weight:700}#aiStop:hover{background:rgba(255,255,255,.28)}
#aiPick .opt{display:grid;gap:2px;text-align:left;padding:10px 12px!important;border-radius:12px;background:rgba(255,255,255,.08)!important}#aiPick .opt i{font-style:normal;font-weight:500;font-size:11px;color:#cdbdf0}#aiPick .opt.hot{background:linear-gradient(135deg,rgba(94,242,214,.3),rgba(255,94,200,.3))!important}
@media (prefers-reduced-motion:reduce){#aiBar .d{animation:none}}`;
    document.head.appendChild(css);
    const b = document.createElement('button'); b.id = 'aiB'; b.textContent = '🤖 AI'; b.setAttribute('aria-label', 'AI Mayor: watch the AI play (K)'); b.title = 'AI Mayor (K)';
    const sp = document.querySelector('.speed'); sp.insertBefore(b, $('menuB'));
    const bar = document.createElement('div'); bar.id = 'aiBar'; bar.hidden = true; bar.setAttribute('role', 'status');
    bar.innerHTML = '<span class="d"></span><span id="aiFeed">AI Mayor waking up…</span><span id="aiN"></span><button id="aiPace" aria-label="AI thinking speed" title="AI pace (J)">1×</button><button id="aiStop" aria-label="Stop the AI">Stop</button><i id="aiProg"></i>';
    $('dock').insertBefore(bar, $('dock').firstChild);
    const pick = document.createElement('div'); pick.id = 'aiPick'; pick.className = 'modal'; pick.hidden = true;
    pick.innerHTML = '<div><b>🤖 AI Mayor</b><p>Sit back and watch an AI plan paths, zone, power and grow a city at full speed.</p>' +
      '<button class="opt hot" data-m="dream">✦ Dream world<i>A brand-new planet with ◈250k and every landmark unlocked. Your city stays safe and comes back when you stop.</i></button>' +
      '<button class="opt hot" data-m="insane">⚡ Insane world<i>◈2M, triple-speed hyperbuild, swarms and meteor-fast growth. Pure spectacle.</i></button>' +
      '<div id="aiStyle" style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center"><button data-s="balanced">⚖ Balanced</button><button data-s="sprawl">🛸 Sprawl</button><button data-s="eco">🌿 Eco</button><button data-s="mega">🏙 Megacity</button><button data-s="spiral">🌀 Spiral</button><button data-s="fractal">❄ Fractal</button><button data-s="ring">🪐 Ringworld</button><button data-s="isle">🏝 Archipelago</button><button data-s="vine">🧬 Tendril</button><button data-s="wild">🎲 Wild</button></div><p style="font-size:10px;margin:2px 0">While watching: J pace · V cinema · L decisions · N next world · K stop · R replays your last pick</p><button id="aiEndless" aria-pressed="false" style="font-size:11px;padding:4px 10px;border-radius:999px">🌌 Endless: off</button>' +
      '<button id="aiCata" aria-pressed="false" style="font-size:11px;padding:4px 10px;border-radius:999px">☄ Cataclysms: off</button><button class="opt hot" data-m="surprise">🎰 Surprise me<i>A random style, Insane world, cataclysms on. One tap.</i></button>' +
      '<button class="opt" data-m="city">Play my city<i>The AI keeps building <span id="aiCityN"></span> with your Lumen. Undo still works.</i></button>' +
      '<button data-m="">Cancel</button><p id="aiStat" style="font-size:10.5px"></p><ul id="aiHist"></ul></div>';
    document.body.appendChild(pick);
    const openPick = () => { if (AI.on) return stop(); $('aiCityN').textContent = A.S.name || 'your city'; $('aiStat').textContent = stats.builds ? 'The AI has built ' + stats.builds.toLocaleString() + ' things so far' + (stats.watchMin >= 1 ? ' in ' + Math.round(stats.watchMin) + ' min of watching' : '') + (stats.dreamBestPop ? ' · best dream: ' + (stats.dreamBestName ? stats.dreamBestName + ', ' : '') + stats.dreamBestPop.toLocaleString() + ' citizens' : '') + (stats.blessings ? ' · ✋ ' + stats.blessings + ' blessings' : '') + '.' : ''; const hl = $('aiHist'); hl.innerHTML = ''; if (stats.history.length) { const t = document.createElement('li'); t.textContent = 'Recent dreams'; t.style.fontWeight = '700'; hl.appendChild(t); stats.history.slice(0, 5).forEach((h) => { const li = document.createElement('li'); const s = document.createElement('span'); s.textContent = (h.insane ? '⚡ ' : '✦ ') + (ICO[h.style] || '') + h.name + ' · ' + h.builds + ' builds' + (h.mins ? ' · ' + h.mins + 'm' : ''); if (h.pts && h.pts.length > 1) { const mx = Math.max(...h.pts) || 1, pl = h.pts.map((v, k) => (k / (h.pts.length - 1) * 40).toFixed(1) + ',' + (11 - v / mx * 10).toFixed(1)).join(' '); s.insertAdjacentHTML('beforeend', ' <svg width="40" height="12" aria-label="growth" style="vertical-align:middle"><polyline points="' + pl + '" fill="none" stroke="#5ef2d6" stroke-width="1.5" stroke-linejoin="round"/></svg>'); } const n = document.createElement('b'); n.textContent = h.pop.toLocaleString() + ' 👽' + (h.score ? ' · ★' + fmt(h.score) : ''); li.append(s, n); if (h.key) { const rv = document.createElement('button'); rv.className = 'rv'; rv.textContent = '▶ Resume'; rv.setAttribute('aria-label', 'Resume dream ' + h.name); rv.dataset.k = h.key; rv.dataset.ins = h.insane ? '1' : ''; n.appendChild(rv); } hl.appendChild(li); }); }
      showStyle(); pick.hidden = false; pick.querySelector('.opt').focus(); };
    const showStyle = () => { pick.querySelectorAll('#aiStyle button').forEach((x) => x.classList.toggle('sel', x.dataset.s === stats.style)); pick.querySelectorAll('#aiStyle button').forEach((x) => { const v = stats.styleBest && stats.styleBest[x.dataset.s]; const fs = stats.fast && stats.fast[x.dataset.s]; x.title = (v ? 'Best ★' + v.toLocaleString() : 'Not played yet') + (fs ? ' · 10k citizens in ' + fs + ' min' : ''); if (!x.dataset.l) x.dataset.l = x.textContent; x.textContent = x.dataset.l + (v ? ' ★' + fmt(v) : ''); }); const ca = $('aiCata'); ca.textContent = '☄ Cataclysms: ' + (stats.cata ? 'on · meteors flatten blocks, the AI rebuilds' : 'off'); ca.setAttribute('aria-pressed', String(stats.cata)); ca.classList.toggle('sel', stats.cata); const e = $('aiEndless'); e.textContent = '🌌 Endless: ' + (stats.endless ? 'on · hops to a new world when one peaks' : 'off'); e.setAttribute('aria-pressed', String(!!stats.endless)); e.classList.toggle('sel', !!stats.endless); };
    const paceB = () => $('aiPace'); const showPace = () => { paceB().textContent = stats.pace + '×'; };
    const cyclePace = () => { stats.pace = stats.pace === 1 ? 2 : stats.pace === 2 ? 4 : stats.pace === 4 ? 8 : 1; showPace(); saveStats(); origToast('🤖 AI pace ' + stats.pace + '×' + (stats.pace === 8 ? ' · LUDICROUS' : '')); };
    setTimeout(() => { showPace(); paceB().addEventListener('click', cyclePace); }, 0);
    b.addEventListener('click', openPick);
    pick.addEventListener('click', (e) => { const o = e.target.closest('button'); if (!o) { if (e.target === pick) pick.hidden = true; return; }
      if (o.dataset.s) { stats.style = o.dataset.s; showStyle(); saveStats(); return; }
      if (o.id === 'aiCata') { stats.cata = !stats.cata; showStyle(); saveStats(); return; }
      if (o.dataset.m === 'surprise') { const SL = ['balanced', 'sprawl', 'eco', 'mega', 'spiral', 'fractal', 'ring', 'isle', 'vine', 'wild']; stats.style = SL[(Math.random() * SL.length) | 0]; stats.cata = true; saveStats(); pick.hidden = true; start('insane'); return; }
      if (o.id === 'aiEndless') { stats.endless = !stats.endless; showStyle(); saveStats(); return; }
      if (o.dataset.k) { o.textContent = 'Loading…'; Promise.resolve().then(() => C.store.get(o.dataset.k)).then((r) => { const d = r && (r.text ? JSON.parse(r.text) : r.json); if (!d || !Array.isArray(d.cells)) throw 0; pick.hidden = true; start(o.dataset.ins ? 'insane' : 'dream', d); }).catch(() => { o.textContent = 'Not found'; }); return; }
      pick.hidden = true; if (o.dataset.m) start(o.dataset.m); });
    $('aiStop').addEventListener('click', () => stop());
    addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return; if (e.key.toLowerCase() === 'k') { e.preventDefault(); pick.hidden ? openPick() : (pick.hidden = true); } else if (e.key.toLowerCase() === 'j' && AI.on) { e.preventDefault(); cyclePace(); } else if (e.key.toLowerCase() === 'n' && AI.on && AI.mode === 'dream') { e.preventDefault(); nextWorld(); } else if (e.key.toLowerCase() === 'v' && AI.on) { e.preventDefault(); cine(); } else if (e.key.toLowerCase() === 'r' && !AI.on && pick.hidden && stats.lastMode) { e.preventDefault(); start(stats.lastMode); } else if (e.key === 'Escape' && !pick.hidden) pick.hidden = true; });
    const cine = (on) => { const v = on === undefined ? !document.body.classList.contains('cine') : on; document.body.classList.toggle('cine', v); if (v) origToast('🎬 Cinema mode · V to show the UI'); };
    const cs = document.createElement('style'); cs.textContent = 'body.cine #dock>*:not(#aiBar),body.cine #figChip,body.cine .hud,body.cine .mini,body.cine #toolbar{display:none!important}#aiCine{flex:none;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.14);font-weight:700}'; document.head.appendChild(cs);
    setTimeout(() => { const cb = document.createElement('button'); cb.id = 'aiCine'; cb.textContent = '🎬'; cb.title = 'Cinema mode (V)'; cb.setAttribute('aria-label', 'Cinema mode: hide the UI and just watch'); cb.addEventListener('click', () => cine()); bar.insertBefore(cb, $('aiStop')); const nb = document.createElement('button'); nb.id = 'aiNext'; nb.textContent = '⏭'; nb.title = 'Next world (N)'; nb.setAttribute('aria-label', 'Dream a fresh world'); nb.style.cssText = 'flex:none;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.14);font-weight:700'; nb.addEventListener('click', () => nextWorld()); bar.insertBefore(nb, cb); }, 0);
    let snapT = 0; const snapDream = () => { if (AI.mode !== 'dream' || !C.store || !A.S || !A.S.name) return; try { const key = 'dreams/' + A.S.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json'; const s = JSON.stringify(A.S); if (s.length < 4e6) Promise.resolve(C.store.put(key, s)).catch(() => {}); const sc0 = score(); stats.bestScore = Math.max(stats.bestScore || 0, sc0); AI.pts = (AI.pts || []).concat(A.stats.pop | 0).slice(-16); pushHist({ name: A.S.name, pop: A.stats.pop | 0, builds: AI.builds, insane: !!AI.insane, at: Date.now(), key, score: sc0, style: AI.styleAt || stats.style, mins: AI.t0 ? (Date.now() - AI.t0) / 60000 : 0, pts: AI.pts }); saveStats(); } catch (e) {} };

    const ICO = { balanced: '⚖ ', sprawl: '🛸 ', eco: '🌿 ', mega: '🏙 ', spiral: '🌀 ', fractal: '❄ ', ring: '🪐 ', isle: '🏝 ', vine: '🧬 ', wild: '🎲 ' };
    const hist = []; function say(t) { if (!hist[0] || hist[0].t !== t) { hist.unshift({ t, at: Date.now() }); hist.length = Math.min(hist.length, 24); drawLog(); } bar.title = hist.slice(0, 6).map((h) => h.t).join('\n'); $('aiFeed').textContent = (ICO[stats.style] || '') + (stats.style === 'wild' && AI.wild ? '(' + AI.wild + ') ' : '') + t; $('aiN').textContent = '👽' + fmt(A.stats.pop || 0) + nextMs() + ' · ◈' + fmt(A.S.lumen) + ' · ' + AI.builds + (AI.t0 ? ' · ' + Math.floor((Date.now() - AI.t0) / 60000) + 'm' : '') + (AI.mode === 'dream' ? ' · ★' + fmt(score()) : '') + (combo >= 3 && Date.now() - comboAt < 2500 ? ' · 🔥×' + combo : ''); const lo = MS[AI.ms - 1] || 0, hi = MS[AI.ms]; $('aiProg').style.width = (hi ? Math.max(2, Math.min(100, ((A.stats.pop || 0) - lo) / (hi - lo) * 100)) : 100) + '%'; }
    const nextMs = () => MS[AI.ms] ? ' → ' + fmt(MS[AI.ms]) : '';
    const fmt = (n) => Math.abs(n) >= 10000 ? (n / 1000).toFixed(n >= 1e5 ? 0 : 1) + 'k' : Math.round(n).toLocaleString();

    function start(mode, loaded) {
      if (AI.on) stop(true);
      stats.lastMode = mode; AI.styleAt = stats.style;
      if (!A.S.started && mode === 'city') { A.S.started = true; A.S.name = A.S.name || 'Xenopolis'; $('namePrompt').hidden = true; }
      AI.builds = 0; AI.on = true; AI.t0 = Date.now(); AI.ms = 0; AI.pts = []; hist.length = 0;
      const insane = mode === 'insane'; if (insane) mode = 'dream'; AI.insane = insane; if (insane) stats.insane = (stats.insane || 0) + 1;
      if (mode === 'dream') {
        origFlush();
        AI.backup = JSON.parse(JSON.stringify(A.S)); AI.undo = A.undoStack.splice(0);
        AI.mode = 'dream';
        const pre = ['Neon', 'Glass', 'Velvet', 'Spore', 'Prism', 'Aurora', 'Moth', 'Quasar', 'Lumin', 'Nebu', 'Crystal', 'Void'], suf = ['myre', 'whorl', ' Abyss', 'heim', 'hollow', 'axis', ' Cathedral', ' Reef', ' Spire', 'gate', ' Bloom', 'drift'];
        const names = Array.from({ length: 8 }, () => pre[(Math.random() * pre.length) | 0] + suf[(Math.random() * suf.length) | 0]);
        let S = null; if (loaded) { try { S = A.validate(loaded); } catch (e) { S = null; } }
        const isNew = !S; if (!S) S = A.fresh(names[(Math.random() * names.length) | 0]);
        S.started = true; if (isNew) { S.lumen = insane ? 2000000 : 250000; S.tax = 10; S.goal = 0; } else S.lumen = Math.max(S.lumen, insane ? 500000 : 60000); S.speed = 3; S.tier = 3;
        A.S = S; A.genTerrain(S.seed); if (isNew) { A.starter(); A.log(S.name + ' dreamed into being by the AI Mayor.'); } else A.log('The AI Mayor returns to ' + S.name + '.');
        { const p = A.compute().pop || 0; AI.ms = MS.filter((x) => x <= p).length; }
        A.compute(); A.world.rebuildAll(); A.world.dist = 30; A.world.pitch = 0.8;
        $('namePrompt').hidden = true; stats.dreams++;
        origToast('✦ Dreaming up ' + S.name + '… your city ' + (AI.backup.name || '') + ' is safe');
      } else {
        AI.mode = 'city'; if (!A.S.speed) A.S.speed = 1;
        origToast('🤖 The AI Mayor takes over ' + (A.S.name || 'the city') + ' · Stop anytime');
      }
      AI.bet = null; if (AI.mode === 'dream') { const tgt = Math.max(1000, Math.round(((A.stats.pop || 0) + (AI.insane ? 8000 : 3000)) / 500) * 500); AI.bet = { tgt, until: Date.now() + 180000, on: false }; setTimeout(() => { if (AI.on && AI.bet) { betB.hidden = false; betB.textContent = '🎯 Bet ◈500: ' + fmt(tgt) + ' in 3m?'; } }, 1500); }
      if (AI.mode === 'dream' && new Date().getDay() === 5 && !A.reduced) setTimeout(() => { if (AI.on) { AI.quiet = true; try { A.world.fx('comet'); A.world.fx('spores'); } catch (e) {} AI.quiet = false; say('🎆 Friday fireworks over ' + A.S.name); } }, 2500);
      setTimeout(() => { if (AI.on) origToast(AI.mode === 'dream' ? '✋ Tap the land to bless it · V cinema · J pace · K stop' : 'Watching tips: V cinema · J pace · K stop'); }, 4200);
      b.classList.add('on'); b.textContent = '🤖 Stop'; { const nx = $('aiNext'); if (nx) nx.hidden = AI.mode !== 'dream'; } bar.hidden = false; say('Surveying the land…');
      A.ui.setTool('look'); A.ui.refresh(); saveStats(); if (AI.mode === 'dream') snapDream(); session(true);
    }
    function stop(silent) {
      if (!AI.on) return; const was = AI.mode; AI.on = false; AI.mode = '';
      if (was === 'dream' && AI.backup) {
        const pop = A.stats.pop; const nm = A.S.name; if (pop >= stats.dreamBestPop) stats.dreamBestName = nm;
        const key = 'dreams/' + nm.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
        try { const snap = JSON.stringify(A.S); if (snap.length < 4e6 && C.store) Promise.resolve(C.store.put(key, snap)).catch(() => {}); } catch (e) {}
        const sc = score(); stats.bestScore = Math.max(stats.bestScore || 0, sc); const sk = AI.styleAt || stats.style; stats.styleBest[sk] = Math.max(stats.styleBest[sk] || 0, sc); pushHist({ name: nm, pop, builds: AI.builds, insane: !!AI.insane, at: Date.now(), key, score: sc, style: sk, mins: AI.t0 ? (Date.now() - AI.t0) / 60000 : 0, pts: (AI.pts || []).concat(pop | 0).slice(-16) }); stats.dreamBestPop = Math.max(stats.dreamBestPop, pop);
        A.S = A.validate(AI.backup); A.genTerrain(A.S.seed); A.undoStack.length = 0; A.undoStack.push(...(AI.undo || []));
        AI.backup = null; AI.undo = null; A.compute(); A.world.rebuildAll(); A.world.dist = 21;
        if (!silent) origToast('Woke from ' + nm + ' · ★' + sc.toLocaleString() + (sc >= stats.bestScore ? ' 🏆 best world yet' : '') + ' · back in ' + (A.S.name || 'your city'));
      } else if (!silent) origToast('🤖 AI Mayor stepped down after ' + AI.builds + ' builds');
      session(false); AI.bet = null; betB.hidden = true; cine(false); toggleLog(false); b.classList.remove('on'); b.textContent = '🤖 AI'; bar.hidden = true; saveStats(); A.ui.refresh(); A.save(true);
    }

    // ---- bet: wager ◈500 of your real city that the AI hits a population in 3 minutes
    const betB = document.createElement('button'); betB.id = 'aiBet'; betB.hidden = true; betB.setAttribute('aria-label', 'Bet 500 Lumen of your city on the AI');
    betB.style.cssText = 'font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;background:linear-gradient(135deg,#ffc46b,#ff5ec8);color:#1d1240;box-shadow:0 0 14px rgba(255,196,107,.5)';
    $('dock').insertBefore(betB, bar.nextSibling);
    betB.addEventListener('click', () => { const bt = AI.bet; if (!bt || bt.on) return; if (!AI.backup || AI.backup.lumen < 500) { origToast('Your city needs ◈500 to bet'); return; } bt.on = true; bt.until = Date.now() + 180000; AI.backup.lumen -= 500; origToast('🎯 Bet placed: ' + fmt(bt.tgt) + ' citizens in 3 min · win ◈1,500'); });
    function betTick() { const bt = AI.bet; if (!bt) return; if (!bt.on) return; const left = Math.max(0, Math.ceil((bt.until - Date.now()) / 1000)); const p = A.stats.pop || 0; betB.textContent = '🎯 ' + fmt(p) + '/' + fmt(bt.tgt) + ' · ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
      if (p >= bt.tgt) { if (AI.backup) AI.backup.lumen += 1500; stats.bets.won++; AI.bet = null; betB.hidden = true; saveStats(); origToast('🏆 Bet won! +◈1,500 to ' + (AI.backup ? AI.backup.name : 'your city')); say('🎯 You called it: ' + fmt(bt.tgt) + ' citizens'); }
      else if (!left) { stats.bets.lost++; AI.bet = null; betB.hidden = true; saveStats(); origToast('🎯 Bet lost at ' + fmt(p) + ' citizens · the AI owes you one'); } }
    AI.quick = () => start(stats.lastMode || 'dream');
    // ---- brain
    const nb4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const open = (i) => !A.S.cells[i] && A.ter[i] !== 'w';
    const within = (i, r, t) => { const x = i % N, y = (i / N) | 0; let n = 0; for (let Y = Math.max(0, y - r); Y <= Math.min(N - 1, y + r); Y++) for (let X = Math.max(0, x - r); X <= Math.min(N - 1, x + r); X++) if (A.S.cells[Y * N + X] === t) n++; return n; };
    const reserve = () => (AI.mode === 'dream' ? 0 : 400);
    const afford = (t) => A.S.lumen - reserve() >= T[t].cost && !(T[t].need && A.S.tier < T[t].need);
    let beacon = null;
    function place(t, list, msg) {
      AI.quiet = true; let n = 0; try { n = A.applyBatch(t, list); } finally { AI.quiet = false; }
      if (n) { try { const g = A.world.bld[list[0]]; if (g && !A.reduced) A.world.fx('spark', g.position); if (g && A.figs.glow) { if (beacon && beacon.parent) beacon.parent.remove(beacon); beacon = A.figs.glow(0xffc46b, 1.4, 1.3, g); } } catch (e) {} AI.builds += n; stats.builds += n; { const now2 = Date.now(); combo = now2 - comboAt < 2500 ? combo + 1 : 1; comboAt = now2; if (combo >= 5 && combo % 5 === 0) { if (combo > (stats.bestCombo || 0)) { stats.bestCombo = combo; saveStats(); origToast('🔥 Build combo ×' + combo + ' · new record!'); } if (combo % 10 === 0 && g && !A.reduced) { try { A.world.fx('spark', g.position); } catch (e) {} } } } if (AI.mode === 'city') stats.cityBuilds += n; AI.focus = list[0]; say(msg.replace('#', n)); if (stats.builds % 25 < n) saveStats(); }
      return n;
    }
    function near(t, score, msg) {
      let best = -1, bs = -1e9; for (let i = 0; i < N * N; i++) { if (A.canPlace(t, i)) continue; const s = score(i); if (s > bs) { bs = s; best = i; } }
      return best >= 0 ? place(t, [best], msg) : 0;
    }
    const center = (i) => -Math.hypot(i % N - N / 2, ((i / N) | 0) - N / 2);
    function zone(t) {
      const st = A.stats, c = [];
      for (let i = 0; i < N * N; i++) if (open(i) && A.pathNear(i)) {
        let s = center(i) * 0.15;
        const sty = stats.style === 'wild' ? (AI.wild || 'balanced') : stats.style; if (sty === 'mega') s += center(i) * 0.6; if (sty === 'sprawl') s -= center(i) * 0.1 + Math.random(); if (sty === 'spiral') { const dx = i % N - N / 2, dy = ((i / N) | 0) - N / 2, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx); s += Math.cos(a * 3 - r * 0.45) * 3; } if (sty === 'fractal') { const x = i % N, y = (i / N) | 0; s += ((x & y & 6) === 0 ? 4 : -2) + center(i) * 0.2; } if (sty === 'ring') { const r = Math.hypot(i % N - N / 2, ((i / N) | 0) - N / 2); s += (Math.cos(r * 0.9) > 0.2 ? 4 : -3); } if (sty === 'isle') { let w = 0; const x0 = i % N, y0 = (i / N) | 0; for (let Y = Math.max(0, y0 - 2); Y <= Math.min(N - 1, y0 + 2); Y++) for (let X = Math.max(0, x0 - 2); X <= Math.min(N - 1, x0 + 2); X++) if (A.ter[Y * N + X] === 'w') w++; s += Math.min(6, w) * 0.9; } if (sty === 'vine') { const dx = i % N - N / 2, dy = ((i / N) | 0) - N / 2, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy); const arm = Math.abs(Math.sin(a * 2.5 + Math.sin(r * 0.35) * 1.4)); s += (arm < 0.35 ? 5 : -2) + (r < 4 ? 2 : 0); } if (sty === 'eco') s += within(i, 2, 'park') * 0.8 - (t === 'i' ? 2 : 0);
        if (t === 'r') s += st.land[i] * 3 - st.poll[i] * 2 - within(i, 3, 'i') * 0.6 + within(i, 2, 'park') * 0.4;
        if (t === 'c') s += within(i, 2, 'r') * 0.4 + st.land[i];
        if (t === 'i') s += (A.crystalNear(i) ? 3 : 0) - within(i, 3, 'r') * 0.7 - within(i, 3, 'c') * 0.2;
        c.push([i, s]);
      }
      if (c.length < 4) return 0;
      c.sort((a, b) => b[1] - a[1]);
      const n = (stats.style === 'sprawl' ? 1.5 : stats.style === 'mega' ? 1.3 : 1) * (AI.insane ? 14 : AI.mode === 'dream' ? 6 : 3) * (AI.mode === 'dream' ? (stats.pace || 1) : 1), list = c.slice(0, n).map((x) => x[0]);
      return place(t, list, { r: 'Zoned # homes on high ground', c: 'Opened # market lots by the homes', i: 'Zoned # industry lots' + (A.crystalNear(list[0]) ? ' on crystal veins' : ' downwind') }[t]);
    }
    function road() {
      const s = A.S, ends = [];
      for (let i = 0; i < N * N; i++) if (s.cells[i] === 'p') {
        const x = i % N, y = (i / N) | 0;
        for (const [dx, dy] of nb4) {
          const line = []; let X = x, Y = y;
          for (let k = 0; k < 5; k++) { X += dx; Y += dy; if (X < 1 || Y < 1 || X >= N - 1 || Y >= N - 1) break; const j = Y * N + X; if (s.cells[j]) break; line.push(j); }
          if (line.length < 3) continue;
          const pn = nb4.filter(([a, b2]) => s.cells[(y + b2) * N + x + a] === 'p').length;
          const land = line.filter((j) => A.ter[j] !== 'w').length;
          const grid = (dx ? y : x) % 4 === (N / 2) % 4 ? 1.5 : 0; const isle = stats.style === 'isle' ? line.filter((j) => A.ter[j] === 'w').length * 1.2 : 0;
          ends.push([line.slice(0, 4), (pn <= 1 ? 2 : 0) + grid + (stats.style === 'isle' ? isle : land * 0.5) + center(line[line.length - 1]) * 0.12 + Math.random() * 1.2]);
        }
      }
      if (!ends.length) return 0; ends.sort((a, b) => b[1] - a[1]);
      if ((AI.insane || stats.style === 'sprawl') && ends[1]) place('p', ends[1][0], 'Laid # glowing path cells');
      return place('p', ends[0][0], 'Laid # glowing path cells');
    }
    function think() {
      const s = A.S, st = A.compute(), cn = st.counts || {};
      if (s.lumen < 0 && s.tax < 15) { s.tax++; say('Raised taxes to ' + s.tax + '% to steady the treasury'); return; }
      if (st.income - st.expense < -20 && s.tax < 13 && AI.mode === 'city') { s.tax++; say('Nudged taxes to ' + s.tax + '%'); return; }
      const powT = s.tier >= 1 && afford('rx') && st.pd - st.ps > 30 ? 'rx' : 'pw';
      if ((!st.pOK || st.imp || (st.ps && st.pd / st.ps > 0.85)) && afford(powT)) return near(powT, (i) => center(i) * 0.5 - within(i, 2, 'r') * 2 + (A.pathNear(i) ? 1 : 0), 'Raised a ' + T[powT].name + ' for more energy');
      const watT = s.tier >= 1 && afford('mc') && st.wd - st.ws > 30 ? 'mc' : 'mw';
      if ((!st.wOK || st.wimp || (st.ws && st.wd / st.ws > 0.85)) && afford(watT)) return near(watT, (i) => center(i) * 0.5 + (A.pathNear(i) ? 1 : 0), 'Sank a ' + T[watT].name + ' for water');
      if (st.smog > 1 && afford('park')) return near('park', (i) => within(i, 1, 'r') * 2 + st.poll[i] * 3, 'Planted a glow garden to clear spore smog');
      const g = A.goalNow(); if (g && g[3] && afford(g[3]) && !A.canPlace(g[3], -1).startsWith('Unlock')) { const n = near(g[3], (i) => center(i) + (A.pathNear(i) ? 3 : 0) + st.land[i] * 2, 'Chasing the goal: built a ' + T[g[3]].name); if (n) return; }
      for (const lm of ['mono', 'whale', 'mother']) if (!cn[lm] && afford(lm)) return near(lm, (i) => center(i) * 0.6 + (A.pathNear(i) ? 3 : 0) + st.land[i] * 3, '✦ Raised the ' + T[lm].name + '!');
      if (!cn.hall && afford('hall')) return near('hall', (i) => center(i) + (A.pathNear(i) ? 3 : 0), 'Built the Hive Council dome');
      if (st.pop > (cn.heal || 0) * 900 + 200 && afford('heal')) return near('heal', (i) => within(i, 3, 'r') + (A.pathNear(i) ? 2 : 0), 'Grew a Healing bloom among homes');
      if (st.pop > (cn.acad || 0) * 1000 + 300 && afford('acad')) return near('acad', (i) => within(i, 3, 'r') + (A.pathNear(i) ? 2 : 0), 'Opened a Star academy');
      if (s.tier >= 2 && (cn.port || 0) < 1 + Math.floor(st.pop / 4000) && afford('port')) return near('port', (i) => -within(i, 3, 'r') + center(i) * 0.2 + (A.pathNear(i) ? 2 : 0), 'Opened a UFO port: tourists incoming');
      if ((cn.park || 0) * (stats.style === 'eco' ? 4 : 12) < (cn.r || 0) && afford('park')) return near('park', (i) => within(i, 2, 'r') * 1.5 - within(i, 1, 'park') * 3 + (A.pathNear(i) ? 1 : 0), 'Planted a glow garden by the homes');
      const order = ['r', 'c', 'i'].sort((a, b) => st.dem[b] - st.dem[a]);
      const zoned = ['r', 'c', 'i'].reduce((t, k) => t + (cn[k] || 0), 0), idle = A.S.cells.filter((t, i) => (t === 'r' || t === 'c' || t === 'i') && !A.S.lv[i]).length;
      if (st.dem[order[0]] > -0.1 && idle < Math.max(8, zoned * 0.25) && afford(order[0])) { if (zone(order[0])) return; }
      if (afford('p') && road()) return;
      if (AI.mode === 'dream' && afford('park') && Math.random() < 0.3 && near('park', (i) => within(i, 2, 'r') - within(i, 1, 'park') * 3 + Math.random(), 'Planted a glow garden as a finishing touch')) return;
      say(idle > 8 ? 'Waiting for ' + idle + ' lots to grow…' : 'Admiring the skyline…');
    }

    function nextWorld(auto) { if (!AI.on || AI.mode !== 'dream') return; AI.flat = 0; AI.peak = 0; const ins = AI.insane; snapDream(); origToast((auto ? '🌌 ' + A.S.name + ' peaked' : '⏭ Leaving ' + A.S.name) + ' · hopping to a new world'); stop(true); if (stats.endless || auto) { const SL = ['balanced', 'sprawl', 'eco', 'mega', 'spiral', 'fractal', 'ring', 'isle', 'vine']; stats.style = SL[(SL.indexOf(stats.style) + 1) % SL.length]; } saveStats(); start(ins ? 'insane' : 'dream'); }
    // ---- cataclysm director: a meteor flattens a few grown buildings; the AI's normal brain rebuilds them
    let cataT = 0;
    function cataclysm() {
      const s = A.S, c = []; for (let i = 0; i < N * N; i++) if (T[s.cells[i]] && T[s.cells[i]].zone && s.lv[i] >= 2) c.push(i);
      if (c.length < 12) return;
      const hit = c[(Math.random() * c.length) | 0], hx = hit % N, hy = (hit / N) | 0; let n = 0;
      for (let y = Math.max(0, hy - 1); y <= Math.min(N - 1, hy + 1); y++) for (let x = Math.max(0, hx - 1); x <= Math.min(N - 1, hx + 1); x++) { const i = y * N + x; if (T[s.cells[i]] && T[s.cells[i]].zone && s.lv[i]) { s.lv[i] = 0; A.world.mark(i, true); n++; } }
      if (!n) return; stats.rebuilt += n; A.compute(); AI.quiet = true; try { A.world.fx('meteor'); } catch (e) {} AI.quiet = false; AI.focus = hit;
      origToast('☄ Cataclysm! A meteor flattens ' + n + ' buildings · the AI rebuilds'); say('☄ Impact: rebuilding ' + n + ' lots');
    }

    // ---- hyperbloom: each milestone in a dream world surges the block the AI is working on up a tier, with fireworks
    function hyperbloom(god) {
      const s = A.S, f = AI.focus >= 0 ? AI.focus : (N * N + N) / 2, fx0 = f % N, fy0 = (f / N) | 0, r = AI.insane ? 5 : 3; let n = 0;
      for (let y = Math.max(0, fy0 - r); y <= Math.min(N - 1, fy0 + r); y++) for (let x = Math.max(0, fx0 - r); x <= Math.min(N - 1, fx0 + r); x++) { const i = y * N + x; if (T[s.cells[i]] && T[s.cells[i]].zone && s.lv[i] >= 1 && s.lv[i] < 3) { s.lv[i]++; A.world.mark(i, true); n++; } }
      if (god) { const lv = AI.insane ? 600 : 250; s.lumen += lv; if (!n) { say('✋ You blessed the land: +◈' + lv + ' for the AI'); return; } }
      if (!n) return; A.compute(); AI.quiet = true; try { if (!A.reduced) { A.world.fx('comet'); A.world.fx('spores'); A.world.fx('trader'); } } catch (e) {} AI.quiet = false; say((god ? '✋ Your blessing: ' : '🌸 Hyperbloom! ') + n + ' buildings surge a tier');
    }
    // ---- god hand: while the AI dreams, a tap on the land blesses that block (cooldown 6s)
    let blessAt = 0, down = null; const cv = document.getElementById('c');
    if (cv) { cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
      cv.addEventListener('pointerup', (e) => { if (!AI.on || AI.mode !== 'dream' || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || e.button) return; const i = A.world.pick(e.clientX, e.clientY); if (i < 0) return; const now = Date.now(); if (now - blessAt < 6000) { origToast('✋ Blessing recharges in ' + Math.ceil((6000 - (now - blessAt)) / 1000) + 's'); return; } blessAt = now; AI.focus = i; stats.blessings = (stats.blessings || 0) + 1; hyperbloom(true); saveStats(); }); }
    // ---- decision log panel (📜): the AI's last 24 moves with times
    const lg = document.createElement('div'); lg.id = 'aiLog'; lg.hidden = true; lg.setAttribute('role', 'log'); lg.setAttribute('aria-label', 'AI Mayor decisions');
    lg.style.cssText = 'position:fixed;left:8px;right:8px;bottom:120px;max-width:340px;margin:0 auto;max-height:40%;overflow:auto;z-index:8;font-size:11px;line-height:1.35;padding:8px 10px;border-radius:14px;background:rgba(28,16,58,.9);backdrop-filter:blur(12px);border:1px solid rgba(255,140,230,.35);color:#efe6ff';
    document.body.appendChild(lg);
    function drawLog() { if (lg.hidden) return; lg.innerHTML = '<b style="color:#ffc46b">🤖 AI Mayor decisions</b>' + (hist.length ? hist.map((h) => { const s2 = Math.round((Date.now() - h.at) / 1000); return '<div style="display:flex;gap:8px;border-top:1px solid rgba(255,255,255,.08);padding:2px 0"><i style="font-style:normal;color:#9f8fd0;flex:none;width:34px;font-variant-numeric:tabular-nums">' + (s2 < 60 ? s2 + 's' : Math.floor(s2 / 60) + 'm') + '</i><span>' + h.t.replace(/[&<>]/g, '') + '</span></div>'; }).join('') : '<div>Waiting for its first move…</div>'); }
    const toggleLog = (v) => { lg.hidden = v === undefined ? !lg.hidden : !v; drawLog(); };
    setTimeout(() => { const lb = document.createElement('button'); lb.id = 'aiLogB'; lb.textContent = '📜'; lb.title = 'Decision log (L)'; lb.setAttribute('aria-label', 'Show the AI decision log (L)'); lb.style.cssText = 'flex:none;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.14);font-weight:700'; lb.addEventListener('click', () => toggleLog()); bar.insertBefore(lb, $('aiStop')); }, 0);
    addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return; if (e.key.toLowerCase() === 'l' && AI.on) { e.preventDefault(); toggleLog(); } });
    // ---- loop: brain ticks and a gentle cinematic camera
    let lastT = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
      if (!AI.on || document.hidden || C.visible === false) return;
      stats.watchMin = (stats.watchMin || 0) + dt / 60;
      if (stats.style === 'wild') { AI.wildT = (AI.wildT || 99) + dt; if (AI.wildT > 40) { AI.wildT = 0; const WL = ['balanced', 'sprawl', 'eco', 'mega', 'spiral', 'fractal', 'ring', 'isle', 'vine'].filter((x) => x !== AI.wild); AI.wild = WL[(Math.random() * WL.length) | 0]; } }
      { const p = A.stats.pop || 0; while (AI.ms < MS.length && p >= MS[AI.ms]) { let rec = ''; if (AI.mode === 'dream' && MS[AI.ms] === 10000 && AI.t0) { const mins = +((Date.now() - AI.t0) / 60000).toFixed(1), sk = AI.styleAt || stats.style; stats.fast = stats.fast || {}; if (!stats.fast[sk] || mins < stats.fast[sk]) { rec = ' ⏱ ' + mins + ' min · new ' + sk + ' record!'; stats.fast[sk] = mins; saveStats(); } } origToast('🏆 ' + (A.S.name || 'City') + ' hits ' + MS[AI.ms].toLocaleString() + ' citizens!' + rec); AI.ms++; if (!A.reduced) swoop = 4.5; if (AI.mode === 'dream') hyperbloom(); if (AI.mode === 'dream') { AI.quiet = true; try { A.event('swarm'); A.event('swarm'); } catch (e) {} AI.quiet = false; } }
        if (AI.mode === 'dream') { if (p > (AI.peak || 0) + 50) { AI.peak = p; AI.flat = 0; } else AI.flat = (AI.flat || 0) + dt; if (stats.endless && AI.flat > 90 && Date.now() - AI.t0 > 120000) { AI.flat = 0; AI.peak = 0; const ins = AI.insane; snapDream(); origToast('🌌 ' + A.S.name + ' peaked · hopping to a new world'); stop(true); nextWorld(true); return; } } }
      const gap = (AI.insane ? 0.15 : AI.mode === 'dream' ? 0.45 : 1.6 / Math.max(1, A.S.speed || 1)) / (stats.pace || 1);
      AI.step += dt; if (AI.step >= gap && A.S.speed) { AI.step = 0; try { think(); A.ui.refresh(); errs = 0; if (AI.mode === 'dream' && A.stats.pop > stats.dreamBestPop) stats.dreamBestPop = A.stats.pop; } catch (e) { console.warn('AI', e); if (++errs > 20) { stop(true); origToast('🤖 The AI Mayor hit a snag and stepped down; your city is safe'); } } }
      if (AI.mode === 'dream' && A.S.speed && Math.random() < dt * (AI.insane ? 0.15 : 0.02) * (1 + Math.min(3, (A.stats.pop || 0) / 20000))) { AI.quiet = true; try { A.event('swarm'); } catch (e) {} AI.quiet = false; }
      if (AI.mode === 'dream' && A.S.speed && !A.reduced) { specT += dt; if (specT > (AI.insane ? 25 : 50)) { specT = 0; const sp2 = SPEC[(Math.random() * SPEC.length) | 0]; AI.quiet = true; try { A.event(sp2[0]); } catch (e) {} AI.quiet = false; say(sp2[1]); } }
      if (AI.mode === 'dream' && stats.cata && A.S.speed) { cataT += dt; if (cataT > (AI.insane ? 35 : 70)) { cataT = 0; try { cataclysm(); } catch (e) { console.warn(e); } } }
      try { betTick(); } catch (e) {}
      snapT += dt; if (snapT > 8) { snapT = 0; snapDream(); }
      const W = A.world;
      if (AI.insane && !A.reduced && W.pitch !== undefined) W.pitch = 0.8 + Math.sin(now / 7000) * 0.22;
      if (swoop > 0 && !A.reduced) { swoop -= dt; const k2 = Math.min(1, dt * 1.5); W.pitch += (0.5 - W.pitch) * k2; W.dist += (12 - W.dist) * k2; W.yaw += dt * 0.35; }
      else if (AI.focus >= 0 && !A.reduced) {
        const fx = AI.focus % N - N / 2 + 0.5, fz = ((AI.focus / N) | 0) - N / 2 + 0.5, k = Math.min(1, dt * 0.8);
        W.target.x += (fx * 0.6 - W.target.x) * k; W.target.z += (fz * 0.6 - W.target.z) * k;
        W.yaw += dt * (AI.insane ? 0.12 : 0.05);
        if (AI.mode === 'dream' && Number.isFinite(W.dist)) { const want = 26 + Math.sin(now / 9000) * 8 + Math.min(10, A.stats.pop / 3000); W.dist += (want - W.dist) * Math.min(1, dt * 0.3); }
      }
    }
    requestAnimationFrame(loop);
    // Resume whatever was running before a reload: a dream world from its snapshot, or the AI playing your city.
    try { const ss = C.recall ? C.recall('aiSession', null) : null; if (ss && typeof ss === 'object' && Date.now() - (+ss.at || 0) < 7 * 864e5) {
      if (ss.mode === 'city') setTimeout(() => start('city'), 600);
      else if (ss.mode === 'dream' && typeof ss.key === 'string' && ss.key.startsWith('dreams/')) Promise.resolve().then(() => C.store.get(ss.key)).then((r) => { const d = r && (r.text ? JSON.parse(r.text) : r.json); if (d && Array.isArray(d.cells)) start(ss.insane ? 'insane' : 'dream', d); else session(false); }).catch(() => session(false)); } } catch (e) {}
    document.addEventListener('visibilitychange', () => { if (document.hidden && AI.mode === 'dream') snapDream(); });

    try {
      if (C.actions && C.actions.define) {
        C.actions.define('aiPlay', { description: 'Let the AI Mayor play: "dream" builds a wild sandbox world (your city stays safe), "city" builds your own city', input: { type: 'object', properties: { mode: { type: 'string', description: 'dream | insane | city; dream if left out' }, style: { type: 'string', description: 'balanced | sprawl | eco | mega | spiral | fractal | ring | isle | vine | wild (optional)' }, cataclysms: { type: 'boolean', description: 'meteors flatten blocks for the AI to rebuild (optional)' } } } }, (a) => { if (typeof a.cataclysms === 'boolean') { stats.cata = a.cataclysms; saveStats(); } const q = String(a.mode || 'dream').toLowerCase(); const m = q.includes('city') ? 'city' : q.includes('insane') ? 'insane' : 'dream'; if (['balanced', 'sprawl', 'eco', 'mega', 'spiral', 'fractal', 'ring', 'isle', 'vine', 'wild'].includes(a.style)) { stats.style = a.style; saveStats(); } start(m); return { message: m === 'dream' ? 'The AI Mayor is dreaming up ' + A.S.name + '.' : 'The AI Mayor is building ' + (A.S.name || 'your city') + '.', mode: m }; });
        C.actions.define('aiPace', { description: 'Set how fast the AI Mayor thinks: 1, 2 or 4', input: { type: 'object', properties: { pace: { type: 'number', description: '1, 2, 4 or 8 (ludicrous)' } }, required: ['pace'] } }, (a) => { const p = [1, 2, 4, 8].includes(+a.pace) ? +a.pace : 1; stats.pace = p; saveStats(); try { showPace(); } catch (e) {} return { message: 'AI pace set to ' + p + '×.', pace: p }; });
        C.actions.define('aiNextWorld', { description: 'While the AI dreams, leave this world (it is saved) and dream a fresh one', input: { type: 'object', properties: {} } }, () => { if (!AI.on || AI.mode !== 'dream') throw new Error('The AI is not dreaming a world right now.'); nextWorld(); return { message: 'The AI Mayor hops to ' + A.S.name + '.' }; });
        C.actions.define('aiStop', { description: 'Stop the AI Mayor (a dream world ends and your city comes back)', input: { type: 'object', properties: {} } }, () => { if (!AI.on) return { message: 'The AI Mayor is not playing.' }; const n = AI.builds; stop(); return { message: 'AI Mayor stopped after ' + n + ' builds.', builds: n }; });
        C.actions.define('aiStats', { description: 'How much the AI Mayor has built, and its best dream world', readOnly: true, input: { type: 'object', properties: {} } }, () => Object.assign({ message: 'AI Mayor: ' + stats.builds + ' builds, ' + stats.dreams + ' dream worlds, best dream ' + stats.dreamBestPop + ' citizens, best world score ' + (stats.bestScore || 0) + (Object.keys(stats.styleBest || {}).length ? ', best by style ' + Object.entries(stats.styleBest).map(([k, v]) => k + ' ★' + v).join(', ') : '') + (stats.rebuilt ? ', ' + stats.rebuilt + ' buildings rebuilt after cataclysms' : '') + (stats.blessings ? ', ' + stats.blessings + ' blessings from you' : '') + (stats.bestCombo ? ', best build combo ×' + stats.bestCombo : '') + (AI.on ? ' · playing now (' + AI.mode + ')' : '') + '.' }, stats, { playing: AI.on, mode: AI.mode }));
      }
      C.describeMemory && C.describeMemory({ ai: 'AI Mayor tally { v:1, builds, dreams, dreamBestPop, dreamBestName, cityBuilds, insane, pace: 1|2|4, style: balanced|sprawl|eco|mega|spiral|fractal|ring|wild, watchMin: minutes spent watching, styleBest: { style: best ★ score }, cata: cataclysms on, fast: { style: fastest minutes to 10k citizens }, lastMode, rebuilt: buildings rebuilt after meteors, blessings: taps that blessed a dream world, bestCombo: longest chain of AI builds each under 2.5s apart, bets: { won, lost } ◈500 wagers on the AI hitting a population in 3 min, history: [{ name, pop, builds, insane, at, key }] (last 8 dreams; key = store snapshot dreams/<name>.json to resume) }. Dream worlds are never saved over "city".' });
    } catch (e) {}
  }
})();
