# Xenopolis - original Thinklet spec

The prompt this panel was built from (Thinklet panel id `4htowjdo`).

---

A full, playable city-builder game in the spirit of SimCity, set on a beautiful, unique alien world. It's Chris's own original take, not a clone. Built in three.js (WebGL) as a real game played right in the card, and it gets bigger in the large view.

WORLD AND LOOK: An isometric/orbit 3D view of an alien planet surface. Bioluminescent terrain in teal, violet and magenta, crystal outcrops, glowing fungal forests, lavender seas, two moons and a ringed gas giant in the sky, and a slow day/night cycle (nights glow, days are hazy pastel). Soft fog, bloom, gentle shadows. It should feel calm, premium and gorgeous, like a living diorama. The camera pans (drag/WASD), zooms (scroll), rotates (right-drag/Q,E).

ALIEN FIGURINES (made procedurally in code, sculpted like Blender figurine models: smooth bevelled shapes, subsurface-like glow, a handmade toy-diorama feel, many small parts):
- Residential: spore-pod dwellings, coral spires, floating bubble homes that grow in tiers as density rises (3 levels each).
- Commercial: glowing mushroom markets, orbiting trade rings, holo-bazaars.
- Industrial: crystal refineries, plasma harvesters with drifting vapor.
- Civic: energy pylons (power), mist wells (water), a Hive Council dome (city hall), healing blooms (health), star academies (education), a UFO port.
- Transport: glowing levitation paths instead of roads. Little UFOs and saucers fly between buildings along routes, and tiny alien citizens (blobby, antennae, several species) wander paths.
- Landmarks unlocked by milestones: Monolith of Echoes, Sky Whale Sanctuary, Mothership dock.
Each building gets small idle animations (pulsing light, bobbing, rotating rings) and a materialize animation when placed.

SIMULATION (real game logic): zone residential/commercial/industrial on a grid; buildings grow when zones have power, water and path access. Track population, Lumen (currency), happiness, energy and water supply/demand, and pollution (spore smog from industry). RCI demand bars. Taxes slider. Monthly budget ticks with income/expenses. Land value is affected by parks (glow gardens) and pollution. Random events: meteor showers, spore blooms, visiting traders, a comet festival. Speed controls: pause, 1x, 3x. Bulldoze tool and undo.

UI: A slim glassy toolbar (zones, paths, utilities, civic, landmarks, bulldoze) with figurine icons, a top HUD (population, Lumen, happiness, date in alien cycles, speed), a minimap, hover tooltips, and a city-name prompt at the start. A milestone log of tiered names (Outpost → Colony → Hive → Metropolis → Star Capital). Ambient generative WebAudio soundtrack, off by default with a toggle.

SAVE: autosave the whole city with window.cabinet.save/load (localStorage fallback) and resume where you left off. Offer a New City button with a confirmation.

PERFORMANCE: instanced meshes, capped pixel ratio, pause rendering when offscreen/hidden, smooth on a laptop. Respect prefers-reduced-motion.

ACTIONS for chat: status(), setSpeed(speed), placeLandmark(name), newCity(name), cityReport().

Change requested 2026-10-16: Use the real Blender figurines from the attached file xenopolis_figurines_bundle.js (31 embedded GLB models: res_sporepod_1-3, res_coral_spire_1-3, res_bubble_home_1-3, the commercial com_* models, industry, civic, landmark lm_* models, vehicles veh_saucer and cargo UFO, citizens cit_blob_*). Load them with three.js GLTFLoader and use them for every building type and density level, landmark, UFO/saucer and citizen, scaled to fit each tile (models are ~1 unit tall, base at origin, vertex colors). Keep the materialize animation, pulse/bob/ring idle animations, instancing and glow. If any model fails to load, fall back to the current procedural shape for it. Do not touch the save data (city 'huuu'), simulation, UI or actions.

Change requested 2026-10-16: Use the real Blender figurines from xenopolis_figurines_bundle.js, which is now kept in this thinklet (from Creations). It has 31 embedded GLB models: res_sporepod_1-3, res_coral_spire_1-3, res_bubble_home_1-3, com_* commercial, industry, civic, lm_* landmarks, veh_saucer and cargo UFO, cit_blob_* citizens. Load them with three.js GLTFLoader and use them for every building type and density level, landmark, UFO/saucer and citizen, scaled to fit each tile (models ~1 unit tall, base at origin, vertex colors). Keep the materialize animation, pulse/bob/ring idle animations, instancing and glow. If a model fails to load, fall back to the procedural shape for it. Show a small 'Figurines: N/31 loaded' note in the H health check. Do not touch the save data (city 'huuu'), simulation, UI or actions.

Change requested 2026-10-16: Remove the Blender figurine attachment request entirely: drop both 2026-10-16 change requests about xenopolis_figurines_bundle.js from the brief, stop looking for or asking to re-attach the bundle, and clear the headline/note that says it's waiting on the figurines or to re-attach them. Keep the current procedural buildings exactly as they are. Do not touch the save data (city 'huuu'), simulation, UI or actions.

Change requested 2026-10-16: Use the file I gave it, kept in its own store: xenopolis_figurines_bundle.js as "drops/xenopolis_figurines_bundle.js". Read it with cabinet.store.get and show what it holds, and handle files given later the same way with cabinet.onDrop.
