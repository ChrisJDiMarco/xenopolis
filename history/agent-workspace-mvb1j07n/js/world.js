(function (A) {
  let THREE, R, scene, cam, sun, hemi, skyU, sky, water, tiles, slab, node, strip, decoX, decoS, decoC, cursor, stars, cit, ufo, planetG, fxG;
  const N = A.N, cx = (v) => v - N / 2 + 0.5;
  const W = A.world = { bld: {}, dirty: new Map(), tool: 'look', yaw: 0.78, pitch: 0.95, dist: 21, time: 0, hover: -1, decorDirty: true };
  const C = {};
  W.mark = function (i, anim) { W.dirty.set(i, (W.dirty.get(i) || false) || !!anim); W.decorDirty = true; };
  W.init = function (canvas) {
    THREE = A.THREE;
    R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    R.setPixelRatio(Math.min(devicePixelRatio, 1.75)); R.outputColorSpace = THREE.SRGBColorSpace;
    R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.shadowMap.autoUpdate = false;
    scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xe6cdea, 28, 95);
    cam = new THREE.PerspectiveCamera(36, 1, 0.1, 700); W.target = new THREE.Vector3(0, 0, 0); W.focus = new THREE.Vector3(); W.userAt = W.beamAt = -99; W.ext = 4;
    hemi = new THREE.HemisphereLight(0xffe8f6, 0x5a3c8a, 1.1); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff0e0, 2.2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 90 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
    ['skyTop', 'skyHor', 'fog', 'hemiS', 'sun', 'water'].forEach((k) => { C[k] = new THREE.Color(); });
    C.landA = new THREE.Color(0x2f7f86); C.landB = new THREE.Color(0x5a3c98); C.forest = new THREE.Color(0x8a3c9a);
    C.zr = new THREE.Color(0x6ff2c8); C.zc = new THREE.Color(0x79aaff); C.zi = new THREE.Color(0xffa860);
    buildSky(); buildGround(); buildLife(); buildDrone(); W.rebuildAll(); input(canvas); W.resize();
  };
  function buildSky() {
    skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color(0x2a1d4a) } };
    sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'uniform vec3 top,hor,bot;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.?mix(hor,top,pow(clamp(h,0.,1.),.55)):mix(hor,bot,clamp(-h*4.,0.,1.));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }));
    sky.renderOrder = -1; scene.add(sky);
    planetG = new THREE.Group(); scene.add(planetG);
    const c = document.createElement('canvas'); c.width = 8; c.height = 128; const x = c.getContext('2d');
    const bands = ['#f3c6e6', '#d7a4e8', '#b98ce0', '#f6d9c8', '#e3a6c8', '#9f86e6', '#f0cbe8', '#c79ae0'];
    for (let k = 0; k < 16; k++) { x.fillStyle = bands[k % 8]; x.fillRect(0, k * 8, 8, 8 + (k % 3) * 2); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const gp = new THREE.Mesh(new THREE.SphereGeometry(34, 40, 24), new THREE.MeshStandardMaterial({ map: tex, fog: false, roughness: 1, emissive: 0x6a3c8a, emissiveIntensity: 0.25 }));
    const rc = document.createElement('canvas'); rc.width = 128; rc.height = 4; const rx = rc.getContext('2d');
    for (let k = 0; k < 128; k++) { rx.fillStyle = 'rgba(255,' + (200 + (k * 7) % 50) + ',240,' + (0.15 + 0.5 * Math.abs(Math.sin(k * 0.37))) + ')'; rx.fillRect(k, 0, 1, 4); }
    const rt = new THREE.CanvasTexture(rc);
    const rg = new THREE.RingGeometry(44, 70, 96, 1); const uv = rg.attributes.uv, pos = rg.attributes.position;
    for (let k = 0; k < uv.count; k++) { const d = Math.hypot(pos.getX(k), pos.getY(k)); uv.setXY(k, (d - 44) / 26, 0.5); }
    const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: 2, fog: false, depthWrite: false }));
    ring.rotation.x = 1.25; ring.rotation.y = 0.25; gp.rotation.z = 0.3;
    planetG.add(gp, ring); planetG.position.set(-150, 85, -220);
    W.moons = [new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, emissive: 0x7fa0ff, emissiveIntensity: 0.35, fog: false })),
      new THREE.Mesh(new THREE.SphereGeometry(4, 20, 14), new THREE.MeshStandardMaterial({ color: 0xffc6a8, emissive: 0xff8a7a, emissiveIntensity: 0.3, fog: false }))];
    W.moons.forEach((m) => scene.add(m));
    const sp = []; const r = A.rng(9);
    for (let k = 0; k < 500; k++) { const th = r() * Math.PI * 2, ph = Math.acos(r() * 0.95); sp.push(Math.cos(th) * Math.sin(ph) * 380, Math.cos(ph) * 380, Math.sin(th) * Math.sin(ph) * 380); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff0ff, size: 1.6, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
    scene.add(stars);
  }
  function buildGround() {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(N * 0.8, N * 0.74, 2.2, 64), new THREE.MeshStandardMaterial({ color: 0x2a1d4a, roughness: 0.9 }));
    base.position.y = -1.45; base.receiveShadow = true; scene.add(base);
    const wm = new THREE.MeshStandardMaterial({ color: 0xc6b0ff, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.88, emissive: 0x6a4cd0, emissiveIntensity: 0.25 });
    water = new THREE.Mesh(new THREE.CircleGeometry(N * 0.8, 64), wm); water.rotation.x = -Math.PI / 2; water.position.y = -0.2; water.receiveShadow = true; scene.add(water);
    tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 0.5, 0.96), new THREE.MeshStandardMaterial({ roughness: 0.75, emissive: 0x2a2a6a, emissiveIntensity: 0.5 }), N * N);
    tiles.receiveShadow = true; scene.add(tiles);
    const M = A.figs.mat, G = A.figs.G;
    slab = new THREE.InstancedMesh(new THREE.BoxGeometry(0.98, 0.05, 0.98), M(0x2c2266, 0.15), N * N); slab.receiveShadow = true;
    node = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 16), M(0x5ff8ff, 1.6), N * N);
    strip = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 0.09), M(0x5ff8ff, 1.3), N * N * 2);
    decoX = new THREE.InstancedMesh(G.ico, M(0xff5ec8, 0.7, { flatShading: true }), 900); decoX.castShadow = true;
    decoS = new THREE.InstancedMesh(G.cyl, M(0xf3e6ff, 0.15), 900); decoS.castShadow = true;
    decoC = new THREE.InstancedMesh(G.hemi, M(0xffffff, 0.35, { emissive: 0x6a3cff }), 900); decoC.castShadow = true;
    [slab, node, strip, decoX, decoS, decoC].forEach((m) => { m.count = 0; scene.add(m); });
    cursor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x7ff7ff, transparent: true, opacity: 0.35, depthWrite: false }));
    cursor.rotation.x = -Math.PI / 2; cursor.position.y = 0.04; cursor.visible = false; scene.add(cursor);
    fxG = new THREE.Group(); scene.add(fxG);
  }
  function buildLife() {
    cit = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ roughness: 0.4, emissive: 0x332255, emissiveIntensity: 0.6 }), 80);
    cit.castShadow = true; cit.count = 0; scene.add(cit);
    const cols = [0x7ff2c8, 0xff9fd0, 0xffd27a, 0xa8b8ff], c = new THREE.Color();
    W.cits = []; for (let k = 0; k < 80; k++) { cit.setColorAt(k, c.set(cols[k % 4])); W.cits.push({ i: -1, x: 0, z: 0, tx: 0, tz: 0, sp: 0.35 + (k % 5) * 0.08, ph: k * 1.7 }); }
    ufo = new THREE.InstancedMesh(A.figs.G.saucer, new THREE.MeshStandardMaterial({ color: 0xdfe2f5, metalness: 0.6, roughness: 0.25, emissive: 0x7ff7ff, emissiveIntensity: 0.25 }), 16);
    ufo.castShadow = true; ufo.count = 0; scene.add(ufo);
    W.ufos = []; for (let k = 0; k < 16; k++) W.ufos.push({ a: null, b: null, t: Math.random(), d: 1 });
  }
  function buildDrone() {
    const F = A.figs, G = F.G, g = W.drone = new THREE.Group(), add = (m, x) => { g.add(m); return m; };
    add(new THREE.Mesh(G.saucer, F.mat(0xe8e4ff, 0.3, { metalness: 0.6, roughness: 0.25 }))).scale.setScalar(0.6);
    const d = add(new THREE.Mesh(G.sph, F.mat(0xb8ff7a, 1.3))); d.scale.set(0.13, 0.1, 0.13); d.position.y = 0.12;
    W.beam = add(new THREE.Mesh(G.cone, F.mat(0x9ff8ff, 1.2, { transparent: true, opacity: 0, depthWrite: false }).clone()));
    W.beam.position.y = -1.15; W.beam.scale.set(0.5, 2.3, 0.5); F.glow(0x9ff8ff, 1.2, -0.05, g);
    g.visible = false; g.userData.to = new THREE.Vector3(); g.position.y = 2.4; scene.add(g);
  }
  // The AI just built at cell i: send the drone, and give the director camera somewhere to look.
  W.aiAt = function (i) {
    const x = cx(i % N), z = cx((i / N) | 0); W.drone.userData.to.set(x, 0, z); W.beamAt = W.time + 0.4;
    W.ext = Math.max(W.ext, Math.hypot(x, z) + 2); W.focus.set(x * 0.6, 0, z * 0.6);
  };
  W.aiView = function () { W.target.set(0, 0, 0); W.focus.set(0, 0, 0); W.dist = 24; W.pitch = 0.95; W.ext = 4; W.userAt = -99; };
  function director(dt, calm) {
    const dr = W.drone; dr.visible = !!(A.ai && A.ai.on); if (!dr.visible) return;
    const k = 1 - Math.exp(-dt * 2.2), to = dr.userData.to;
    dr.position.x += (to.x - dr.position.x) * k; dr.position.z += (to.z - dr.position.z) * k;
    dr.position.y = 2.4 + (calm ? 0 : Math.sin(W.time * 2.1) * 0.1); dr.rotation.y += dt * 1.6;
    W.beam.material.opacity = Math.max(0, 0.42 - Math.abs(W.time - W.beamAt) * 0.32);
    if (W.time - W.userAt < 8) return; // a drag or key hands the camera to Chris for a while
    const f = 1 - Math.exp(-dt * (calm ? 0.35 : 0.8)), wide = W.time % 18 < 9, d = wide ? Math.min(44, 12 + W.ext * 1.3) : 13;
    W.target.x += (W.focus.x - W.target.x) * f; W.target.z += (W.focus.z - W.target.z) * f;
    W.dist += (d - W.dist) * f * 0.5; W.pitch += ((wide ? 1.0 : 0.8) - W.pitch) * f * 0.5; if (!calm) W.yaw += dt * 0.07;
  }
  let tmpO = null;
  function obj() { return tmpO || (tmpO = new THREE.Object3D()); }
  W.rebuildAll = function () {
    const b = A.BIOMES[A.S.biome || 0] || A.BIOMES[0]; C.landA.set(b[1]); C.landB.set(b[2]); C.forest.set(b[3]); C.sea = b[4];
    Object.values(W.bld).forEach((g) => { disposeG(g); scene.remove(g); }); W.bld = {};
    for (let i = 0; i < N * N; i++) refresh(i, false);
    W.decorDirty = true; rebuildPaths();
  };
  function tileColor(i) {
    const s = A.S, t = s.cells[i], c = new THREE.Color().copy(C.landA).lerp(C.landB, A.hue[i]);
    if (A.ter[i] === 'f') c.lerp(C.forest, 0.35);
    if (t === 'r' || t === 'c' || t === 'i') c.lerp(C['z' + t], s.lv[i] ? 0.3 : 0.6);
    else if (t && t !== 'p') c.lerp(new THREE.Color(0x8c7ad8), 0.3);
    return c;
  }
  function refresh(i, anim) {
    const s = A.S, o = obj(), x = i % N, y = (i / N) | 0;
    o.position.set(cx(x), -0.25, cx(y)); o.rotation.set(0, 0, 0);
    o.scale.setScalar(A.ter[i] === 'w' ? 0.0001 : 1); o.updateMatrix(); tiles.setMatrixAt(i, o.matrix);
    tiles.setColorAt(i, tileColor(i)); tiles.instanceMatrix.needsUpdate = true; tiles.instanceColor.needsUpdate = true;
    if (W.bld[i]) { disposeG(W.bld[i]); scene.remove(W.bld[i]); delete W.bld[i]; }
    const t = s.cells[i];
    if (!t || t === 'p' || (A.TYPES[t].zone && !s.lv[i])) return;
    const g = A.figs.make(t, s.lv[i], i); if (!g) return;
    g.position.set(cx(x), 0, cx(y)); g.rotation.y = ((i * 13) % 4) * Math.PI / 2;
    g.userData.born = anim ? W.time : -10; g.userData.s = A.TYPES[t].lm ? 1.15 : 1.3; g.scale.setScalar(anim ? 0.001 : g.userData.s);
    scene.add(g); W.bld[i] = g;
    if (anim) W.fx('spark', g.position);
  }
  const shared = new Set();
  function disposeG(g) { if (!shared.size) Object.values(A.figs.mats).forEach((m) => shared.add(m)); g.traverse((o) => { const m = o.material; if (m && !shared.has(m) && !(o.isSprite && !m.userData.own)) { try { m.dispose(); } catch (e) {} } }); }
  function rebuildPaths() {
    const s = A.S, o = obj(); let a = 0, b = 0;
    for (let i = 0; i < N * N; i++) {
      if (s.cells[i] !== 'p') continue; const x = i % N, y = (i / N) | 0;
      o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.position.set(cx(x), A.ter[i] === 'w' ? 0.05 : 0.02, cx(y)); o.updateMatrix();
      slab.setMatrixAt(a, o.matrix); o.position.y += 0.04; o.updateMatrix(); node.setMatrixAt(a, o.matrix); a++;
      if (x < N - 1 && s.cells[i + 1] === 'p') { o.position.set(cx(x) + 0.5, 0.075, cx(y)); o.rotation.y = 0; o.updateMatrix(); strip.setMatrixAt(b++, o.matrix); }
      if (y < N - 1 && s.cells[i + N] === 'p') { o.position.set(cx(x), 0.075, cx(y) + 0.5); o.rotation.y = Math.PI / 2; o.updateMatrix(); strip.setMatrixAt(b++, o.matrix); }
    }
    slab.count = node.count = a; strip.count = b;
    [slab, node, strip].forEach((m) => { m.instanceMatrix.needsUpdate = true; });
    W.pathCells = []; for (let i = 0; i < N * N; i++) if (s.cells[i] === 'p') W.pathCells.push(i);
  }
  function rebuildDecor() {
    const s = A.S, o = obj(), c = new THREE.Color(); let a = 0, b = 0; const cc = [0x5ef2d6, 0xff5ec8, 0x9a7bff, 0xffc46b];
    for (let i = 0; i < N * N; i++) {
      if (s.cells[i]) continue; const t = A.ter[i]; if (t !== 'f' && t !== 'x') continue;
      const r = A.rng(i * 31 + s.seed), x = cx(i % N), z = cx((i / N) | 0);
      if (t === 'x') for (let k = 0; k < 3 && a < 900; k++) { const h = 0.15 + r() * 0.35; o.position.set(x + (r() - 0.5) * 0.6, h * 0.6, z + (r() - 0.5) * 0.6); o.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6); o.scale.set(0.07 + r() * 0.05, h, 0.07 + r() * 0.05); o.updateMatrix(); decoX.setMatrixAt(a++, o.matrix); }
      else for (let k = 0; k < 3 && b < 900; k++) { const s2 = 0.5 + Math.pow(r(), 2) * 1.3, px = x + (r() - 0.5) * 0.65, pz = z + (r() - 0.5) * 0.65;
        o.rotation.set(0, 0, 0); o.position.set(px, 0.12 * s2, pz); o.scale.set(0.03 * s2, 0.24 * s2, 0.03 * s2); o.updateMatrix(); decoS.setMatrixAt(b, o.matrix);
        o.position.set(px, 0.24 * s2, pz); o.scale.set(0.12 * s2, 0.08 * s2, 0.12 * s2); o.updateMatrix(); decoC.setMatrixAt(b, o.matrix); decoC.setColorAt(b, c.set(cc[(r() * 4) | 0])); b++; }
    }
    decoX.count = a; decoS.count = decoC.count = b;
    [decoX, decoS, decoC].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  W.fx = function (kind, at) {
    const G = A.figs.G;
    if (kind === 'spark') { const m = new THREE.Mesh(G.tor, A.figs.mat(0x9ff8ff, 2, { transparent: true, depthWrite: false }).clone()); m.position.copy(at); m.position.y = 0.05; m.rotation.x = Math.PI / 2; m.userData = { life: 0, dur: 0.8, kind }; fxG.add(m); return; }
    const n = kind === 'meteor' ? 10 : kind === 'comet' ? 1 : 24;
    for (let k = 0; k < n; k++) {
      const col = kind === 'spores' ? 0xff9fe0 : kind === 'trader' ? 0xffd27a : 0xcff6ff;
      const s = A.figs.glow(col, kind === 'comet' ? 3 : 0.6, 0); s.material = s.material.clone();
      const st = kind === 'spores' || kind === 'trader' ? new THREE.Vector3((Math.random() - 0.5) * N, 0.3, (Math.random() - 0.5) * N) : new THREE.Vector3(-30 + Math.random() * 20, 30 + Math.random() * 10, -30 + Math.random() * 20);
      s.position.copy(st); s.userData = { life: -k * 0.25, dur: kind === 'comet' ? 6 : 3, kind, st, v: new THREE.Vector3(kind === 'comet' ? 14 : 18, kind === 'comet' ? -2 : -14, 12) }; fxG.add(s);
    }
  };
  function stepFx(dt) {
    for (let k = fxG.children.length - 1; k >= 0; k--) {
      const m = fxG.children[k], u = m.userData; u.life += dt; if (u.life < 0) { m.visible = false; continue; } m.visible = true;
      const f = u.life / u.dur;
      if (f >= 1) { fxG.remove(m); if (m.material && m.material.dispose) m.material.dispose(); continue; }
      if (u.kind === 'spark') { m.scale.setScalar(0.2 + f * 0.8); m.material.opacity = 1 - f; }
      else if (u.kind === 'spores' || u.kind === 'trader') { m.position.y = u.st.y + f * 3; m.material.opacity = Math.sin(f * Math.PI); }
      else { m.position.copy(u.st).addScaledVector(u.v, u.life); m.material.opacity = Math.sin(f * Math.PI); }
    }
  }
  W.resize = function () {
    const w = innerWidth, h = innerHeight; if (!w || !h) return;
    R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  };
  function lerpCol(out, a, b, f) { return out.set(a).lerp(new THREE.Color(b), f); }
  function sky_(dt) {
    const hr = new Date().getHours() + new Date().getMinutes() / 60;
    const dayT = (hr / 24 + W.time / 360) % 1, a = (dayT - 0.25) * Math.PI * 2, el = Math.sin(a);
    const day = THREE.MathUtils.smoothstep(el, -0.2, 0.35), dusk = Math.max(0, 1 - Math.abs(el) * 3.5);
    W.dayF = day;
    lerpCol(C.skyTop, 0x0b0826, 0xb9a2f0, day).lerp(new THREE.Color(0x5a3a8a), dusk * 0.5);
    lerpCol(C.skyHor, 0x2c1858, 0xffd8ea, day).lerp(new THREE.Color(0xff8f86), dusk * 0.55);
    skyU.top.value.copy(C.skyTop); skyU.hor.value.copy(C.skyHor);
    scene.fog.color.copy(C.skyHor).lerp(C.skyTop, 0.25);
    hemi.color.copy(lerpCol(C.hemiS, 0x8a9cff, 0xffeaf6, day)); hemi.intensity = 1.5 - day * 0.3;
    sun.color.copy(lerpCol(C.sun, 0x8f9cff, 0xfff0e0, day).lerp(new THREE.Color(0xffa080), dusk * 0.5)); sun.intensity = 0.5 + day * 1.8;
    const sa = el > -0.1 ? a : a + Math.PI;
    sun.position.set(W.target.x + Math.cos(sa) * 30, W.target.y + Math.abs(Math.sin(sa)) * 26 + 8, W.target.z + 14); sun.target.position.copy(W.target);
    water.material.color.copy(lerpCol(C.water, 0x4a3a9a, C.sea || 0xd0bcff, day)); water.material.emissiveIntensity = 0.2 + (1 - day) * 0.4;
    stars.material.opacity = (1 - day) * 0.9;
    const boost = 0.55 + (1 - day) * 1.5;
    for (const k in A.figs.mats) { const m = A.figs.mats[k]; m.emissiveIntensity = m.userData.base * boost; }
    const t = W.time * 0.02;
    W.moons[0].position.set(Math.cos(t) * 160, 70 + Math.sin(t * 0.7) * 20, -180 + Math.sin(t) * 40);
    W.moons[1].position.set(120 + Math.cos(t * 1.6) * 40, 45 + Math.sin(t * 1.3) * 15, -170);
    planetG.rotation.y = W.time * 0.003;
  }
  function life(dt) {
    const t = W.time, o = obj(), st = A.stats, pc = W.pathCells || [];
    const nc = pc.length ? Math.min(80, 6 + Math.floor(st.pop / 12), pc.length * 3) : 0;
    for (let k = 0; k < nc; k++) {
      const c = W.cits[k];
      if (c.i < 0 || A.S.cells[c.i] !== 'p') { c.i = pc[(Math.random() * pc.length) | 0]; c.x = c.tx = cx(c.i % N) + (Math.random() - 0.5) * 0.4; c.z = c.tz = cx((c.i / N) | 0) + (Math.random() - 0.5) * 0.4; }
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz);
      if (d < 0.05) { const x = c.i % N, y = (c.i / N) | 0, opts = [];
        for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + ax, Y = y + ay; if (X >= 0 && Y >= 0 && X < N && Y < N && A.S.cells[Y * N + X] === 'p') opts.push(Y * N + X); }
        if (opts.length) c.i = opts[(Math.random() * opts.length) | 0]; c.tx = cx(c.i % N) + (Math.random() - 0.5) * 0.5; c.tz = cx((c.i / N) | 0) + (Math.random() - 0.5) * 0.5; }
      else { const v = Math.min(d, c.sp * dt); c.x += dx / d * v; c.z += dz / d * v; }
      const hop = Math.abs(Math.sin(t * 6 + c.ph));
      o.position.set(c.x, 0.15 + hop * 0.04, c.z); o.rotation.set(0, 0, 0); o.scale.set(0.055, 0.07 * (0.9 + hop * 0.2), 0.055); o.updateMatrix(); cit.setMatrixAt(k, o.matrix);
    }
    cit.count = nc; cit.instanceMatrix.needsUpdate = true; if (cit.instanceColor) cit.instanceColor.needsUpdate = true;
    const keys = Object.keys(W.bld); const nu = keys.length > 1 ? Math.min(16, 1 + Math.floor(st.pop / 90) + ((st.counts || {}).port ? 5 : 0)) : 0;
    for (let k = 0; k < nu; k++) {
      const u = W.ufos[k];
      if (!u.a || u.t >= 1) { u.a = W.bld[keys[(Math.random() * keys.length) | 0]]; u.b = W.bld[keys[(Math.random() * keys.length) | 0]]; u.t = 0; u.d = Math.max(2, u.a && u.b ? u.a.position.distanceTo(u.b.position) : 2); }
      if (!u.a || !u.b) continue;
      u.t += dt * 1.2 / u.d; const f = u.t, e = f * f * (3 - 2 * f);
      o.position.lerpVectors(u.a.position, u.b.position, e); o.position.y = 0.9 + Math.sin(f * Math.PI) * (1 + u.d * 0.12) + Math.sin(t * 3 + k) * 0.03;
      o.rotation.set(Math.sin(t * 2 + k) * 0.1, t * 2, 0); o.scale.setScalar(0.22); o.updateMatrix(); ufo.setMatrixAt(k, o.matrix);
    }
    ufo.count = nu; ufo.instanceMatrix.needsUpdate = true;
  }
  W.frame = function (dt) {
    if (W.lost) return;
    W.time += dt;
    if (W.dirty.size) { W.dirty.forEach((anim, i) => refresh(i, anim)); W.dirty.clear(); rebuildPaths(); }
    if (W.decorDirty) { W.decorDirty = false; rebuildDecor(); }
    sky_(dt);
    const calm = A.reduced;
    for (const k in W.bld) { const g = W.bld[k], u = g.userData;
      if (u.born > -1) { const f = Math.min(1, (W.time - u.born) / 0.9); const e = 1 + 2.7 * Math.pow(f - 1, 3) + 1.7 * Math.pow(f - 1, 2); g.scale.setScalar(Math.max(0.001, e) * u.s); if (f >= 1) { u.born = -10; g.scale.setScalar(u.s); } }
      if (u.tick && !calm) u.tick(W.time + (+k) * 0.37, dt); }
    if (!calm) life(dt); else { cit.count = 0; ufo.count = 0; }
    stepFx(dt);
    keys(dt); director(dt, calm);
    W.pitch = Math.max(0.45, Math.min(1.35, W.pitch)); W.dist = Math.max(6, Math.min(48, W.dist));
    const lim = N * 0.55; W.target.x = Math.max(-lim, Math.min(lim, W.target.x)); W.target.z = Math.max(-lim, Math.min(lim, W.target.z));
    cam.position.set(W.target.x + Math.cos(W.yaw) * Math.cos(W.pitch) * W.dist, Math.sin(W.pitch) * W.dist, W.target.z + Math.sin(W.yaw) * Math.cos(W.pitch) * W.dist);
    cam.lookAt(W.target); sky.position.copy(cam.position); R.shadowMap.needsUpdate = (W.fc = (W.fc || 0) + 1) % 3 === 1;
    R.render(scene, cam);
  };
  // ---- input
  const held = {}, ray = { r: null };
  function keys(dt) {
    const sp = W.dist * 0.9 * dt, fx = -Math.cos(W.yaw), fz = -Math.sin(W.yaw);
    if (held.w || held.arrowup) { W.target.x += fx * sp; W.target.z += fz * sp; }
    if (held.s || held.arrowdown) { W.target.x -= fx * sp; W.target.z -= fz * sp; }
    if (held.a || held.arrowleft) { W.target.x += fz * sp; W.target.z -= fx * sp; }
    if (held.d || held.arrowright) { W.target.x -= fz * sp; W.target.z += fx * sp; }
    if (held.q) W.yaw -= dt * 1.4; if (held.e) W.yaw += dt * 1.4;
  }
  W.pick = function (px, py) {
    if (!ray.r) { ray.r = new THREE.Raycaster(); ray.p = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); ray.v = new THREE.Vector3(); ray.m = new THREE.Vector2(); }
    ray.m.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); ray.r.setFromCamera(ray.m, cam);
    if (!ray.r.ray.intersectPlane(ray.p, ray.v)) return -1;
    const x = Math.floor(ray.v.x + N / 2), y = Math.floor(ray.v.z + N / 2);
    return x >= 0 && y >= 0 && x < N && y < N ? y * N + x : -1;
  };
  W.cellsBetween = function (a, b, tool) {
    const ax = a % N, ay = (a / N) | 0, bx = b % N, by = (b / N) | 0, out = [];
    if (tool === 'p') { const sx = Math.sign(bx - ax) || 1, sy = Math.sign(by - ay) || 1;
      for (let x = ax; x !== bx + sx; x += sx) out.push(ay * N + x); for (let y = ay + sy; y !== by + sy; y += sy) out.push(y * N + bx); return out; }
    if (A.TYPES[tool] && !A.TYPES[tool].zone) return [b];
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) out.push(y * N + x);
    return out;
  };
  W.showCursor = function (cells, ok) {
    const s = cells && cells.length; cursor.visible = !!s; if (!s) return;
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; cells.forEach((i) => { const x = i % N, y = (i / N) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    cursor.position.set(cx((x0 + x1) / 2), 0.06, cx((y0 + y1) / 2)); cursor.scale.set(x1 - x0 + 1, y1 - y0 + 1, 1);
    cursor.material.color.set(ok ? (W.tool === 'x' ? 0xff7aa8 : 0x7ff7ff) : 0xff5a6a);
  };
  function input(cv) {
    const ptrs = new Map(); let drag = null, pinch = 0;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); W.lost = true; A.flushSave(); const d = document.createElement('div'); d.id = 'lost'; d.textContent = 'The graphics paused. Your city is saved; it resumes in a moment.'; document.body.appendChild(d); });
    cv.addEventListener('webglcontextrestored', () => { W.lost = false; const d = document.getElementById('lost'); if (d) d.remove(); W.rebuildAll(); });
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); W.userAt = W.time;
      if (ptrs.size === 2) { drag = { mode: 'pan2' }; const p = [...ptrs.values()]; pinch = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); W.showCursor(null); return; }
      const mode = e.button === 2 ? 'rot' : (e.button === 1 || e.shiftKey || W.tool === 'look') ? 'pan' : 'paint';
      drag = { mode, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, a: W.pick(e.clientX, e.clientY), moved: 0 };
    });
    cv.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (drag && drag.mode === 'pan2' && p && ptrs.size === 2) {
        const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; pan(dx / 2, dy / 2);
        const q = [...ptrs.values()], d = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y); if (pinch) W.dist *= pinch / d; pinch = d; return;
      }
      if (p) { p.x = e.clientX; p.y = e.clientY; }
      const i = W.pick(e.clientX, e.clientY); W.hover = i;
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag.mode === 'rot') { W.yaw += dx * 0.008; W.pitch += dy * 0.005; }
        else if (drag.mode === 'pan') pan(dx, dy);
        else if (drag.mode === 'paint' && drag.a >= 0 && i >= 0) { const cs = W.cellsBetween(drag.a, i, W.tool); W.showCursor(cs, !A.canPlace(W.tool, i)); A.ui.tip(null); }
      } else if (W.tool !== 'look' && i >= 0) { W.showCursor([i], !A.canPlace(W.tool, i)); A.ui.tip(i, e.clientX, e.clientY); }
      else { W.showCursor(W.tool === 'look' && i >= 0 ? [i] : null, true); A.ui.tip(i, e.clientX, e.clientY); }
    });
    const end = (e) => {
      ptrs.delete(e.pointerId);
      if (!drag) return;
      if (drag.mode === 'paint') { const b = W.pick(e.clientX, e.clientY); if (drag.a >= 0 && b >= 0) A.actions.paint(W.tool, W.cellsBetween(drag.a, b, W.tool)); W.showCursor(null); }
      else if (drag.mode === 'pan' && drag.moved < 6 && W.tool === 'look') { const i = W.pick(e.clientX, e.clientY); A.ui.tip(i, e.clientX, e.clientY, true); }
      if (ptrs.size === 0) { drag = null; W.saveView(); }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', () => { if (!drag) { W.showCursor(null); A.ui.tip(null); } });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); W.userAt = W.time; W.dist *= Math.exp(e.deltaY * 0.0012); W.saveView(); }, { passive: false });
    addEventListener('keyup', (e) => { if ('wasdqe'.includes(e.key.toLowerCase())) W.saveView(); });
    addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return; const k = e.key.toLowerCase(); held[k] = true; if (/^(arrow|[wasdqe]$)/.test(k)) W.userAt = W.time; });
    addEventListener('keyup', (e) => { held[e.key.toLowerCase()] = false; });
    addEventListener('blur', () => { for (const k in held) held[k] = false; });
  }
  let vT = 0;
  W.saveView = function () { if (A.S.ai) return; clearTimeout(vT); vT = setTimeout(() => { try { window.cabinet && cabinet.remember && cabinet.remember('view', { v: 1, yaw: +W.yaw.toFixed(3), pitch: +W.pitch.toFixed(3), dist: +W.dist.toFixed(2), x: +W.target.x.toFixed(2), z: +W.target.z.toFixed(2) }); } catch (e) {} }, 800); };
  W.loadView = function () { try { const v = window.cabinet && cabinet.recall ? cabinet.recall('view', null) : null; if (!v || typeof v !== 'object') return; const f = (n, lo, hi, d) => Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
    W.yaw = f(v.yaw, -100, 100, W.yaw); W.pitch = f(v.pitch, 0.45, 1.35, W.pitch); W.dist = f(v.dist, 6, 48, W.dist); W.target.x = f(v.x, -20, 20, 0); W.target.z = f(v.z, -20, 20, 0); } catch (e) {} };
  function pan(dx, dy) {
    const s = W.dist * 0.0022, fx = -Math.cos(W.yaw), fz = -Math.sin(W.yaw);
    W.target.x += (fz * dx + fx * dy) * s; W.target.z += (-fx * dx + fz * dy) * s;
  }
})(window.App);
