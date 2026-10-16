# Xenopolis

A city-builder in the spirit of SimCity, set on an alien world, built as a Thinklet (Cabinet Next) panel in three.js. You found a colony on a bioluminescent shore, lay glowing paths, zone pods and markets, power them with pylons and mist wells, and grow from Outpost to bigger tiers while balancing Lumen (money), happiness, tax and smog. It has civic buildings, landmarks, a goal ladder, undo, a minimap and an AI Mayor that can build the city for you or "dream" whole new worlds in different styles (sprawl, eco, mega, spiral, fractal, ring, wild). The last saved build is version 46, which saves within half a second of every change and picks up exactly where you left off.

Built with Claude: Thinklet's builder on claude-opus-5-5, 2026-10-15 to 2026-10-16.

## How to run

- **Inside Thinklet:** it's the "Xenopolis" panel (id `4htowjdo`). Thinklet adds an import map for three.js 0.186.1 to the page.
- **Standalone:** `index.html` does **not** run as-is outside Thinklet, because it does `import * as THREE from 'three'` and only Thinklet supplies the import map (tested headless on 2026-10-16: "Failed to resolve module specifier 'three'"). To play it standalone, add this line right after `<head>` in a copy of `index.html`, then open it or serve the folder (`python3 -m http.server`):

  ```html
  <script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
  ```

  With that line it renders and plays (tested headless the same day). It needs an internet connection for the CDN. Without Thinklet, `window.cabinet` is missing, so the city isn't saved between sessions, the figurine bundle can't load, and AI Mayor dreams aren't kept (they live in Thinklet's store).

## What's in here

| Path | What it is |
|------|-----------|
| `index.html`, `js/` | The game as it runs in the panel (most of the game is inline in `index.html`; `js/autopilot.js` is the AI Mayor, a local autoplayer that needs no AI service, `js/figurines.js` reads the figurine bundle) |
| `thinklet/spec-prompt.md` | The original spec prompt the panel was built from |
| `thinklet/panel.json` | The full panel entry from Thinklet's `Panels.json`: title, prompt, version log, panel commands, memory keys, build costs |
| `thinklet/memory.json` | Saved state from Thinklet (AI Mayor tally) |
| `thinklet/store/` | The panel's Thinklet store: `items/drops/xenopolis_figurines_bundle.js` (3D figurine models given to the panel; the `-2` file is an identical copy), `items/dreams/*.json` (AI-dreamed cities), `items/_memory/` (the saved city and storage), `history/` (earlier dream saves), `index.json` |
| `thinklet/store-rules.json` | The store's keep rules (last 20 dreams) |
| `thinklet/poster.jpg` | The panel's poster thumbnail |
| `history/versions/*.json` | The last 20 saved versions from Thinklet. Each one holds the full source of every file (`files`) plus the panel state at that point. File names are millisecond timestamps |
| `history/agent-workspace-mvb1j07n/` | An earlier multi-file build (around version 25) from Thinklet's agent workspace, split into `state.js`, `sim.js`, `world.js`, `ui.js`, `ai.js`, `figs.js`, `main.js` |

## Original location

`~/Library/Application Support/Cabinet Next/Panels/Panels/4htowjdo` (versions in `.../Panels/Panels/versions/4htowjdo`, store in `.../Panels/Panels/4htowjdo.store`, workspace in `~/Library/Application Support/Cabinet Next/agents/Workspace/panels/4htowjdo/mvb1j07n`). Backed up on 2026-10-16.
