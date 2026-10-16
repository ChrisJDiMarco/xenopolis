/* AI architect: plays a city with the same moves a tap makes (A.applyBatch, A.actions.setTax).
   It builds wild sandbox worlds in their own save slot (memory "aiWorld", past ones in the store under worlds/),
   so your own city is never touched, or runs your city as its mayor when you ask (it never bulldozes). */
(function (A) {
  const N = A.N, T = A.TYPES, H = N / 2, $ = (id) => document.getElementById(id), nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SP = new Set(); // a square spiral, arms three cells apart
  { let x = H, y = H, d = 0, len = 3; const D = [[1, 0], [0, 1], [-1, 0], [0, -1]]; SP.add(y * N + x);
    for (let k = 0; k < 22; k++) { for (let j = 0; j < len; j++) { x += D[d][0]; y += D[d][1]; if (x >= 0 && y >= 0 && x < N && y < N) SP.add(y * N + x); } d = (d + 1) % 4; if (!(d % 2)) len += 3; } }
  // Street plans: "is this cell a path?", measured from the center. Every other cell gets frontage.
  const STY = {
    grid: ['Hive Grid', 'a tight lattice of blocks', (x, y) => !(x % 3) || !(y % 3)],
    rings: ['Ring City', 'rings around a glowing heart', (x, y) => !(Math.max(Math.abs(x), Math.abs(y)) % 3) || !x || !y],
    spiral: ['Spiral Bloom', 'one path coiling outward', (x, y) => SP.has((y + H) * N + x + H)],
    weave: ['Brickweave', 'staggered streets like brickwork', (x, y) => !(y % 3) || !((x + (Math.floor(y / 3) & 1) * 2) % 4)],
    garden: ['Garden Hive', 'wide blocks, a garden in each', (x, y) => !(x % 4) || !(y % 4)]
  };
  const ai = A.ai = { on: false, say: '', STY, acc: 0, taxM: -1, n: 0, homeName: '' };
  const plan = (i) => (STY[A.S.style] || STY.grid)[2](i % N - H, ((i / N) | 0) - H);
  const dist = (i) => Math.hypot(i % N - H, ((i / N) | 0) - H);
  const rnd = (i) => { const v = Math.sin(i * 12.9898 + (A.S.seed % 997)) * 43758.5453; return v - Math.floor(v); };
  const free = (t, i) => !A.S.cells[i] && (A.ter[i] !== 'w' || t === 'p');
  function near(i, t, r) { const x = i % N, y = (i / N) | 0; let n = 0; for (let Y = Math.max(0, y - r); Y <= Math.min(N - 1, y + r); Y++) for (let X = Math.max(0, x - r); X <= Math.min(N - 1, x + r); X++) if (A.S.cells[Y * N + X] === t) n++; return n; }
  function best(t, score) { if (A.canPlace(t, -1)) return -1; let b = -1, bs = -1e9; for (let i = 0; i < N * N; i++) { if (!free(t, i)) continue; const v = score(i); if (v != null && v > bs) { bs = v; b = i; } } return b; }
  function act(t, cells, say) { const was = ai.say; ai.say = '🤖 ' + say; const n = cells.length ? A.applyBatch(t, cells, 'ai') : 0; if (n) A.world.aiAt(cells[0]); else ai.say = was; return n; }
  // Off-plan sites near a ring around the heart; utilities keep street frontage free for zones.
  const site = (t, ring) => best(t, (i) => plan(i) ? null : -Math.abs(dist(i) - ring) - ((T[t].power || T[t].water) && A.pathNear(i) ? 0.8 : 0) - (A.ter[i] === 'x' ? 1.5 : 0) - (t === 'rx' || t === 'port' ? near(i, 'r', 3) * 0.5 : 0) + rnd(i) * 0.6);
  const ZS = {
    r: (i, st) => st.land[i] * 3 - st.poll[i] * 2 - dist(i) * 0.1 + near(i, 'r', 1) * 0.3 - near(i, 'i', 2) * 0.6,
    c: (i) => -dist(i) * 0.18 + near(i, 'c', 1) * 0.3 + near(i, 'r', 2) * 0.1,
    i: (i) => (A.crystalNear(i) ? 1.5 : 0) + dist(i) * 0.05 + near(i, 'i', 1) * 0.4 - near(i, 'r', 2) * 0.5
  };
  const ZN = { r: 'spore-pod homes', c: 'mushroom markets', i: 'refinery lots' };
  function zone(t, st) {
    if (A.canPlace(t, -1)) return 0; const cand = [];
    for (let i = 0; i < N * N; i++) if (free(t, i) && !plan(i) && A.pathNear(i)) cand.push([i, ZS[t](i, st) - (A.ter[i] === 'x' ? 1.5 : 0) + rnd(i) * 0.3]);
    if (!cand.length) return 0;
    cand.sort((a, b) => b[1] - a[1]); const b = cand[0][0];
    const pick = cand.filter(([i]) => Math.abs(i % N - b % N) <= 1 && Math.abs(((i / N) | 0) - ((b / N) | 0)) <= 1).slice(0, 4).map((p) => p[0]);
    return act(t, pick, 'Zoned ' + pick.length + ' ' + ZN[t] + (t === 'i' && A.crystalNear(b) ? ' by the crystals' : '') + ' · demand ' + Math.round(st.dem[t] * 100) + '%');
  }
  function grow() {
    const s = A.S, any = s.cells.includes('p'); let b = -1, bs = -1e9, dir = null;
    if (A.canPlace('p', -1)) return 0;
    for (let i = 0; i < N * N; i++) {
      if (s.cells[i] || !plan(i)) continue;
      if (!any) { if (-dist(i) > bs) { bs = -dist(i); b = i; } continue; }
      const x = i % N, y = (i / N) | 0;
      for (const [dx, dy] of nb) { const X = x - dx, Y = y - dy; if (X < 0 || Y < 0 || X >= N || Y >= N || s.cells[Y * N + X] !== 'p') continue;
        const v = -dist(i) - (A.ter[i] === 'w' ? 4 : 0) + rnd(i); if (v > bs) { bs = v; b = i; dir = [dx, dy]; } }
    }
    if (b < 0) return 0; const run = [b];
    for (let k = 0, x = b % N, y = (b / N) | 0; dir && k < 3; k++) { x += dir[0]; y += dir[1]; const j = y * N + x; if (x < 0 || y < 0 || x >= N || y >= N || s.cells[j] || !plan(j)) break; run.push(j); }
    return act('p', run, 'Laid ' + run.length + ' cell' + (run.length > 1 ? 's' : '') + ' of glowing path' + (A.ter[b] === 'w' ? ' across the lavender sea' : ''));
  }
  function tax(v, why) { ai.say = '🤖 Taxes to ' + v + '%: ' + why; A.actions.setTax(v); return 1; }
  // One move per beat, most urgent first: energy, water, money, smog, civic, landmarks, zones, streets.
  ai.step = function () {
    const s = A.S, st = A.stats, c = st.counts || {}, L = s.lumen, keep = s.ai ? 120 : 400;
    const ok = (t) => !A.canPlace(t, -1) && L - T[t].cost >= keep;
    const util = (big, small, low, supply, demand, say) => {
      if (supply >= demand * 1.15 + 6 && !low) return 0;
      const t = s.tier >= 1 && ok(big) && demand > 110 ? big : small; if (!ok(t) && !(low && !A.canPlace(t, -1))) return 0;
      const i = site(t, 4 + s.tier * 2); return i >= 0 && act(t, [i], say + ' ' + Math.round(demand) + '/' + supply + ': ' + (t === big ? 'raised a ' : 'placed a ') + T[t].name);
    };
    if (util('rx', 'pw', !st.pOK, st.ps, st.pd, '⚡ Energy')) return;
    if (util('mc', 'mw', !st.wOK, st.ws, st.wd, '💧 Water')) return;
    const net = st.income - st.expense;
    if (ai.taxM !== s.month) {
      ai.taxM = s.month;
      if ((L < 300 || (net < 0 && L < 2000)) && s.tax < 14) return tax(s.tax + 1, 'the budget is thin');
      if (st.happy < 55 && s.tax > 6 && net > 0) return tax(s.tax - 1, 'citizens want relief');
      if (L > 20000 && s.tax > 7 && st.happy < 80) return tax(s.tax - 1, 'the treasury overflows');
    }
    if (L < keep) { ai.say = '🤖 Saving Lumen · ' + Math.round(L) + ' in the treasury'; return A.ui.refresh(); }
    const zones = (c.r || 0) + (c.c || 0) + (c.i || 0);
    if (st.smog > 0.9 && (c.park || 0) < zones / 4 + 2 && ok('park')) { const i = best('park', (j) => !plan(j) && st.poll[j] > 0.4 && near(j, 'r', 2) ? st.poll[j] * (1 + near(j, 'r', 2)) : null); if (i >= 0 && act('park', [i], '🌿 Spore smog over homes: planted a Glow garden')) return; }
    if (!c.hall && st.pop >= 40 && ok('hall')) { const i = site('hall', 1.5); if (i >= 0 && act('hall', [i], '🏛 The Hive Council dome opens at the heart of ' + s.name)) return; }
    for (const t of ['mono', 'whale', 'mother']) if (!c[t] && ok(t)) { const i = site(t, 2.5 + s.tier); if (i >= 0 && act(t, [i], '✦ The ' + T[t].name + ' rises over ' + s.name)) return; }
    const svc = [['heal', st.pop > (c.heal || 0) * 900 + 250, '💗 A Healing bloom for ' + (st.pop | 0) + ' citizens'],
      ['acad', st.pop > (c.acad || 0) * 1000 + 350, '🎓 A Star academy: smarter citizens, richer taxes'],
      ['port', s.tier >= 1 && (c.port || 0) < (s.tier >= 3 ? 2 : 1), '🛸 A UFO port opens: tourists incoming']];
    for (const [t, need, say] of svc) if (need && ok(t)) { const i = site(t, 3 + s.tier); if (i >= 0 && act(t, [i], say)) return; }
    if ((c.park || 0) * (s.style === 'garden' ? 5 : 10) < zones && ok('park')) {
      const i = best('park', (j) => plan(j) ? null : (A.pathNear(j) ? 0 : 2) + near(j, 'r', 2) * 0.4 - near(j, 'park', 2) - dist(j) * 0.05);
      if (i >= 0 && act('park', [i], '🌿 A Glow garden lifts land value nearby')) return;
    }
    let open = 0; for (let i = 0; i < N * N; i++) if (free('r', i) && !plan(i) && A.pathNear(i)) open++;
    for (const t of ['r', 'c', 'i'].sort((a, b) => st.dem[b] - st.dem[a])) {
      if (st.dem[t] < -0.02 || !ok(t)) continue;
      let lots = 0; for (let i = 0; i < N * N; i++) if (s.cells[i] === t && !s.lv[i]) lots++;
      if (lots < 3 + s.tier * 2 && zone(t, st)) return;
    }
    if (open < 8 && grow()) return;
    ai.say = '🤖 Watching ' + (s.name || 'the city') + ' grow · 👽 ' + (st.pop | 0).toLocaleString() + ' · ◈' + Math.round(L).toLocaleString(); A.ui.refresh();
  };
  ai.tick = function (dt) {
    if (!ai.on || !A.S.started || !A.S.speed) return;
    ai.acc += dt * A.S.speed; if (ai.acc < 1.1) return; ai.acc = 0;
    try { ai.step(); } catch (e) { console.warn(e); }
    if (++ai.n % 15 === 0) record();
  };
  // ---- worlds: the AI's own slot, a gallery of the ones it built, and the way home
  const SYL = [['Vael', 'Zan', 'Ory', 'Nyx', 'Thal', 'Kor', 'Ise', 'Myr', 'Quor', 'Sel'], ['ara', 'ion', 'eth', 'uva', 'ix', 'ora', 'une', 'is', 'oth', 'ael'], ['', ' Prime', ' Reach', ' Deep', ' Halo', '']];
  const worldName = (seed) => { const r = A.rng(seed + 3); return SYL.map((a) => a[(r() * a.length) | 0]).join(''); };
  function worlds() { let l = []; try { l = window.cabinet && cabinet.recall ? cabinet.recall('aiWorlds', []) : []; } catch (e) {} return (Array.isArray(l) ? l : []).filter((w) => w && Number.isFinite(w.seed) && typeof w.name === 'string').slice(0, 12); }
  function record() {
    const s = A.S; if (!s.ai) return;
    const e = { seed: s.seed, name: s.name.slice(0, 40), style: s.style, biome: s.biome, pop: Math.max(s.best || 0, A.stats.pop | 0), tier: s.tier, months: s.month, at: new Date().toISOString().slice(0, 10) };
    try { window.cabinet && cabinet.remember && cabinet.remember('aiWorlds', [e, ...worlds().filter((w) => w.seed !== s.seed)].slice(0, 12)); } catch (x) {}
  }
  const archive = (S) => { try { record(); const p = window.cabinet && cabinet.store && cabinet.store.put('worlds/' + S.seed + '.json', S); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  function enter(S) {
    A.flushSave(); if (A.S.ai) record(); else ai.homeName = A.S.name;
    A.S = S; A.genTerrain(S.seed); A.undoStack.length = 0; if (!S.ai) A.undoStack.push(...A.loadUndo());
    A.compute(); A.world.rebuildAll(); if (S.ai) A.world.aiView(); else A.world.loadView();
    A.save(true); A.ui.savePrefs(); A.ui.refresh();
  }
  ai.found = function (style) {
    const ks = Object.keys(STY); style = STY[style] ? style : ks[(Math.random() * ks.length) | 0];
    if (A.S.ai) archive(A.S);
    const S = A.fresh(''); Object.assign(S, { ai: 1, style, biome: 1 + ((Math.random() * (A.BIOMES.length - 1)) | 0), started: true, speed: 3, lumen: 30000 });
    S.name = worldName(S.seed); S.log.push({ m: 0, t: S.name + ' founded by the AI architect: a ' + STY[style][0] + ' on a ' + A.BIOMES[S.biome][0] + ' world.', d: new Date().toISOString().slice(0, 10) });
    ai.on = true; ai.taxM = -1; ai.say = '🤖 Surveying ' + S.name + '…'; enter(S); record();
    A.ui.toast('✦ ' + S.name + ' · ' + STY[style][0] + ' · the AI has the controls');
  };
  ai.resume = function () { const S = A.load('ai'); if (!S) return ai.found(); ai.on = true; ai.say = '🤖 Back at work on ' + S.name; enter(S); };
  ai.home = function () { if (!A.S.ai) return; ai.on = false; enter(A.load('city')); A.ui.setTool(A.world.tool); A.ui.toast('↩ Back in ' + (A.S.name || 'your city') + ', just as you left it'); };
  ai.visit = function (seed) {
    if (A.S.ai && A.S.seed === seed) return A.ui.toast('You are in ' + A.S.name + ' now');
    const cur = A.load('ai'); if (cur && cur.seed === seed) return ai.resume();
    Promise.resolve().then(() => cabinet.store.get('worlds/' + seed + '.json')).then((r) => {
      const raw = r && typeof r.text === 'string' ? JSON.parse(r.text) : null; if (!raw || !raw.ai) throw new Error('gone');
      if (A.S.ai) archive(A.S); ai.on = true; ai.say = '🤖 Back in ' + raw.name; enter(A.validate(raw)); A.ui.toast('✦ Back in ' + A.S.name);
    }).catch(() => A.ui.toast('That world was not kept. Tap ✦ Watch AI for a new one.'));
  };
  ai.toggle = function (on) {
    on = on == null ? !ai.on : !!on; if (on === ai.on || (on && !A.S.started)) return;
    ai.on = on; ai.acc = 0; ai.say = on ? '🤖 ' + (A.S.ai ? 'Back at the controls of ' : 'The AI mayor takes over ') + A.S.name : '';
    if (!on) A.ui.setTool(A.world.tool);
    A.ui.savePrefs(); A.ui.refresh();
    A.ui.toast(on ? (A.S.ai ? '🤖 The AI is building again' : '🤖 AI mayor on: it builds with your Lumen and never bulldozes · I stops it') : '✋ You have the controls');
  };
  ai.key = () => (ai.on ? ai.toggle(false) : A.S.ai ? ai.toggle(true) : ai.sheet(true));
  ai.sheet = function (show) {
    $('aiSheet').hidden = !show; if (!show) return;
    const cur = A.load('ai'), home = A.S.ai ? ai.homeName || 'your city' : A.S.name || 'your city';
    $('aiP').textContent = 'An AI architect founds a fresh alien world and builds it on its own, fast, while you watch. ' + home + ' stays saved exactly as it is.';
    $('aiStyles').innerHTML = '<button class="hot" data-st="">✦ Surprise me<i>any plan, any planet</i></button>' + Object.keys(STY).map((k) => '<button data-st="' + k + '">' + STY[k][0] + '<i>' + STY[k][1] + '</i></button>').join('');
    const r = $('aiResume'); r.hidden = !cur || (A.S.ai && A.S.seed === cur.seed); if (cur) r.textContent = '▶ Resume ' + cur.name + ' · ' + A.TIERS[cur.tier][0];
    $('aiMayor').hidden = !!A.S.ai; $('aiMayor').textContent = '🤖 Let the AI mayor run ' + home;
    setTimeout(() => { const b = $('aiStyles').querySelector('button'); if (b) b.focus(); }, 50);
  };
  ai.paint = function (panel) {
    const s = A.S, home = !s.ai, bar = $('aiBar');
    $('aiB').hidden = !home || ai.on || !s.started; bar.hidden = home && !ai.on;
    if (!bar.hidden) {
      $('aiName').textContent = home ? '🤖 AI mayor is running ' + (s.name || 'your city') : (ai.on ? '🤖 ' : '✦ ') + s.name + ' · ' + (STY[s.style] || STY.grid)[0];
      $('aiGo').textContent = ai.on ? '✋ Take over' : '▶ AI build'; $('aiNew').hidden = $('aiHome').hidden = home;
      $('aiHome').textContent = '↩ ' + (ai.homeName || 'My city');
    }
    if (ai.on) $('hint').textContent = '';
    $('aiB').style.bottom = $('dock').offsetHeight + 10 + 'px';
    if (!panel) return;
    const l = worlds();
    $('worlds').innerHTML = l.length ? l.map((w) => '<li><span>' + esc(w.name) + ' <i>' + (STY[w.style] || STY.grid)[0] + ' · 👽 ' + (w.pop | 0).toLocaleString() + ' · ' + A.TIERS[Math.min(4, Math.max(0, w.tier | 0))][0] + '</i></span><button data-seed="' + (w.seed | 0) + '">' + (s.ai && s.seed === w.seed ? 'Here' : 'Visit') + '</button></li>').join('')
      : '<li>None yet: tap ✦ Watch AI and it builds one while you watch.</li>';
  };
  ai.init = function () {
    if (!ai.homeName) ai.homeName = A.S.ai ? A.load('city').name : A.S.name;
    $('aiB').addEventListener('click', () => ai.sheet(true));
    $('aiNo').addEventListener('click', () => ai.sheet(false));
    $('aiStyles').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ai.sheet(false); ai.found(b.dataset.st); } });
    $('aiResume').addEventListener('click', () => { ai.sheet(false); ai.resume(); });
    $('aiMayor').addEventListener('click', () => { ai.sheet(false); ai.toggle(true); });
    $('aiGo').addEventListener('click', () => ai.toggle());
    $('aiNew').addEventListener('click', () => ai.sheet(true));
    $('aiHome').addEventListener('click', () => ai.home());
    $('worlds').addEventListener('click', (e) => { const b = e.target.closest('button[data-seed]'); if (b) ai.visit(+b.dataset.seed); });
    try { window.cabinet && cabinet.keep && cabinet.keep('worlds/', { last: 12 }); } catch (e) {}
  };
})(window.App);
