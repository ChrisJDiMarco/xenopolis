(function (A) {
  const N = A.N, T = A.TYPES;
  A.actions = {
    paint(t, cells) { return A.applyBatch(t, cells); },
    undo() { if (A.undo()) A.ui.toast('↶ Undone · ' + A.undoStack.length + ' left'); else A.ui.toast('Nothing to undo'); },
    setSpeed(v) { v = +v; A.S.speed = [0, 1, 3].includes(v) ? v : 1; A.save(); A.ui.refresh(); },
    setTax(v) { A.S.tax = Math.max(0, Math.min(20, v | 0)); A.compute(); A.save(); A.ui.refresh(); },
    newCity(name) {
      A.ai.on = false; if (A.S.ai) A.ai.home();
      A.S = A.fresh(name); if (name) { A.S.started = true; A.log(name + ' founded as an Outpost.'); }
      A.genTerrain(A.S.seed); A.starter(); A.undoStack.length = 0; A.compute(); A.world.rebuildAll(); A.save(true);
      document.getElementById('namePrompt').hidden = A.S.started; A.ui.savePrefs(); A.ui.setTool(A.world.tool); A.ui.refresh();
    },
    placeLandmark(name) {
      const key = Object.keys(T).find((k) => T[k].lm && (k === name || T[k].name.toLowerCase().includes(String(name || '').toLowerCase())));
      if (!key) throw new Error('Landmarks: Monolith of Echoes, Sky Whale Sanctuary, Mothership dock.');
      const c = N / 2; let best = -1, bd = 1e9;
      for (let i = 0; i < N * N; i++) { if (A.canPlace(key, i)) continue; const d = Math.hypot(i % N - c, ((i / N) | 0) - c) - (A.pathNear(i) ? 4 : 0); if (d < bd) { bd = d; best = i; } }
      if (best < 0) throw new Error(A.canPlace(key, (N * N) / 2 + N / 2) || 'No open land for it.');
      A.applyBatch(key, [best]); return T[key].name + ' placed.';
    }
  };
  A.buildNear = function (k) { const c = N / 2; let best = -1, bd = 1e9; for (let i = 0; i < N * N; i++) { if (A.canPlace(k, i)) continue; const dd = Math.hypot(i % N - c, ((i / N) | 0) - c) - (A.pathNear(i) ? 1.5 : 0); if (dd < bd) { bd = dd; best = i; } } if (best < 0) throw new Error(A.S.lumen < T[k].cost ? 'Not enough Lumen for a ' + T[k].name + '.' : 'No open land for it.'); A.applyBatch(k, [best]); return best; };
  A.starter = function () {
    const s = A.S, c = N / 2, put = (x, y, t, l) => { const i = y * N + x; if (A.ter[i] === 'w' && t !== 'p') return; s.cells[i] = t; s.lv[i] = l || 0; };
    for (let k = -5; k <= 5; k++) { put(c + k, c, 'p'); put(c, c + k, 'p'); }
    put(c - 2, c - 2, 'pw'); put(c + 2, c + 2, 'mw'); put(c + 2, c - 2, 'park');
    for (let k = 1; k <= 4; k++) { put(c - k, c - 1, 'r', k < 3 ? 1 : 0); put(c - k, c + 1, 'r', k < 2 ? 2 : 0); put(c + k, c + 1, 'c', k < 2 ? 1 : 0); put(c + 1, c - k - 2 < 0 ? 0 : c + k + 2, 'i', k < 2 ? 1 : 0); }
  };
  A.report = function () {
    const s = A.S, st = A.stats;
    return { city: s.name || 'Xenopolis', tier: A.TIERS[s.tier][0], date: A.dateStr(s.month), population: st.pop, lumen: s.lumen, happiness: Math.round(st.happy),
      energy: Math.round(st.pd) + '/' + st.ps, water: Math.round(st.wd) + '/' + st.ws, monthlyNet: st.income - st.expense, tourism: st.tour || 0, tax: s.tax, speed: s.speed,
      demand: { r: +st.dem.r.toFixed(2), c: +st.dem.c.toFixed(2), i: +st.dem.i.toFixed(2) } };
  };
  // ---- generative ambient audio
  A.audio = { on: false, ctx: null, t: 0,
    toggle() { this.on ? this.stop() : this.start(); A.ui.refresh(); },
    start() {
      try {
        const ctx = this.ctx || (this.ctx = new AudioContext()); ctx.resume();
        this.out = ctx.createGain(); this.out.gain.value = 0; this.out.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
        const dl = ctx.createDelay(); dl.delayTime.value = 0.42; const fb = ctx.createGain(); fb.gain.value = 0.45;
        lp.connect(this.out); lp.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(this.out); this.out.connect(ctx.destination);
        this.bus = lp; this.on = true; this.chord(0);
      } catch (e) { A.ui.toast('Sound is not available here.'); }
    },
    chord(k) {
      if (!this.on) return; const ctx = this.ctx, now = ctx.currentTime; if (ctx.state !== 'running') { this.t = setTimeout(() => this.chord(k), 4000); return; }
      const prog = [[0, 7, 14, 19], [-3, 4, 11, 16], [-7, 0, 9, 14], [-5, 2, 9, 17]][k % 4];
      prog.forEach((n, j) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = j ? 'sine' : 'triangle';
        o.frequency.value = 220 * Math.pow(2, n / 12); o.detune.value = (Math.random() - 0.5) * 10;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.09 / (j + 1), now + 2.5); g.gain.linearRampToValueAtTime(0, now + 9);
        o.connect(g); g.connect(this.bus); o.start(now); o.stop(now + 9.2); });
      for (let b = 0; b < 3; b++) { const o = ctx.createOscillator(), g = ctx.createGain(), at = now + 1 + b * 2.2 + Math.random();
        o.frequency.value = 880 * Math.pow(2, prog[(Math.random() * 4) | 0] / 12); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.04, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 2);
        o.connect(g); g.connect(this.bus); o.start(at); o.stop(at + 2.1); }
      this.t = setTimeout(() => this.chord(k + 1), 8000);
    },
    stop() { this.on = false; clearTimeout(this.t); if (this.out) { const o = this.out; o.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1); setTimeout(() => o.disconnect(), 1200); } }
  };
  A.boot = function (canvas) {
    A.reduced = !!((window.cabinet && cabinet.reducedMotion) || matchMedia('(prefers-reduced-motion: reduce)').matches);
    let pf = {}; try { pf = (window.cabinet && cabinet.recall && cabinet.recall('prefs', null)) || {}; } catch (e) {}
    A.S = (pf.slot === 'ai' && A.load('ai')) || A.load(); A.genTerrain(A.S.seed); if (!A.S.started && !A.S.cells.some(Boolean)) A.starter(); A.compute();
    if (!A.S.ai) A.undoStack.push(...A.loadUndo());
    A.figs.setup(); A.world.init(canvas); if (A.S.ai) A.world.aiView(); else A.world.loadView();
    A.ui.init(); A.ai.init(); A.ai.on = !!pf.ai && A.S.started; A.ui.refresh(); try { A.catchUp(); } catch (e) { console.warn(e); }
    addEventListener('resize', () => A.world.resize());
    let visible = true, last = performance.now(), acc = 0, lastW = -1;
    addEventListener('unhandledrejection', (e) => { console.warn(e.reason); e.preventDefault(); });
    try { if (window.cabinet && cabinet.onVisibility) cabinet.onVisibility((v) => { visible = v !== false; const ac = A.audio.ctx; if (!visible) { A.flushSave(); if (ac) ac.suspend().catch(() => {}); } else { last = performance.now(); if (ac && A.audio.on) ac.resume().catch(() => {}); } }); } catch (e) {}
    function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (document.hidden || !visible || !innerWidth || !innerHeight) return;
      if (canvas.width === 0 || canvas.clientWidth !== lastW) { lastW = canvas.clientWidth; A.world.resize(); }
      try {
        if (A.S.started && A.S.speed) { acc += dt * A.S.speed; if (acc >= 2.6) { acc = 0; A.month(); } }
        A.ai.tick(dt);
        A.world.frame(dt);
      } catch (e) { console.error(e); }
    }
    requestAnimationFrame(loop);
    if (window.cabinet) {
      try {
        cabinet.onMemory && cabinet.onMemory(() => {});
        cabinet.describeMemory && cabinet.describeMemory({ city: 'The whole Xenopolis save: { v:1, name, seed, month, lumen, tax, cells[784] (type codes r,c,i,p,pw,mw,park,hall,heal,acad,port,mc,mono,whale,mother), lv[784] (0-3 growth), log, tier, speed, hist: last 120 phases [{ m, p pop, l lumen, h happiness, n net Lumen }], best peak pop, lastSeen ms (up to 6 phases catch up on return), goal: index into the goal ladder (rewards Lumen) }', undo: 'Last 10 undo steps { v:1, seed, list: [{ spent, batch: [{ i, t, l }] }] }, kept across reloads', view: 'Saved camera { v:1, yaw, pitch, dist, x, z }', prefs: 'UI prefs { v:1, mini: city|land|smog minimap view, cat: toolbar tab, slot: city|ai (which city is open), ai: whether the AI is playing }', aiWorld: 'The sandbox city the AI architect is building: the same shape as city plus ai:1, style (grid|rings|spiral|weave|garden) and biome (0-3). Never your own city.', aiWorlds: 'Gallery of AI-built worlds, newest first, up to 12: [{ seed, name, style, biome, pop (peak), tier, months, at YYYY-MM-DD }]; each one\'s full save is in the store as worlds/<seed>.json', figBundle: 'last read figurine bundle: { name, models: [model ids], bytes, at }' });
        const d = cabinet.actions && cabinet.actions.define ? cabinet.actions.define.bind(cabinet.actions) : null;
        if (d) {
          d('status', { description: 'Quick status of the city: population, Lumen, happiness, tier and date', readOnly: true, input: { type: 'object', properties: {} } }, () => { const r = A.report(); return Object.assign({ message: r.city + ' (' + r.tier + '): ' + r.population + ' citizens, ' + r.lumen + ' Lumen, ' + r.happiness + '% happy, ' + r.date + '.' }, r); });
          d('setSpeed', { description: 'Set game speed: 0 pause, 1 normal, 3 fast', input: { type: 'object', properties: { speed: { type: 'number' } }, required: ['speed'] } }, (a) => { A.actions.setSpeed(+a.speed); return { message: A.S.speed ? 'Speed set to ' + A.S.speed + 'x.' : 'Paused.', speed: A.S.speed }; });
          d('placeLandmark', { description: 'Place an unlocked landmark (Monolith of Echoes, Sky Whale Sanctuary, Mothership dock) near the city center', input: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } }, (a) => ({ message: A.actions.placeLandmark(a.name) }));
          d('newCity', { description: 'Start a brand-new city (erases the current one)', confirm: 'Start a new city? The current city will be replaced.', input: { type: 'object', properties: { name: { type: 'string' } } } }, (a) => { A.actions.newCity(String(a.name || 'Xenopolis').slice(0, 40)); return { message: 'Founded ' + A.S.name + '.' }; });
          d('setTax', { description: 'Set the city tax rate, 0 to 20 percent', input: { type: 'object', properties: { tax: { type: 'number' } }, required: ['tax'] } }, (a) => { if (!Number.isFinite(+a.tax)) throw new Error('Give a tax rate from 0 to 20.'); A.actions.setTax(+a.tax); return { message: 'Taxes set to ' + A.S.tax + '%: net ' + (A.stats.income - A.stats.expense) + ' Lumen per phase.', tax: A.S.tax }; });
          d('history', { description: 'Population, Lumen and happiness over the recent phases (up to 120)', readOnly: true, input: { type: 'object', properties: { last: { type: 'number', description: 'How many phases; 12 if left out' } } } }, (a) => { const n = Math.max(1, Math.min(120, +a.last || 12)), h = (A.S.hist || []).slice(-n); if (!h.length) return { message: 'No history yet: phases need to pass.', phases: [] }; const f = h[0], l = h[h.length - 1]; return { message: 'Over ' + h.length + ' phases: pop ' + f.p + ' → ' + l.p + ', Lumen ' + f.l + ' → ' + l.l + '.', phases: h.map((e) => ({ date: A.dateStr(e.m), pop: e.p, lumen: e.l, happiness: e.h, net: e.n, energyMet: e.e, waterMet: e.w })) }; });
          d('buildUtility', { description: 'Build a utility near the city center: pylon, reactor, mist well or mist condenser', input: { type: 'object', properties: { kind: { type: 'string', description: 'pylon | reactor | well | condenser' } }, required: ['kind'] } }, (a) => { const k = { pylon: 'pw', reactor: 'rx', well: 'mw', condenser: 'mc' }[String(a.kind || '').toLowerCase().split(' ').pop()]; if (!k) throw new Error('Pick pylon, reactor, well or condenser.'); A.buildNear(k); return { message: T[k].name + ' built: energy ' + Math.round(A.stats.pd) + '/' + A.stats.ps + ', water ' + Math.round(A.stats.wd) + '/' + A.stats.ws + '.', lumen: A.S.lumen }; });
          d('undo', { description: 'Undo the last build or bulldoze step', input: { type: 'object', properties: {} } }, () => { if (!A.undo()) throw new Error('Nothing to undo.'); return { message: 'Undone. ' + A.undoStack.length + ' steps left.', left: A.undoStack.length }; });
          d('goal', { description: 'The city\'s current goal and its Lumen reward', readOnly: true, input: { type: 'object', properties: {} } }, () => { const g = A.goalNow(); return g ? { message: 'Next goal: ' + g[0] + ' (+' + g[2] + ' Lumen). ' + (A.S.goal || 0) + ' met so far.', goal: g[0], reward: g[2], met: A.S.goal || 0 } : { message: 'Every goal is met.', met: A.GOALS.length }; });
          d('events', { description: 'How many of each random event the city has seen, and the latest ones', readOnly: true, input: { type: 'object', properties: {} } }, () => { const ev = A.S.evc || {}, n = Object.values(ev).reduce((a, b) => a + b, 0); return { message: n ? n + ' events seen: ' + Object.entries(ev).map(([k, v]) => k + ' ×' + v).join(', ') + '.' : 'No events yet.', tally: ev, recent: A.S.log.slice(-3).map((e) => e.t) }; });
          d('watchAI', { description: 'Let the AI play. world: it founds a new sandbox world and builds it while you watch (your city stays safe); mayor: it runs your own city; off: stop it; home: back to your own city', input: { type: 'object', properties: { mode: { type: 'string', description: 'world | mayor | off | home; world if left out' }, style: { type: 'string', description: 'grid | rings | spiral | weave | garden; a surprise if left out' } } } }, (a) => {
            const m = String(a.mode || 'world').toLowerCase();
            if (m === 'off') { A.ai.toggle(false); return { message: 'The AI stopped: you have the controls of ' + A.S.name + '.' }; }
            if (m === 'home') { A.ai.home(); return { message: 'Back in ' + A.S.name + '.' }; }
            if (m === 'mayor') { if (A.S.ai) A.ai.home(); A.ai.toggle(true); return { message: 'The AI mayor is running ' + A.S.name + '. It never bulldozes.' }; }
            A.ai.found(String(a.style || '').toLowerCase()); return { message: 'The AI founded ' + A.S.name + ' (' + A.ai.STY[A.S.style][0] + ') and is building it now. Your city is saved as it was.', world: A.S.name, style: A.S.style };
          });
          d('cityReport', { description: 'A full report: tier, budget, energy, water, demand, recent events', readOnly: true, input: { type: 'object', properties: {} } }, () => { const r = A.report(); r.recent = A.S.log.slice(-5).map((e) => e.t); r.advice = A.advice().t; r.zones = A.idleSummary(); r.buildings = A.stats.counts; const gg = A.goalNow(); r.goal = gg ? gg[0] : 'all met'; const h = A.S.hist || []; if (h.length > 1) r.trend = { phases: h.length, popFrom: h[0].p, popTo: h[h.length - 1].p, lumenFrom: h[0].l, lumenTo: h[h.length - 1].l }; r.message = r.city + ' · ' + r.tier + ' · net ' + r.monthlyNet + ' Lumen per phase'; return r; });
        }
      } catch (e) { console.warn(e); }
    }
  };
})(window.App);
