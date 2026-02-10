# Caldern — AI Agent Instructions

## Project Overview
2D exploration game "Люмбритовые шахты Кальдерна" (The Lumbrite Mines of Caldern).
Stack: PixiJS v8 + TypeScript + Vite. Custom mini-engine, no game framework.

## Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run test         # Run all tests
npm run test:watch   # Tests in watch mode
npm run build        # Production build
```

## Architecture

### Core principle
PixiJS is ONLY used for rendering. All game logic is in our own code.
No Phaser, no ECS framework, no magic. Simple classes, typed events, JSON data.

### Directory structure
- `src/core/` — Engine: game loop, camera, input, events, scene management
- `src/physics/` — Body, collision resolution vs tilemap
- `src/world/` — TileMap, chunks, zones, parallax
- `src/entities/` — Player, NPC, interactive objects
- `src/dialogue/` — Dialogue system, parser, UI
- `src/narrative/` — Quests, journal, lore, flags
- `src/effects/` — Particles, lighting, lumbrite effects, shaders
- `src/rendering/` — PixiJS wrappers: sprites, animations, render layers
- `src/ui/` — HUD, inventory, map, menus
- `src/audio/` — Music, ambient, SFX managers
- `src/config/` — Constants, controls, settings
- `src/utils/` — Math, spatial, debug
- `src/data/` — JSON data files (NPCs, quests, maps, lore)
- `tests/` — Mirrors src/ structure

### Key patterns
- Composition over inheritance
- EventBus for cross-system communication (typed)
- All game data is JSON with TypeScript type validation
- Fixed timestep physics (60Hz), variable render
- Camera: smooth follow with bounds clamping

### Naming conventions
- Files: PascalCase.ts (classes), camelCase.ts (utils)
- Classes: PascalCase
- Methods/vars: camelCase
- Constants: UPPER_SNAKE_CASE
- JSON data: kebab-case.json

## Game-specific notes

### Lighting system
- Screen is dark by default (multiply blend mask)
- Light sources punch "holes" in darkness
- Player has a lantern (warm light)
- Lumbrite veins emit cold blue light
- Deeper levels = darker ambient

### Collision
- AABB only, no pixel-perfect
- Separate X/Y resolution for clean corners
- Coyote time + jump buffer for responsive platforming

### TileMap
- Layers: collision, background, foreground, lumbrite
- 16x16 pixel tiles
- Will switch to Tiled JSON format later

## PixiJS v8 API notes
- `Application.init()` is async
- Graphics uses chained `.rect().fill()` pattern (not `.beginFill()`)
- RenderTexture: `app.renderer.render({ container, target, clear })`
- No `PIXI` global — import everything directly
- Blend modes are strings: 'multiply', 'add', 'screen'
