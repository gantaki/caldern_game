# The Lumbrite Mines of Caldern — Game Plan

## 1. Concept

**Genre:** 2D exploration / story-driven adventure with horror elements
**Visual references:** Celeste (pixel art, clean animations), Noita (dungeon atmosphere, particles, lighting)
**Narrative references:** Hollow Knight (world scale, environmental storytelling), SOMA (quiet horror, philosophy), Darkest Dungeon (environmental pressure on the mind), Disco Elysium (deep NPCs, politics, decay)
**Tone:** Cold, dark, claustrophobic. Beauty in decay. NPCs clinging to remnants of normalcy in an abnormal place. The ending is not a boss — it's understanding.

### Setting

Caldern is an underground mine-city, once a thriving center for extracting **lumbrite** — an extremely rare ore that served as a unique energy source (analogous to Spice from Dune). The city attracted thousands of people. But the ore was depleting, mines went deeper, logistics got more expensive. Workers hadn't seen sunlight in years. Lumbrite emitted a strange energy — changing people physically and mentally. Madness, despotism of overseers, riots, cave-ins. Over the last 10-20 years, most of the city has been abandoned. On the upper levels, they still mine scraps of lumbrite for the black market.

**Lumbrite** — from "lumen" (light) + "umbra" (shadow). Glows with cold light in the dark. Energy source for Caldern's steam mechanisms. Prolonged exposure changes people — physically and mentally. The deeper the deposits, the brighter the glow and stronger the effect. At the very bottom, lumbrite is blinding.

### Steampunk Elements

- Steam elevators between levels (some work, some need repair)
- Pneumatic mail — old messaging system. Player finds stuck capsules with letters (lore + quest items)
- Steam ventilation systems — supplied air to lower levels, many are broken
- Lumbrite generators — ore as fuel for steam machines. On lower levels, generators still run, powered by veins in the walls. An abandoned factory where machines spin on their own

### World Structure (vertical)

**Upper levels — "The Edge"**
Still alive, semi-legal. Black market for lumbrite, bars, equipment traders, former miners who couldn't leave. Steam elevators still work, but unreliably. First clues about the humanitarian group.

**Middle levels — "The Spine"**
Abandoned residential quarters, workshops, steam stations. Schools, hospitals, parks with lumbrite lamps. Empty, but signs of life remain. Hermits. Traces of the humanitarian mission — graffiti, notes, camps.

**Lower levels — "The Guts"**
Industrial zones, mines, processing plants. Flooded tunnels, cave-ins, barricades from riots. Lumbrite in the walls glows brighter. People here are changed — not monsters, but not who they used to be. Their own logic, their own "truth."

**The Bottom — "The Root"**
Nobody knows what's there. Old maps end. Lumbrite is blinding. Maximum exposure. There is no answer here — only a question. Like the ending of "2001: A Space Odyssey": something incomprehensible that forces you to rethink everything that came before. No fantasy — just the sensation of something beyond understanding.

### Story

The protagonist is an investigator with spelunking experience. He once descended into Caldern, but no further than the middle levels. Hired by a wealthy man: find his daughter, who went down a couple of years ago with a humanitarian aid group and disappeared. The father has partly lost hope but wants to know what happened, and if possible — find the body.

