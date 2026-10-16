(function (A) {
  const N = A.N, T = A.TYPES;
  const POP = [0, 14, 45, 120], JOB = [0, 10, 30, 80];
  A.stats = { pop: 0, jc: 0, ji: 0, ps: 0, pd: 0, ws: 0, wd: 0, happy: 60, dem: { r: 0.6, c: 0.1, i: 0.3 }, income: 0, expense: 0, poll: new Float32Array(N * N), land: new Float32Array(N * N), counts: {} };
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  A.pathNear = function (i) {
    const x = i % N, y = (i / N) | 0;
    for (const [dx, dy] of nb) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < N && Y < N && A.S.cells[Y * N + X] === 'p') return true; }
    return false;
  };
  A.crystalNear = function (i) { const x = i % N, y = (i / N) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < N && Y < N && A.ter[Y * N + X] === 'x' && !A.S.cells[Y * N + X]) return true; } return false; };
  function spread(arr, i, r, amt) {
    const x = i % N, y = (i / N) | 0;
    for (let Y = Math.max(0, y - r); Y <= Math.min(N - 1, y + r); Y++) for (let X = Math.max(0, x - r); X <= Math.min(N - 1, x + r); X++) {
      const d = Math.hypot(X - x, Y - y); if (d <= r) arr[Y * N + X] += amt * (1 - d / (r + 1));
    }
  }
  A.compute = function () {
    const s = A.S, st = A.stats;
    const poll = new Float32Array(N * N), land = new Float32Array(N * N).fill(0.45);
    let pop = 0, jc = 0, ji = 0, ps = 0, pd = 0, ws = 0, wd = 0, paths = 0, up = 0; const counts = {};
    for (let i = 0; i < N * N; i++) {
      const t = s.cells[i]; if (!t) { if (A.ter[i] === 'f') spread(land, i, 1, 0.03); continue; }
      counts[t] = (counts[t] || 0) + 1; const l = s.lv[i];
      if (t === 'r') { pop += POP[l]; pd += l * 3; wd += l * 3; }
      else if (t === 'c') { jc += JOB[l]; pd += l * 4; wd += l * 2; }
      else if (t === 'i') { ji += JOB[l] * (A.crystalNear(i) ? 1.7 : 1.2); pd += l * 6; wd += l * 4; if (l) spread(poll, i, 4, l * 0.5); }
      else if (t === 'p') paths++;
      else {
        ps += T[t].power || 0; ws += T[t].water || 0; up += T[t].up || 0;
        if (t === 'park') spread(land, i, 3, 0.18);
        else if (t === 'port') spread(poll, i, 2, 0.4);
        else if (t === 'rx') spread(poll, i, 3, 0.7);
        else if (T[t].lm) spread(land, i, 7, 0.25);
        else if (!T[t].power && !T[t].water) spread(land, i, 5, 0.1);
      }
    }
    for (let i = 0; i < N * N; i++) { if (A.ter[i] === 'w') spread(land, i, 1, 0.02); if (s.cells[i] === 'park') spread(poll, i, 2, -0.35); }
    for (let i = 0; i < N * N; i++) if (poll[i] < 0) poll[i] = 0;
    for (let i = 0; i < N * N; i++) land[i] = Math.max(0, Math.min(1, land[i] - poll[i] * 0.12));
    if (s.month < (s.auroraUntil || 0)) ps += 40;
    if (s.month < (s.tideUntil || 0)) ws += 60;
    const imp = ps > 0 && pd > ps && pd - ps <= 20 + s.tier * 20 && s.lumen > 0 ? Math.ceil(pd - ps) : 0;
    const wimp = ws > 0 && wd > ws && wd - ws <= 15 + s.tier * 15 && s.lumen > 0 ? Math.ceil(wd - ws) : 0;
    const pOK = ps > 0 && pd <= ps + imp, wOK = ws > 0 && wd <= ws + wimp;
    let rl = 0, rn = 0; for (let i = 0; i < N * N; i++) if (s.cells[i] === 'r' && s.lv[i]) { rl += land[i]; rn++; }
    let happy = 48 + (rn ? rl / rn : 0.5) * 30 + (pOK ? 4 : -8) + (wOK ? 4 : -8) - (s.tax - 9) * 2.5;
    if (counts.heal && counts.heal * 900 >= pop) happy += 6;
    if (counts.acad && counts.acad * 1000 >= pop) happy += 6;
    if (counts.hall) happy += 5;
    let pl = 0; for (let i = 0; i < N * N; i++) if (s.cells[i] === 'r' && s.lv[i]) pl += poll[i];
    const smog = rn ? pl / rn : 0; happy -= Math.min(15, smog * 6);
    if (s.month < s.boostUntil) happy += s.boost;
    happy = Math.max(0, Math.min(100, happy));
    const tx = (s.tax - 9) * 0.05, cl = (v) => Math.max(-1, Math.min(1, v));
    const dem = { r: cl(((jc + ji) * 1.1 + 45 - pop) / (pop * 0.3 + 60)) - tx + (happy - 60) / 200,
      c: cl((pop * 0.35 + 10 - jc) / (jc * 0.4 + 30)) - tx, i: cl((pop * 0.45 + 18 - ji) / (ji * 0.4 + 30)) - tx };
    dem.r = cl(dem.r); dem.c = cl(dem.c); dem.i = cl(dem.i);
    const tour = counts.port ? Math.round((counts.mono ? 20 : 0) + (counts.whale ? 35 : 0) + (counts.mother ? 60 : 0) + jc * 0.05) * counts.port : 0; st.tour = tour;
    const edu = Math.min(0.2, (counts.acad || 0) * 0.1); st.edu = edu;
    const income = Math.round((pop * 1.6 + (jc + ji) * 1.2) * s.tax / 100 * 1.1 * (1 + edu)) + tour;
    const expense = Math.round(paths * 0.4 + up + imp * 3 + wimp * 2); st.imp = imp; st.wimp = wimp;
    st.pR = pd ? Math.min(1, ps / pd) : 1; st.wR = wd ? Math.min(1, ws / wd) : 1;
    Object.assign(st, { pop, jc, ji, ps, pd, ws, wd, happy, dem, income, expense, poll, land, counts, pOK, wOK, paths, smog });
    return st;
  };
  A.tierOf = (pop) => { let t = 0; A.TIERS.forEach((x, k) => { if (pop >= x[1]) t = k; }); return t; };
  A.log = function (t) { A.S.log.push({ m: A.S.month, t, d: new Date().toISOString().slice(0, 10) }); if (A.S.log.length > 60) A.S.log.shift(); };
  A.month = function (quiet) {
    const s = A.S; let st = A.compute(); const r = Math.random;
    let grown = 0;
    for (let i = 0; i < N * N; i++) {
      const t = s.cells[i]; if (t !== 'r' && t !== 'c' && t !== 'i') continue;
      const ok = (st.pOK || (st.pR > 0.9 && r() < 0.5)) && (st.wOK || (st.wR > 0.9 && r() < 0.5)) && A.pathNear(i), l = s.lv[i], d = st.dem[t];
      if (ok && d > -0.05 && l < 3 && grown < 14 && r() < 0.22 * (d + 0.35) && !(l === 2 && st.land[i] < 0.42 && t === 'r')) { s.lv[i]++; grown++; A.world.mark(i); }
      else if (l > 0 && ((!ok && r() < 0.1) || (d < -0.5 && r() < 0.05))) { s.lv[i]--; A.world.mark(i); }
    }
    st = A.compute();
    s.lumen += st.income - st.expense; s.month++; if (st.pop > (s.best || 0)) s.best = st.pop; if (s.lumen > (s.peakL || 0)) s.peakL = s.lumen;
    s.hist.push({ m: s.month, p: st.pop, l: s.lumen, h: Math.round(st.happy), n: st.income - st.expense, e: Math.round(st.pR * 100), w: Math.round(st.wR * 100) }); if (s.hist.length > 120) s.hist.shift();
    if (s.month % 12 === 0 && s.hist.length >= 12) { const a = s.hist[s.hist.length - 12], b = s.hist[s.hist.length - 1], dp = b.p - a.p, dl = b.l - a.l; A.log('Cycle ' + (s.month / 12) + ' closed: 👽 ' + (dp >= 0 ? '+' : '') + dp + ' · ◈ ' + (dl >= 0 ? '+' : '') + dl + ' · ♥ ' + b.h + '%.'); }
    try { A.checkGoal(); } catch (e) { console.warn(e); }
    const tier = A.tierOf(st.pop);
    if (tier > s.tier) { s.tier = tier; s.reached = s.reached || {}; s.reached[tier] = s.month; A.log(s.name + ' became a ' + A.TIERS[tier][0] + '!'); A.ui.toast('✦ ' + A.TIERS[tier][0] + ' reached' + (tier <= 3 ? ' · new landmark unlocked' : '')); A.world.fx('comet'); }
    const nowD = new Date(), dk = nowD.toISOString().slice(0, 10), hr = nowD.getHours();
    if (s.started && (hr >= 19 || hr < 2) && s.lantern !== dk && r() < 0.35) { s.lantern = dk; A.event('lantern'); }
    else if (s.started && nowD.getMonth() === 9 && s.harvest !== nowD.getFullYear() && r() < 0.3) { s.harvest = nowD.getFullYear(); A.event('harvest'); }
    else if (s.started && nowD.getMonth() === 9 && nowD.getDate() >= 24 && s.hollow !== nowD.getFullYear() && r() < 0.35) { s.hollow = nowD.getFullYear(); A.event('hollow'); }
    else if (s.started && (hr >= 20 || hr < 5) && (st.counts.park || 0) >= 2 && s.moths !== dk && r() < 0.25) { s.moths = dk; A.event('moths'); }
    else if (s.started && s.month % 12 === 10 && s.ringFair !== Math.floor(s.month / 12)) { s.ringFair = Math.floor(s.month / 12); A.event('ringfair'); }
    else if (r() < 0.05) { try { A.event(); } catch (e) { console.warn(e); } }
    if (s.lumen < 0 && s.month % 3 === 0) A.ui.toast('The treasury is in the red. Raise taxes or trim upkeep.');
    if (!quiet) { A.save(); A.ui.refresh(); }
  };
  A.GOALS = [
    ['Reach 500 citizens', (st) => st.pop >= 500, 300],
    ['Build a Plasma reactor', (st) => !!st.counts.rx, 250, 'rx'],
    ['Open a Star academy', (st) => !!st.counts.acad, 250, 'acad'],
    ['Raise the Monolith of Echoes', (st) => !!st.counts.mono, 500, 'mono'],
    ['Grow 3 glow gardens', (st) => (st.counts.park || 0) >= 3, 200, 'park'],
    ['Become a Hive (800 citizens)', (st) => st.pop >= 800, 600],
    ['Build a Healing bloom', (st) => !!st.counts.heal, 300, 'heal'],
    ['Reach 1,500 citizens', (st) => st.pop >= 1500, 800],
    ['Open a UFO port', (st) => !!st.counts.port, 500, 'port'],
    ['Become a Metropolis (2,500)', (st) => st.pop >= 2500, 1200],
    ['Welcome the Sky Whale Sanctuary', (st) => !!st.counts.whale, 1000, 'whale'],
    ['Reach 5,000 citizens', (st) => st.pop >= 5000, 2000],
    ['Dock the Mothership', (st) => !!st.counts.mother, 2500, 'mother'],
    ['Become a Star Capital', (st) => st.pop >= 7000, 5000]
  ];
  A.goalNow = function () { return A.GOALS[A.S.goal || 0] || null; };
  A.checkGoal = function () {
    const s = A.S; let g = A.goalNow(), n = 0;
    while (g && n < 3 && g[1](A.stats, s)) { s.lumen += g[2]; A.log('Goal met: ' + g[0] + '. +' + g[2] + ' Lumen.'); A.ui.toast('★ Goal met: ' + g[0] + ' · +◈' + g[2]); s.goal = (s.goal || 0) + 1; g = A.goalNow(); n++; }
  };
  A.catchUp = function () {
    const s = A.S; if (!s.started || !s.speed || !s.lastSeen || s.ai) return;
    const n = Math.min(6, Math.floor((Date.now() - s.lastSeen) / 600000)); if (!(n >= 1)) return;
    const p0 = A.compute().pop, l0 = s.lumen;
    for (let k = 0; k < n; k++) A.month(true);
    const p1 = A.stats.pop, d = s.lumen - l0;
    A.log('While you were away: ' + n + ' phases passed.');
    A.save(true); A.ui.refresh();
    setTimeout(() => A.ui.toast('Welcome back · ' + n + ' phases passed · 👽 ' + (p1 - p0 >= 0 ? '+' : '') + (p1 - p0) + ' · ◈ ' + (d >= 0 ? '+' : '') + d), 600);
  };
  A.event = function (kind) {
    const s = A.S, k = kind || ['meteor', 'spores', 'trader', 'comet', 'aurora', 'tide', 'crystal', 'drift', 'swarm', 'caravan'][(Math.random() * 10) | 0];
    let msg = '';
    if (k === 'meteor') { s.lumen += 300; msg = 'Meteor shower! Crews salvaged 300 Lumen of star-glass.'; }
    if (k === 'spores') { s.boost = 5; s.boostUntil = s.month + 3; msg = 'A spore bloom drifts over the city. Citizens are delighted.'; }
    if (k === 'trader') { const g = 300 + ((Math.random() * 6) | 0) * 100; s.lumen += g; msg = 'Visiting traders paid ' + g + ' Lumen in docking fees.'; }
    if (k === 'comet') { s.boost = 10; s.boostUntil = s.month + 2; msg = 'Comet Festival! Happiness soars for two phases.'; }
    if (k === 'lantern') { s.boost = 8; s.boostUntil = s.month + 3; s.lumen += 150; msg = 'Moonlantern Night: both moons rise together and citizens float lanterns over the sea. +150 Lumen, happiness up.'; }
    if (k === 'harvest') { s.lumen += 250; s.boost = 6; s.boostUntil = s.month + 2; msg = 'Glimmerfruit Harvest: the fungal forests drop amber fruit this October. +250 Lumen, happier citizens.'; }
    if (k === 'hollow') { s.lumen += 200; s.boost = 7; s.boostUntil = s.month + 3; msg = 'Hollowmoon Eve: citizens carve glowing gourds along the paths. +200 Lumen, happiness up.'; }
    if (k === 'moths') { const g = 60 * Math.min(10, A.stats.counts.park || 0); s.lumen += g; s.boost = 4; s.boostUntil = s.month + 2; msg = 'Lumen moths swarm the glow gardens tonight; citizens net their light: +' + g + ' Lumen.'; }
    if (k === 'aurora') { s.auroraUntil = s.month + 3; msg = 'A violet aurora charges the pylons: +40 energy for three phases.'; }
    if (k === 'tide') { s.tideUntil = s.month + 3; msg = 'Moon tide: both moons pull the lavender sea high and mist wells brim: +60 water for three phases.'; }
    if (k === 'ringfair') { const g = 150 + Math.min(900, Math.round(A.stats.jc * 1.5)); s.lumen += g; s.boost = 5; s.boostUntil = s.month + 2; msg = 'Ringturn Fair: the gas giant\'s rings align and markets glow all night: +' + g + ' Lumen.'; }
    if (k === 'crystal') { let n = 0; for (let i = 0; i < N * N; i++) if (A.S.cells[i] === 'i' && A.S.lv[i] && A.crystalNear(i)) n++; const g = 120 + n * 80; s.lumen += g; msg = 'Crystal song: the outcrops ring at dusk' + (n ? ' and ' + n + ' crystal-fed refineries' : '') + ' harvest the echo: +' + g + ' Lumen.'; }
    if (k === 'drift') { const open = []; for (let i = 0; i < N * N; i++) if (!s.cells[i] && A.ter[i] !== 'w' && A.pathNear(i)) open.push(i); let n = 0; while (open.length && n < 2) { const i = open.splice((Math.random() * open.length) | 0, 1)[0]; s.cells[i] = 'park'; s.lv[i] = 0; A.world.mark(i, true); n++; } A.compute(); msg = n ? 'Driftseed winds plant ' + n + ' wild glow garden' + (n > 1 ? 's' : '') + ' beside your paths: land value up, smog down.' : 'Driftseed winds pass over, finding no open ground.'; }
    if (k === 'swarm') { const c = []; for (let i = 0; i < N * N; i++) if (T[s.cells[i]] && T[s.cells[i]].zone && s.lv[i] > 0 && s.lv[i] < 3 && A.pathNear(i)) c.push(i); let n = 0; while (c.length && n < 3) { const i = c.splice((Math.random() * c.length) | 0, 1)[0]; s.lv[i]++; A.world.mark(i); n++; } A.compute(); msg = n ? 'Builder-mite swarm: tiny glowing mites raise ' + n + ' building' + (n > 1 ? 's' : '') + ' a tier overnight.' : 'A builder-mite swarm circles, finding nothing to raise.'; }
    if (k === 'caravan') { const g = Math.min(800, 80 + (A.stats.paths || 0) * 6); s.lumen += g; msg = 'Glowworm caravan: a luminous procession rides every levitation path, paying tolls: +' + g + ' Lumen.'; }
    if (!msg) return;
    s.evc = s.evc || {}; s.evc[k] = (s.evc[k] || 0) + 1;
    A.log(msg); A.ui.toast(msg); A.world.fx(k === 'aurora' || k === 'tide' || k === 'moths' ? 'spores' : k);
  };
  A.advice = function () {
    const st = A.stats, s = A.S, c = st.counts || {};
    if (!st.pOK) { const big = s.tier >= 1 && st.pd - st.ps > 60; const tl = big ? 'rx' : 'pw'; if (s.lumen < T[tl].cost) return { k: 'bad', t: 'Out of energy and short on Lumen: raise taxes in ☰ to afford a ' + T[tl].name + '.' }; return { k: 'bad', t: 'Out of energy (' + Math.round(st.pd) + '/' + st.ps + '): tap for a' + (big ? ' Plasma reactor (+260)' : 'n Energy pylon') + '.', tool: tl }; }
    const bigW = s.tier >= 1 && s.lumen >= T.mc.cost && st.wd - st.ws > 40;
    if (!st.wOK) return bigW ? { k: 'bad', t: 'Water is short (' + Math.round(st.wd) + '/' + st.ws + '): tap for a Mist condenser (+260).', tool: 'mc' } : { k: 'bad', t: 'Water is short: build a Mist well. Tap to pick it.', tool: 'mw' };
    if (s.tier >= 1 && st.ws && st.wd >= st.ws && s.lumen >= T.mc.cost) return { k: 'warn', t: 'Water maxed ' + Math.round(st.wd) + '/' + st.ws + ' · tap for a Mist condenser (+260)', tool: 'mc' };
    if (st.wimp) return { k: 'warn', t: 'Importing ' + st.wimp + ' water (◈' + st.wimp * 2 + '/phase): tap to add a mist well.', tool: 'mw' };
    if (st.imp) return { k: 'warn', t: 'Importing ' + st.imp + ' energy (◈' + st.imp * 3 + '/phase): tap to add a pylon.', tool: 'pw' };
    if (st.ps && st.pd / st.ps > 0.85) return { k: 'warn', t: 'Energy at ' + Math.round(st.pd / st.ps * 100) + '%: tap to add a pylon.', tool: 'pw' };
    if (st.ws && st.wd / st.ws > 0.85) return { k: 'warn', t: 'Water at ' + Math.round(st.wd / st.ws * 100) + '%: tap to add a mist well.', tool: 'mw' };
    if (st.smog > 1.2) return { k: 'warn', t: 'Spore smog is souring homes: tap for a Glow garden between them.', tool: 'park' };
    if (st.income - st.expense < 0) return { k: 'warn', t: 'Budget is negative: nudge taxes up in the ☰ menu.' };
    const top = ['r', 'c', 'i'].sort((a, b) => st.dem[b] - st.dem[a])[0], nm = { r: 'Residential', c: 'Commercial', i: 'Industrial' };
    if (st.dem[top] > 0.35) return { k: 'ok', t: 'Citizens want more ' + nm[top] + ' zones: tap to zone.', tool: top };
    if (!c.hall && s.lumen >= 500) return { k: 'ok', t: 'A Hive Council dome would lift happiness: tap.', tool: 'hall' };
    return { k: 'ok', t: 'The city hums along nicely.' };
  };
  A.undoStack = [];
  A.canPlace = function (t, i) {
    const s = A.S;
    if (t === 'x') return s.cells[i] ? '' : 'Nothing here';
    if (s.cells[i] === t) return 'Already here';
    if (A.ter[i] === 'w' && t !== 'p') return 'Only levitation paths cross the sea';
    if (s.cells[i]) return 'Occupied: bulldoze first';
    const d = T[t]; if (d.need && s.tier < d.need) return 'Unlocks at ' + A.TIERS[d.need][0];
    if (d.unique && s.cells.includes(t)) return 'Only one allowed';
    if (s.lumen < d.cost) return 'Not enough Lumen';
    return '';
  };
  A.applyBatch = function (t, list, by) {
    const s = A.S, batch = [], ai = by === 'ai'; let spent = 0, last = '';
    for (const i of list) {
      const why = A.canPlace(t, i); if (why) { last = why; continue; }
      batch.push({ i, t: s.cells[i], l: s.lv[i] });
      if (t === 'x') { const o = s.cells[i], rf = o && T[o] && !T[o].zone && o !== 'p' ? Math.round(T[o].cost * 0.5) : 0; s.lumen += rf; spent -= rf; s.cells[i] = ''; s.lv[i] = 0; }
      else { s.cells[i] = t; s.lv[i] = 0; spent += T[t].cost; s.lumen -= T[t].cost; }
      A.world.mark(i, true);
    }
    if (batch.length && !ai && A.ui && A.ui.toast) A.ui.toast(t === 'x' ? 'Cleared ' + batch.length + (batch.length > 1 ? ' cells' : ' cell') + (spent < 0 ? ' · +◈' + (-spent) + ' salvaged' : '') : (batch.length > 1 ? batch.length + '× ' : '') + T[t].name + ' · −◈' + spent + ' · ◈' + Math.round(s.lumen).toLocaleString() + ' left');
    if (batch.length) { if (!ai) { A.undoStack.push({ batch, spent }); if (A.undoStack.length > 30) A.undoStack.shift(); } A.compute(); A.save(); A.ui.refresh(); if (T[t] && T[t].lm) A.log(T[t].name + ' rises over ' + (s.name || 'the city') + '.'); }
    else if (last && list.length && !ai) A.ui.toast(last);
    return batch.length;
  };
  A.idleSummary = function () { const out = {}; for (let i = 0; i < N * N; i++) { const t = A.S.cells[i]; if (T[t] && T[t].zone) { const w = A.whyIdle(i); out[w] = (out[w] || 0) + 1; } } return out; };
  A.whyIdle = function (i) {
    const s = A.S, st = A.stats, t = s.cells[i]; if (!T[t] || !T[t].zone) return '';
    if (!A.pathNear(i)) return 'Needs a path beside it';
    if (!st.pOK) return st.pR > 0.9 ? 'Brownout: growing slowly, add a pylon' : 'No energy: add a pylon';
    if (!st.wOK) return st.wR > 0.9 ? 'Low water: growing slowly' : 'No water: add a mist well';
    if (s.lv[i] >= 3) return 'Fully grown';
    if (st.dem[t] <= -0.05) return 'Waiting: low demand';
    return A.crystalNear(i) && t === 'i' ? 'Growing · crystal-fed (+40% jobs)' : 'Growing';
  };
  A.undo = function () {
    const u = A.undoStack.pop(); if (!u) return false;
    for (const b of u.batch.reverse()) { A.S.cells[b.i] = b.t; A.S.lv[b.i] = b.l; A.world.mark(b.i, true); }
    A.S.lumen += u.spent; A.compute(); A.save(); A.ui.refresh(); return true;
  };
})(window.App);
