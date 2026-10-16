(function (A) {
  let THREE; const G = {}, M = {}, SM = {};
  A.figs = { mats: M, G };
  const P = { teal: 0x5ef2d6, violet: 0x9a7bff, mag: 0xff5ec8, lav: 0xd9c8ff, amber: 0xffc46b, coral: 0xff8fa8, deep: 0x3a2a66, ice: 0xbff6ff, cream: 0xfff1e0, lime: 0xb8ff7a };
  A.figs.P = P;
  A.figs.setup = function () {
    THREE = A.THREE;
    G.sph = new THREE.SphereGeometry(1, 20, 14);
    G.hemi = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    G.cyl = new THREE.CylinderGeometry(1, 1, 1, 20);
    G.cyl6 = new THREE.CylinderGeometry(1, 1, 1, 6);
    G.cone = new THREE.ConeGeometry(1, 1, 18);
    G.tor = new THREE.TorusGeometry(1, 0.07, 10, 40);
    G.ico = new THREE.IcosahedronGeometry(1, 0);
    G.cap = new THREE.CapsuleGeometry(0.5, 1, 6, 14);
    G.box = new THREE.BoxGeometry(1, 1, 1);
    G.plane = new THREE.PlaneGeometry(1, 1);
    const pts = [[0, -0.12], [0.3, -0.1], [0.55, -0.03], [0.62, 0], [0.55, 0.04], [0.3, 0.08], [0.22, 0.17], [0.12, 0.24], [0, 0.26]].map((p) => new THREE.Vector2(p[0], p[1]));
    G.saucer = new THREE.LatheGeometry(pts, 24);
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); G.glow = new THREE.CanvasTexture(c);
  };
  function mat(hex, em, o) {
    const k = hex + '|' + em + '|' + (o ? JSON.stringify(o) : '');
    if (M[k]) return M[k];
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.4, metalness: 0.04, emissive: hex, emissiveIntensity: em }, o || {}));
    m.userData.base = em; M[k] = m; return m;
  }
  A.figs.mat = mat;
  const glass = (hex) => mat(hex, 0.25, { transparent: true, opacity: 0.38, depthWrite: false, roughness: 0.1 });
  function part(g, m, x, y, z, sx, sy, sz, parent) {
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    o.castShadow = !m.transparent; o.receiveShadow = true; if (parent) parent.add(o); return o;
  }
  function glow(color, size, y, parent) {
    let m = SM[color]; if (!m) m = SM[color] = new THREE.SpriteMaterial({ map: G.glow, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8 });
    const s = new THREE.Sprite(m); s.scale.set(size, size, 1); s.position.y = y; if (parent) parent.add(s); return s;
  }
  A.figs.glow = glow;
  const B = {};
  B.r = function (g, l, v) {
    if (v === 0) { // spore pod
      let y = 0;
      for (let k = 0; k < l; k++) { const r = 0.34 - k * 0.06; part(G.sph, mat(k % 2 ? 0x7fe9d0 : P.teal, 0.12), 0, y + r * 0.62, 0, r, r * 0.7, r, g);
        for (let w = 0; w < 4; w++) { const a = w * 1.57 + k; part(G.sph, mat(P.amber, 1.4), Math.cos(a) * r * 0.92, y + r * 0.6, Math.sin(a) * r * 0.92, 0.035, 0.05, 0.035, g); }
        y += r * 1.2; }
      part(G.cyl, mat(P.lav, 0.1), 0, y + 0.1, 0, 0.015, 0.22, 0.015, g); const b = part(G.sph, mat(P.mag, 1.2), 0, y + 0.23, 0, 0.05, null, null, g); glow(0xff7fd8, 0.4, y + 0.23, g);
      g.userData.tick = (t) => { b.scale.setScalar(0.05 + Math.sin(t * 2.4 + g.id) * 0.012); };
    } else if (v === 1) { // coral spire
      let y = 0;
      for (let k = 0; k < l + 1; k++) { const r = 0.26 - k * 0.05, h = 0.42 - k * 0.04; part(G.cone, mat(k % 2 ? 0xffb0c6 : P.coral, 0.15), 0, y + h / 2, 0, r, h, r, g); y += h * 0.62; }
      for (let k = 0; k < l * 2; k++) { const a = k * 2.4, br = part(G.cap, mat(0xffd0dc, 0.2), Math.cos(a) * 0.2, 0.2 + k * 0.1, Math.sin(a) * 0.2, 0.06, 0.14, 0.06, g); br.rotation.z = Math.cos(a) * 0.7; br.rotation.x = Math.sin(a) * 0.7; }
      const tip = part(G.sph, mat(P.ice, 1.5), 0, y + 0.05, 0, 0.045, null, null, g); glow(0xbff6ff, 0.35, y + 0.05, g);
      g.userData.tick = (t) => { tip.position.y = y + 0.05 + Math.sin(t * 1.7 + g.id) * 0.02; };
    } else { // bubble homes
      part(G.cyl, mat(P.deep, 0.1), 0, 0.04, 0, 0.32, 0.08, 0.32, g);
      const bs = [];
      for (let k = 0; k < l; k++) { const a = k * 2.1, rr = k ? 0.16 : 0, s = 0.2 - k * 0.025; const h = new THREE.Group(); h.position.set(Math.cos(a) * rr, 0.32 + k * 0.28, Math.sin(a) * rr);
        part(G.sph, glass(0xcfe9ff), 0, 0, 0, s, null, null, h); part(G.sph, mat(k % 2 ? P.mag : P.violet, 0.9), 0, -s * 0.2, 0, s * 0.42, null, null, h); part(G.cyl, mat(P.cream, 0.6), 0, -s * 0.75, 0, s * 0.5, 0.02, s * 0.5, h);
        g.add(h); bs.push(h); }
      g.userData.tick = (t) => { bs.forEach((h, k) => { h.position.y = 0.32 + k * 0.28 + Math.sin(t * 1.2 + k * 1.7 + g.id) * 0.035; }); };
    }
  };
  B.c = function (g, l, v) {
    if (v === 0) { // mushroom market
      const caps = [];
      for (let k = 0; k < l; k++) { const a = k * 2.2, rr = k ? 0.22 : 0, s = 1 - k * 0.22, h = 0.34 * s + 0.05;
        part(G.cyl, mat(P.cream, 0.1), Math.cos(a) * rr, h / 2, Math.sin(a) * rr, 0.06 * s, h, 0.06 * s, g);
        caps.push(part(G.hemi, mat(k % 2 ? P.amber : P.mag, 0.6), Math.cos(a) * rr, h, Math.sin(a) * rr, 0.26 * s, 0.16 * s, 0.26 * s, g));
        for (let d = 0; d < 5; d++) { const b = d * 1.26; part(G.sph, mat(P.cream, 1), Math.cos(a) * rr + Math.cos(b) * 0.15 * s, h + 0.08 * s, Math.sin(a) * rr + Math.sin(b) * 0.15 * s, 0.025 * s, null, null, g); } }
      part(G.box, mat(P.deep, 0.2), 0.14, 0.06, 0.2, 0.12, 0.1, 0.1, g);
      g.userData.tick = (t) => { caps.forEach((c, k) => { c.material === M ? 0 : c.scale.y = (0.16 - k * 0.035) * (1 + Math.sin(t * 2 + k) * 0.06); }); };
    } else if (v === 1) { // orbiting trade rings
      part(G.cyl6, mat(P.deep, 0.15), 0, 0.06, 0, 0.3, 0.12, 0.3, g);
      const core = part(G.sph, mat(P.ice, 1), 0, 0.42, 0, 0.12 + l * 0.02, null, null, g); glow(0x9fe8ff, 0.6, 0.42, g);
      part(G.cyl, mat(P.lav, 0.2), 0, 0.22, 0, 0.03, 0.3, 0.03, g);
      const rings = []; for (let k = 0; k < l; k++) { const r = part(G.tor, mat([P.amber, P.mag, P.teal][k], 0.9), 0, 0.42, 0, 0.22 + k * 0.06, null, null, g); r.rotation.x = 1.2 + k * 0.5; rings.push(r); }
      g.userData.tick = (t) => { rings.forEach((r, k) => { r.rotation.z = t * (0.6 + k * 0.3) * (k % 2 ? -1 : 1); }); core.position.y = 0.42 + Math.sin(t * 1.5) * 0.02; };
    } else { // holo-bazaar
      let y = 0; for (let k = 0; k < l; k++) { const s = 0.34 - k * 0.07; part(G.cyl6, mat(k % 2 ? P.violet : 0x6a56c8, 0.2), 0, y + 0.08, 0, s, 0.16, s, g);
        part(G.cyl6, mat(P.teal, 1.1), 0, y + 0.165, 0, s + 0.01, 0.015, s + 0.01, g); y += 0.17; }
      const holo = part(G.plane, mat(0x7ff7ff, 1.4, { transparent: true, opacity: 0.55, side: 2, depthWrite: false }).clone(), 0, y + 0.22, 0, 0.3, 0.2, 1, g);
      g.userData.tick = (t) => { holo.rotation.y = t * 0.8; holo.material.opacity = 0.45 + Math.sin(t * 6) * 0.08; };
    }
  };
  B.i = function (g, l, v) {
    if (v === 0) { // crystal refinery
      part(G.box, mat(0x4a3a7a, 0.1), 0, 0.1, 0, 0.62, 0.2, 0.5, g); part(G.box, mat(P.amber, 0.9), 0, 0.2, 0.26, 0.5, 0.02, 0.01, g);
      const cr = []; for (let k = 0; k < l + 1; k++) { const a = k * 2.3; const c = part(G.ico, mat(k % 2 ? P.mag : 0xc58bff, 0.8, { flatShading: true }), Math.cos(a) * 0.15, 0.32 + k * 0.03, Math.sin(a) * 0.12, 0.08, 0.2 + k * 0.04, 0.08, g); c.rotation.z = Math.cos(a) * 0.3; cr.push(c); }
      g.userData.tick = (t) => { cr.forEach((c, k) => { c.rotation.y = t * 0.5 + k; }); };
    } else { // plasma harvester
      part(G.cyl, mat(0x5b4a8c, 0.1), 0, 0.15 + l * 0.04, 0, 0.2, 0.3 + l * 0.08, 0.2, g);
      for (let k = 0; k < 3; k++) part(G.tor, mat(P.amber, 0.7), 0, 0.1 + k * 0.1 + l * 0.02, 0, 0.21, 0.21, 0.4, g).rotation.x = Math.PI / 2;
      const top = 0.32 + l * 0.08; const orb = part(G.sph, mat(P.lime, 1.4), 0, top + 0.06, 0, 0.09, null, null, g); glow(0xc8ff8a, 0.5, top + 0.06, g);
      const puffs = []; for (let k = 0; k < 4; k++) { const p = part(G.sph, mat(0xe3c9ff, 0.2, { transparent: true, opacity: 0.4, depthWrite: false }).clone(), 0.25, top, 0, 0.06, null, null, g); puffs.push(p); }
      part(G.cyl, mat(P.lav, 0.1), 0.25, top / 2, 0, 0.04, top, 0.04, g);
      g.userData.tick = (t) => { orb.scale.setScalar(0.09 + Math.sin(t * 3) * 0.015); puffs.forEach((p, k) => { const f = (t * 0.25 + k / 4) % 1; p.position.set(0.25 + f * 0.15, top + f * 0.7, Math.sin(f * 6 + k) * 0.05); p.scale.setScalar(0.05 + f * 0.12); p.material.opacity = 0.45 * (1 - f); }); };
    }
  };
  B.pw = function (g) {
    part(G.cyl6, mat(P.deep, 0.1), 0, 0.05, 0, 0.18, 0.1, 0.18, g); part(G.cone, mat(0x8070d0, 0.2), 0, 0.45, 0, 0.07, 0.8, 0.07, g);
    for (let k = 0; k < 3; k++) { const f = part(G.box, mat(P.lav, 0.15), Math.cos(k * 2.09) * 0.08, 0.25, Math.sin(k * 2.09) * 0.08, 0.02, 0.4, 0.12, g); f.rotation.y = -k * 2.09; }
    const o = part(G.sph, mat(P.ice, 1.8), 0, 0.92, 0, 0.08, null, null, g); const gl = glow(0x9ff2ff, 0.7, 0.92, g);
    const r = part(G.tor, mat(P.teal, 1), 0, 0.92, 0, 0.14, null, null, g);
    g.userData.tick = (t) => { const p = 1 + Math.sin(t * 3 + g.id) * 0.2; gl.scale.set(0.7 * p, 0.7 * p, 1); r.rotation.x = t; r.rotation.y = t * 0.7; o.scale.setScalar(0.08 * p); };
  };
  B.rx = function (g) {
    part(G.cyl6, mat(P.deep, 0.1), 0, 0.06, 0, 0.42, 0.12, 0.42, g);
    for (let k = 0; k < 4; k++) part(G.cyl, mat(0x6a58b0, 0.15), Math.cos(k * 1.57 + 0.78) * 0.28, 0.3, Math.sin(k * 1.57 + 0.78) * 0.28, 0.05, 0.48, 0.05, g);
    const core = part(G.sph, mat(P.mag, 1.8), 0, 0.42, 0, 0.16, null, null, g); const gl = glow(0xff7fd8, 1.0, 0.42, g);
    const r1 = part(G.tor, mat(P.teal, 1.2), 0, 0.42, 0, 0.26, null, null, g), r2 = part(G.tor, mat(P.amber, 1.2), 0, 0.42, 0, 0.32, null, null, g);
    part(G.cone, mat(P.lav, 0.3), 0, 0.72, 0, 0.12, 0.16, 0.12, g);
    g.userData.tick = (t) => { const p = 1 + Math.sin(t * 4 + g.id) * 0.12; core.scale.setScalar(0.16 * p); gl.scale.set(p, p, 1); r1.rotation.x = t * 1.3; r2.rotation.y = t; r2.rotation.x = 0.9; };
  };
  B.mw = function (g) {
    part(G.cyl, mat(0x7a68b8, 0.1), 0, 0.08, 0, 0.3, 0.16, 0.3, g); part(G.cyl, mat(0xbda8ff, 0.6), 0, 0.165, 0, 0.25, 0.01, 0.25, g);
    part(G.tor, mat(P.teal, 0.8), 0, 0.17, 0, 0.29, 0.29, 0.6, g).rotation.x = Math.PI / 2;
    const m1 = part(G.sph, mat(0xeadfff, 0.4, { transparent: true, opacity: 0.35, depthWrite: false }), 0, 0.35, 0, 0.2, null, null, g);
    const m2 = part(G.sph, mat(0xeadfff, 0.4, { transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.55, 0, 0.14, null, null, g);
    g.userData.tick = (t) => { m1.position.y = 0.35 + Math.sin(t) * 0.04; m2.position.y = 0.6 + Math.sin(t * 0.8 + 1) * 0.06; m2.scale.setScalar(0.14 + Math.sin(t * 1.3) * 0.03); };
  };
  B.mc = function (g) {
    part(G.cyl6, mat(P.deep, 0.1), 0, 0.06, 0, 0.42, 0.12, 0.42, g);
    const tw = []; for (let k = 0; k < 3; k++) { const a = k * 2.09, x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22; part(G.cyl, mat(0x7a68b8, 0.15), x, 0.3, z, 0.09, 0.48, 0.09, g); part(G.tor, mat(P.teal, 1.1), x, 0.5, z, 0.1, 0.1, 0.4, g).rotation.x = Math.PI / 2; tw.push(part(G.sph, mat(0xeadfff, 0.5, { transparent: true, opacity: 0.35, depthWrite: false }).clone(), x, 0.62, z, 0.1, null, null, g)); }
    const core = part(G.sph, mat(P.ice, 1.5), 0, 0.3, 0, 0.11, null, null, g); glow(0x9ff2ff, 0.7, 0.3, g);
    g.userData.tick = (t) => { tw.forEach((p, k) => { const f = (t * 0.3 + k / 3) % 1; p.position.y = 0.6 + f * 0.5; p.scale.setScalar(0.08 + f * 0.12); p.material.opacity = 0.4 * (1 - f); }); core.scale.setScalar(0.11 + Math.sin(t * 2) * 0.015); };
  };
  B.park = function (g) {
    const sh = [];
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + 0.4, r = 0.12 + (k % 3) * 0.1, s = 0.5 + (k % 3) * 0.3, x = Math.cos(a) * r, z = Math.sin(a) * r;
      part(G.cyl, mat(P.cream, 0.15), x, 0.1 * s, z, 0.025 * s, 0.2 * s, 0.025 * s, g); sh.push(part(G.hemi, mat([P.teal, P.mag, P.violet][k % 3], 0.9), x, 0.2 * s, z, 0.1 * s, 0.07 * s, 0.1 * s, g)); }
    for (let k = 0; k < 6; k++) part(G.sph, mat(P.lime, 1.4), Math.cos(k) * 0.35, 0.03, Math.sin(k * 1.7) * 0.35, 0.025, null, null, g);
    g.userData.tick = (t) => { sh.forEach((s, k) => { s.rotation.z = Math.sin(t + k) * 0.08; }); };
  };
  B.hall = function (g) {
    part(G.cyl, mat(0x4a3a7a, 0.1), 0, 0.05, 0, 0.46, 0.1, 0.46, g);
    part(G.hemi, glass(0xd9eaff), 0, 0.1, 0, 0.4, 0.38, 0.4, g); part(G.hemi, mat(P.violet, 0.5), 0, 0.1, 0, 0.26, 0.28, 0.26, g);
    const rr = part(G.tor, mat(P.amber, 1), 0, 0.12, 0, 0.44, 0.44, 0.6, g); rr.rotation.x = Math.PI / 2;
    for (let k = 0; k < 4; k++) part(G.cone, mat(P.lav, 0.3), Math.cos(k * 1.57 + 0.78) * 0.4, 0.25, Math.sin(k * 1.57 + 0.78) * 0.4, 0.04, 0.4, 0.04, g);
    const crown = part(G.ico, mat(P.amber, 1.5, { flatShading: true }), 0, 0.62, 0, 0.07, 0.12, 0.07, g); glow(0xffd28a, 0.8, 0.62, g);
    g.userData.tick = (t) => { crown.rotation.y = t; crown.position.y = 0.62 + Math.sin(t * 1.5) * 0.03; };
  };
  B.heal = function (g) {
    part(G.cyl, mat(P.cream, 0.1), 0, 0.1, 0, 0.05, 0.2, 0.05, g);
    const pet = []; for (let k = 0; k < 6; k++) { const p = new THREE.Group(); p.position.y = 0.2; p.rotation.y = k * 1.047; part(G.sph, mat(k % 2 ? 0xff9fd0 : 0xffc2e2, 0.5), 0, 0, 0.18, 0.08, 0.03, 0.18, p); g.add(p); pet.push(p); }
    part(G.sph, mat(P.lime, 1.6), 0, 0.24, 0, 0.08, null, null, g); glow(0xd8ff9f, 0.6, 0.26, g);
    g.userData.tick = (t) => { const o = 0.3 + Math.sin(t * 0.9 + g.id) * 0.2; pet.forEach((p) => { p.rotation.x = -o; }); };
  };
  B.acad = function (g) {
    part(G.cyl6, mat(P.deep, 0.1), 0, 0.06, 0, 0.3, 0.12, 0.3, g); part(G.cap, mat(0x8a7ae0, 0.2), 0, 0.4, 0, 0.22, 0.5, 0.22, g);
    for (let k = 0; k < 4; k++) part(G.sph, mat(P.amber, 1.3), Math.cos(k * 1.57) * 0.11, 0.42, Math.sin(k * 1.57) * 0.11, 0.025, null, null, g);
    const star = part(G.ico, mat(P.ice, 1.8, { flatShading: true }), 0, 0.82, 0, 0.07, null, null, g); glow(0xcff6ff, 0.6, 0.82, g);
    const r1 = part(G.tor, mat(P.teal, 1), 0, 0.82, 0, 0.17, null, null, g), r2 = part(G.tor, mat(P.mag, 1), 0, 0.82, 0, 0.22, null, null, g);
    g.userData.tick = (t) => { star.rotation.y = t * 1.2; r1.rotation.x = t * 0.8; r2.rotation.y = t * 0.6; r2.rotation.x = 1; };
  };
  B.port = function (g) {
    part(G.cyl, mat(0x5a4a8c, 0.1), 0, 0.05, 0, 0.45, 0.1, 0.45, g);
    for (let k = 0; k < 8; k++) part(G.sph, mat(P.teal, 1.6), Math.cos(k * 0.785) * 0.4, 0.11, Math.sin(k * 0.785) * 0.4, 0.025, null, null, g);
    const s = part(G.saucer, mat(0xd8dcf0, 0.2, { metalness: 0.6, roughness: 0.25 }), 0, 0.4, 0, 0.55, null, null, g);
    const d = part(G.sph, mat(P.lime, 0.9, { transparent: true, opacity: 0.7 }), 0, 0.5, 0, 0.1, 0.08, 0.1, g);
    g.userData.tick = (t) => { const y = 0.4 + Math.sin(t * 1.3) * 0.06; s.position.y = y; d.position.y = y + 0.1; s.rotation.y = t * 0.4; };
  };
  B.mono = function (g) {
    part(G.cyl6, mat(P.deep, 0.1), 0, 0.05, 0, 0.42, 0.1, 0.42, g);
    const m = part(G.box, mat(0x221a3c, 0.2, { roughness: 0.2, metalness: 0.4 }), 0, 0.85, 0, 0.22, 1.5, 0.12, g);
    part(G.box, mat(P.mag, 1.6), 0, 0.85, 0.062, 0.03, 1.4, 0.005, g);
    const rings = []; for (let k = 0; k < 3; k++) rings.push(part(G.tor, mat([P.teal, P.mag, P.violet][k], 1.2), 0, 0.5 + k * 0.45, 0, 0.32 - k * 0.05, null, null, g));
    glow(0xff8ad8, 1.6, 1.65, g);
    g.userData.tick = (t) => { rings.forEach((r, k) => { r.rotation.x = Math.PI / 2 + Math.sin(t * 0.7 + k) * 0.2; r.position.y = 0.5 + k * 0.45 + Math.sin(t + k * 2) * 0.05; }); m.rotation.y = Math.sin(t * 0.2) * 0.1; };
  };
  B.whale = function (g) {
    part(G.cyl, mat(0x5e4ca0, 0.1), 0, 0.05, 0, 0.46, 0.1, 0.46, g); part(G.cyl, mat(0xbda8ff, 0.7, { transparent: true, opacity: 0.8 }), 0, 0.105, 0, 0.4, 0.01, 0.4, g);
    const w = new THREE.Group(); g.add(w);
    part(G.sph, mat(0x8fb6ff, 0.35), 0, 0, 0, 0.42, 0.17, 0.18, w); part(G.sph, mat(P.cream, 0.3), 0, -0.06, 0, 0.36, 0.1, 0.15, w);
    const tail = part(G.cone, mat(0x8fb6ff, 0.35), -0.48, 0, 0, 0.12, 0.2, 0.03, w); tail.rotation.z = Math.PI / 2;
    part(G.sph, mat(0x8fb6ff, 0.35), 0.05, -0.05, 0.18, 0.12, 0.02, 0.07, w); part(G.sph, mat(0x8fb6ff, 0.35), 0.05, -0.05, -0.18, 0.12, 0.02, 0.07, w);
    for (let k = 0; k < 5; k++) part(G.sph, mat(P.ice, 1.6), -0.25 + k * 0.12, 0.12, 0, 0.02, null, null, w);
    part(G.sph, mat(0x1a1430, 0), 0.33, 0.04, 0.12, 0.025, null, null, w); part(G.sph, mat(0x1a1430, 0), 0.33, 0.04, -0.12, 0.025, null, null, w);
    g.userData.tick = (t) => { const a = t * 0.4; w.position.set(Math.cos(a) * 0.35, 0.9 + Math.sin(t * 0.9) * 0.08, Math.sin(a) * 0.35); w.rotation.y = -a - Math.PI / 2; tail.rotation.y = Math.sin(t * 2) * 0.4; };
  };
  B.mother = function (g) {
    part(G.cyl6, mat(0x3a2e66, 0.1), 0, 0.06, 0, 0.48, 0.12, 0.48, g);
    for (let k = 0; k < 3; k++) part(G.cyl, mat(P.lav, 0.2), Math.cos(k * 2.09) * 0.3, 0.4, Math.sin(k * 2.09) * 0.3, 0.025, 0.7, 0.025, g);
    const s = part(G.saucer, mat(0xc8c8e8, 0.15, { metalness: 0.7, roughness: 0.25 }), 0, 0.85, 0, 1.15, 0.9, 1.15, g);
    const lights = new THREE.Group(); lights.position.y = 0.84; g.add(lights);
    for (let k = 0; k < 12; k++) part(G.sph, mat(k % 2 ? P.amber : P.teal, 1.8), Math.cos(k * 0.52) * 0.68, 0, Math.sin(k * 0.52) * 0.68, 0.035, null, null, lights);
    const beam = part(G.cone, mat(0xbff6ff, 0.8, { transparent: true, opacity: 0.18, depthWrite: false }).clone(), 0, 0.45, 0, 0.35, 0.8, 0.35, g);
    g.userData.tick = (t) => { lights.rotation.y = t * 0.5; s.position.y = 0.85 + Math.sin(t * 0.8) * 0.04; beam.material.opacity = 0.12 + Math.sin(t * 2) * 0.06; };
  };
  A.figs.make = function (t, l, i) {
    const g = new THREE.Group(); const b = B[t]; if (!b) return null;
    b(g, Math.max(1, l), (i * 7 + ((i / A.N) | 0) * 3) % (t === 'i' ? 2 : 3));
    return g;
  };
})(window.App);