The game is an investigation. On the way down, the story unfolds: the history of riots, life in the city, NPC stories (why they're still here, nostalgia for the past). Themes: relationships, hard choices, despotism, exploitation.

### Lumbrite Exposure (gameplay)

Not an HP bar, but an atmospheric tool. The deeper and longer near lumbrite — the stronger the effects: visual distortions, palette changes, possible hallucinations (NPCs who say strange things — are they real?). Closer to Darkest Dungeon stress, but softer and more narrative-driven.

---

## 2. Tech Stack

| Component | Technology | Version | Why |
|-----------|-----------|---------|-----|
| Language | TypeScript | 5.x | Strict typing, best AI-agent support |
| Renderer | PixiJS | v8 | WebGL, fast, mature. Rendering only, no imposed architecture |
| Bundler | Vite | 6.x | HMR, fast dev server, simple config |
| Testing | Vitest | latest | Native Vite integration, fast, TypeScript out of the box |
| Linter | ESLint + Prettier | latest | Consistent code style |
| Desktop | Tauri | v2 | For Steam builds. 5-15MB instead of 150MB+ Electron |
| CI | GitHub Actions | — | Auto-tests on every push |

### Principle: PixiJS is rendering only

PixiJS is used exclusively as a graphics library. All game logic is in our own code:
- Game loop (custom)
- Entity system (custom, simple, not a full ECS)
- Camera (custom)
- Collisions (custom, AABB for tiles)
- Tilemap system (custom)
- Dialogue system (custom)
- Save system (custom, IndexedDB)
- Input manager (custom)
- Audio manager (Web Audio API)

**Why not Phaser:** Phaser imposes architecture (Scene-based), hides internal state, creates "magic" bugs. AI agent works more effectively with code it wrote itself. Every line is understandable, every line is changeable.

---

## 3. Project Architecture

### Directory Structure

```
caldern/
├── gameplan.md                  # This file — full development plan
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── index.html
│
├── src/
│   ├── main.ts                  # Entry point, initialization
│   │
│   ├── core/                    # Engine core (reusable)
│   │   ├── Game.ts              # Game loop, timing, states
│   │   ├── Camera.ts            # 2D camera, follow, zones, shake
│   │   ├── InputManager.ts      # Keyboard + Gamepad, rebindable actions
│   │   └── EventBus.ts          # Global typed event bus
│   │
│   ├── physics/                 # Physics and collisions
│   │   ├── CollisionSystem.ts   # AABB collisions with tilemap
│   │   └── Body.ts              # Physics body (position, velocity, gravity)
│   │
│   ├── world/                   # World and tiles
│   │   └── TileMap.ts           # Tilemap data, collisions, coordinate helpers
│   │
│   ├── entities/                # Game entities
│   │   ├── Player.ts            # Player: movement, climbing, rope traversal
│   │   ├── NPC.ts               # NPC: position, dialogue lines, interaction
│   │   ├── InteractiveObject.ts # Base class for interactive world objects
│   │   ├── SteamElevator.ts     # Vertical steam-powered platform
│   │   ├── Ladder.ts            # Vertical ladder (climb up/down)
│   │   └── Rope.ts              # Horizontal rope (traverse left/right)
│   │
│   ├── dialogue/                # Dialogue system
│   │   └── DialogueManager.ts   # Text overlay display + input handling
│   │
│   ├── audio/                   # Sound
│   │   └── AmbientMusic.ts      # Procedural ambient music (Web Audio API)
│   │
│   ├── config/                  # Configuration
│   │   └── constants.ts         # Global constants
│   │
│   └── utils/                   # Utilities
│       ├── math.ts              # Vectors, interpolation, random numbers
│       └── DebugPanel.ts        # Debug overlay (F3)
│
├── assets/                      # Assets (sprites, sounds, music)
├── tests/                       # Tests (mirror src/ structure)
└── docs/
    └── design.md
```

### Key Architectural Decisions

**1. Game Loop — fixed timestep for physics, interpolation for rendering**

```
while (accumulator >= FIXED_DT) {
    update(FIXED_DT)     // Physics, logic — deterministic
    accumulator -= FIXED_DT
}
render(accumulator / FIXED_DT)  // Interpolation for smoothness
```

**2. Data — JSON, editable by AI agent**

All game data (NPCs, dialogues, quests, maps) are JSON files with TypeScript types for validation.

**3. Lighting — darkness mask**

The entire screen is dark by default. Light sources punch "holes" in the mask via multiply blend.

**4. Interactive Objects — composition-based**

All world objects (elevators, ladders, ropes) extend a common `InteractiveObject` base class with AABB overlap detection, per-type `update()` and `render()` methods, and interaction hooks.

---

## 4. AI Agent: Instructions and Conventions

### Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run test         # Run all tests
npm run test:watch   # Tests in watch mode
npm run build        # Production build
```

### Key Patterns

- Composition over inheritance
- EventBus for cross-system communication (typed)
- All game data is JSON with TypeScript type validation
- Fixed timestep physics (60Hz), variable render
- Camera: smooth follow with bounds clamping

### Naming

- Files: `PascalCase.ts` for classes, `camelCase.ts` for utilities
- Classes: `PascalCase`
- Methods/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/interfaces: `PascalCase`, no `I` prefix for interfaces
- JSON data: `kebab-case.json`

### TypeScript Strictness

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Game-Specific Notes

**Lighting:**
- Screen is dark by default (multiply blend mask)
- Light sources punch "holes" in darkness
- Player has a lantern (warm light)
- Lumbrite veins emit cold blue light

**Collisions:**
- AABB only, no pixel-perfect
- Separate X/Y resolution for clean corners
- Coyote time + jump buffer for responsive platforming

**TileMap:**
- Layers: collision, background, foreground, lumbrite
- 8x8 pixel tiles (fine resolution)

**PixiJS v8 API:**
- `Application.init()` is async
- Graphics uses chained `.rect().fill()` pattern (not `.beginFill()`)
- RenderTexture: `app.renderer.render({ container, target, clear })`
- No `PIXI` global — import everything directly
- Blend modes are strings: 'multiply', 'add', 'screen'

---

## 5. Development Cycle (AI-first)

```
1. Describe the task to the agent (text)
2. Agent writes/modifies code + tests
3. Agent runs tests (vitest --run)
4. If tests green -> run and visually verify (npm run dev)
5. If adjustments needed -> describe what's wrong -> repeat
```

---

## 6. Development Phases

**Phase 1 — Engine Core**
- [x] Game loop + renderer (PixiJS init)
- [x] Tilemap loading and rendering
- [x] Player: movement, gravity, tile collisions
- [x] Camera with smooth follow
- [x] Input (keyboard)
- [x] Basic lighting (darkness mask + lantern)
- [x] Debug panel (F3: full lighting, no-gravity fly mode)
- [x] Procedural ambient music (Web Audio API)
- [x] Interactive objects: steam elevator, ladder, rope
- [x] NPC with dialogue system

**Phase 2 — World and Navigation**
- [ ] Chunk-based loading
- [ ] Parallax backgrounds
- [ ] Zone transitions between locations
- [ ] Map (fog-of-war, fills in during exploration)
- [ ] Save system

**Phase 3 — NPCs and Dialogues (expanded)**
- [ ] NPC sprites and idle animations
- [ ] Dialogue system with choices and branching
- [ ] Investigation journal
- [ ] Quest and flag system
- [ ] Pneumatic mail and notes (lore)

**Phase 4 — Atmosphere and Effects**
- [ ] Particles (dust, steam, drops, sparks)
- [ ] Lumbrite glow in walls
- [ ] Ambient sounds per zone
- [ ] Music with crossfades
- [ ] Lumbrite exposure (visual distortions)
- [ ] Post-processing (vignette, color grading by depth)

**Phase 5 — Content (main volume)**
- [ ] Design all locations in Tiled
- [ ] All NPCs, dialogues, quests
- [ ] Storyline: the daughter investigation
- [ ] Lore: letters, notes, graffiti, documents
- [ ] Unique mechanics per zone
- [ ] Finale — "The Root"

**Phase 6 — Polish and Release**
- [ ] Tauri build for Steam
- [ ] Steam integration (achievements, cloud saves)
- [ ] Balance, QA
- [ ] Demo for Steam Next Fest
- [ ] Trailer, Steam page, marketing

---

## 7. Deployment

### Development
```bash
npm run dev          # Vite dev server with HMR
npm run test         # Vitest — all tests
npm run test:watch   # Tests in watch mode
```

### Production
```bash
npm run build        # Vite production build
npm run preview      # Local build preview
```

### Steam (Tauri)
```bash
npm run tauri build  # Native build for Windows/Mac/Linux
```

Build size: ~10-20MB (vs 150MB+ Electron). Includes native webview, doesn't ship Chromium.
