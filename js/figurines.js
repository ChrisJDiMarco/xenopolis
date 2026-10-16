/* Figurine bundle reader: reads drops/xenopolis_figurines_bundle.js from the store and shows what it holds. */
(function () {
  const C = window.cabinet; if (!C) return;
  const KEY = 'drops/xenopolis_figurines_bundle.js';
  const S = { status: 'Reading bundle…', name: KEY, models: [], bytes: 0 };
  const GROUPS = [['res_', 'Residential'], ['com_', 'Commercial'], ['ind_', 'Industry'], ['civ_', 'Civic'], ['lm_', 'Landmarks'], ['veh_', 'Vehicles'], ['cit_', 'Citizens']];

  function parse(text) {
    const out = [], seen = new Set();
    const re = /["']?([a-z][a-z0-9]*_[a-z0-9_]+)["']?\s*:\s*["'`]((?:data:[^,"'`]*,)?)([A-Za-z0-9+/=]{200,})/g;
    let m;
    while ((m = re.exec(text))) {
      if (seen.has(m[1])) continue; seen.add(m[1]);
      out.push({ id: m[1], kb: Math.round(m[3].length * 0.75 / 1024) });
    }
    if (!out.length) { // fallback: any listed model names
      (text.match(/\b(?:res|com|ind|civ|lm|veh|cit)_[a-z0-9_]+/g) || []).forEach((id) => { if (!seen.has(id)) { seen.add(id); out.push({ id, kb: 0 }); } });
    }
    return out;
  }
  function groupOf(id) { const g = GROUPS.find(([p]) => id.startsWith(p)); return g ? g[1] : 'Other'; }

  const css = document.createElement('style');
  css.textContent = `#figChip[hidden]{display:none}#figChip{position:absolute;right:8px;bottom:118px;opacity:.75;z-index:40;font:600 11px -apple-system,system-ui,sans-serif;color:#efe6ff;background:rgba(40,28,80,.62);backdrop-filter:blur(10px);border:1px solid rgba(200,170,255,.25);border-radius:999px;padding:5px 10px;cursor:pointer}
@media (max-height:560px),(max-width:600px){#figChip,#figPanel{display:none!important}}#figChip:focus-visible{outline:2px solid #c9a6ff}
#figPanel{position:absolute;right:8px;bottom:150px;z-index:41;width:min(260px,80vw);max-height:55%;overflow:auto;font:500 11px -apple-system,system-ui,sans-serif;color:#efe6ff;background:rgba(28,20,60,.86);backdrop-filter:blur(14px);border:1px solid rgba(200,170,255,.25);border-radius:14px;padding:10px 12px;display:none}
#figPanel h4{margin:0 0 4px;font-size:12px}#figPanel .g{margin-top:8px;color:#c9a6ff;font-weight:600}#figPanel .r{display:flex;justify-content:space-between;gap:6px;opacity:.9}#figPanel .r span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`;
  document.head.appendChild(css);
  const chip = document.createElement('button'); chip.id = 'figChip'; chip.type = 'button';
  const panel = document.createElement('div'); panel.id = 'figPanel'; panel.setAttribute('role', 'dialog');
  document.body.append(chip, panel);
  chip.onclick = () => { panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panel.style.display = 'none'; });

  function draw() {
    chip.hidden = !S.models.length || !!(window.App && App.AI && App.AI.on);
    chip.textContent = S.models.length ? '📦 Figurines ' + S.models.length : '📦 ' + S.status;
    let h = `<h4>${S.name.split('/').pop()}</h4><div>${S.models.length ? S.models.length + ' models · ' + (S.bytes / 1048576).toFixed(1) + ' MB' : S.status}</div>`;
    const by = {};
    S.models.forEach((m) => (by[groupOf(m.id)] = by[groupOf(m.id)] || []).push(m));
    Object.keys(by).forEach((g) => {
      h += `<div class="g">${g} · ${by[g].length}</div>` + by[g].map((m) => `<div class="r"><span>${m.id}</span><span>${m.kb ? m.kb + ' KB' : ''}</span></div>`).join('');
    });
    panel.innerHTML = h;
  }
  function take(name, text) {
    S.name = name; S.bytes = text.length; S.models = parse(text);
    S.status = S.models.length ? 'ok' : 'No models found';
    try { C.remember && C.remember('figBundle', { name, models: S.models.map((m) => m.id), at: Date.now() }); } catch (e) {}
    draw();
  }
  draw();
  const late = setTimeout(() => { if (!S.models.length) { S.status = 'No bundle yet'; draw(); } }, 2500);
  Promise.resolve().then(() => C.store.get(KEY)).then((r) => { clearTimeout(late);
    if (r && typeof r.text === 'string') take(KEY, r.text); else { S.status = 'Bundle not found'; draw(); }
  }).catch(() => { S.status = 'Bundle not found'; draw(); });

  if (C.onDrop) C.onDrop((files) => {
    (files || []).forEach((f) => {
      if (!/\.(js|json|txt)$/i.test(f.name || '')) return;
      if (typeof f.text === 'string' && f.text.length) take(f.storeKey || f.name, f.text);
      else if (f.storeKey) C.store.get(f.storeKey).then((r) => r && r.text && take(f.storeKey, r.text)).catch(() => {});
    });
  });
  try {
    C.actions && C.actions.define('figurineBundle', { description: 'List the models in the figurine bundle', readOnly: true, input: { type: 'object', properties: {} } }, async () => {
      let r = null; try { r = await C.store.get(KEY); } catch (e) {}
      const ms = r && r.text ? parse(r.text) : [];
      return { message: ms.length ? ms.length + ' figurines: ' + ms.map((m) => m.id).join(', ') : 'The bundle is not in the store.', count: ms.length };
    });
    C.describeMemory && C.describeMemory({ figBundle: 'last read figurine bundle: { name, models: [model ids], at }' });
  } catch (e) {}
})();
