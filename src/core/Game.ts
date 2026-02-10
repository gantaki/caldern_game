import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
} from 'pixi.js';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FIXED_DT,
  MAX_FRAME_TIME,
  TILE_SIZE,
  AMBIENT_DARKNESS,
  PLAYER_LIGHT_RADIUS,
  PLAYER_LIGHT_INTENSITY,
  LUMBRITE_LIGHT_RADIUS,
  LUMBRITE_LIGHT_COLOR,
  COLOR_BG,
} from '@/config/constants';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { Player } from '@/entities/Player';
import { TileMap } from '@/world/TileMap';
import { resolveBodyTilemap } from '@/physics/CollisionSystem';
import { generateTestLevel, TEST_SPAWN } from '@/world/testLevel';

export class Game {
  private app: Application;
  private input: InputManager;
  private camera: Camera;
  private player: Player;
  private tileMap: TileMap;

  // Render layers
  private worldContainer: Container;
  private tileGraphics: Graphics;
  private entityGraphics: Graphics;
  private lightingSprite: Sprite;
  private lightingTexture: RenderTexture;
  private lightingGraphics: Graphics;

  // Timing
  private accumulator = 0;
  private lastTime = 0;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager();
    this.camera = new Camera();

    // Load test level
    const levelData = generateTestLevel();
    this.tileMap = new TileMap(levelData);

    // Create player
    this.player = new Player(TEST_SPAWN.x, TEST_SPAWN.y);

    // Set camera bounds to map size
    this.camera.setBounds(0, 0, this.tileMap.pixelWidth, this.tileMap.pixelHeight);
    this.camera.snapTo({ x: this.player.body.centerX, y: this.player.body.centerY });

    // Setup render layers
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.tileGraphics = new Graphics();
    this.worldContainer.addChild(this.tileGraphics);

    this.entityGraphics = new Graphics();
    this.worldContainer.addChild(this.entityGraphics);

    // Lighting layer (drawn separately, blended on top)
    this.lightingGraphics = new Graphics();
    this.lightingTexture = RenderTexture.create({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    });
    this.lightingSprite = new Sprite(this.lightingTexture);
    this.lightingSprite.blendMode = 'multiply';
    this.app.stage.addChild(this.lightingSprite);
  }

  start(): void {
    this.lastTime = performance.now() / 1000;
    this.app.ticker.add(() => this.loop());
  }

  private loop(): void {
    const now = performance.now() / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    // Prevent spiral of death
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    this.accumulator += frameTime;

    // Fixed timestep physics
    while (this.accumulator >= FIXED_DT) {
      this.fixedUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    // Render with interpolation factor
    this.render();

    // End of frame
    this.input.endFrame();
  }

  private fixedUpdate(dt: number): void {
    // Player input + physics
    this.player.update(this.input, dt);
    resolveBodyTilemap(this.player.body, this.tileMap, dt);

    // Camera follows player
    this.camera.follow(
      { x: this.player.body.centerX, y: this.player.body.centerY },
      dt
    );
  }

  private render(): void {
    const camX = Math.round(this.camera.viewX);
    const camY = Math.round(this.camera.viewY);

    // Offset world by camera
    this.worldContainer.x = -camX;
    this.worldContainer.y = -camY;

    this.renderTiles(camX, camY);
    this.renderEntities();
    this.renderLighting(camX, camY);
  }

  private renderTiles(camX: number, camY: number): void {
    this.tileGraphics.clear();

    // Only render visible tiles
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE));
    const endTx = Math.min(this.tileMap.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE));
    const startTy = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endTy = Math.min(this.tileMap.height - 1, Math.ceil((camY + GAME_HEIGHT) / TILE_SIZE));

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const idx = ty * this.tileMap.width + tx;
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        if (this.tileMap.collision[idx]) {
          // Solid tile - dark stone
          const lumbriteVal = this.tileMap.lumbrite[idx] ?? 0;
          if (lumbriteVal > 0) {
            // Lumbrite-infused stone - bluish glow
            const t = lumbriteVal / 255;
            const r = Math.floor(0x1a + (0x44 - 0x1a) * t);
            const g = Math.floor(0x1a + (0x77 - 0x1a) * t);
            const b = Math.floor(0x22 + (0xaa - 0x22) * t);
            const color = (r << 16) | (g << 8) | b;
            this.tileGraphics.rect(px, py, TILE_SIZE, TILE_SIZE).fill(color);
          } else {
            // Regular stone - varying dark grays
            const shade = 0x1a1a22 + ((tx * 7 + ty * 13) % 4) * 0x020203;
            this.tileGraphics.rect(px, py, TILE_SIZE, TILE_SIZE).fill(shade);
          }
        } else {
          // Empty tile - dark background
          this.tileGraphics.rect(px, py, TILE_SIZE, TILE_SIZE).fill(COLOR_BG);
        }
      }
    }
  }

  private renderEntities(): void {
    this.entityGraphics.clear();

    const p = this.player.body;

    // Player body
    this.entityGraphics.rect(p.x, p.y, p.width, p.height).fill(0xccccaa);

    // Simple head
    const headX = p.x + p.width / 2;
    const headY = p.y + 2;
    this.entityGraphics.circle(headX, headY, 3).fill(0xddddbb);

    // Lantern glow indicator (small dot)
    const lanternOffX = this.player.facingRight ? p.width + 1 : -3;
    this.entityGraphics
      .circle(p.x + lanternOffX, p.y + p.height * 0.4, 2)
      .fill(0xffcc66);
  }

  private renderLighting(camX: number, camY: number): void {
    this.lightingGraphics.clear();

    // Fill with darkness
    const darkR = Math.floor(AMBIENT_DARKNESS * 20);
    const darkG = Math.floor(AMBIENT_DARKNESS * 18);
    const darkB = Math.floor(AMBIENT_DARKNESS * 25);
    const darkColor = (darkR << 16) | (darkG << 8) | darkB;
    this.lightingGraphics
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill(darkColor);

    // Player lantern light
    const plx = this.player.body.centerX - camX;
    const ply = this.player.body.centerY - camY;
    this.drawLight(plx, ply, PLAYER_LIGHT_RADIUS, 0xffeedd, PLAYER_LIGHT_INTENSITY);

    // Lumbrite lights from visible tiles
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 2);
    const endTx = Math.min(this.tileMap.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE) + 2);
    const startTy = Math.max(0, Math.floor(camY / TILE_SIZE) - 2);
    const endTy = Math.min(this.tileMap.height - 1, Math.ceil((camY + GAME_HEIGHT) / TILE_SIZE) + 2);

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const lumVal = this.tileMap.getLumbrite(tx, ty);
        if (lumVal > 30) {
          const lx = tx * TILE_SIZE + TILE_SIZE / 2 - camX;
          const ly = ty * TILE_SIZE + TILE_SIZE / 2 - camY;
          const radius = LUMBRITE_LIGHT_RADIUS * (lumVal / 255);
          const intensity = 0.4 * (lumVal / 255);
          this.drawLight(lx, ly, radius, LUMBRITE_LIGHT_COLOR, intensity);
        }
      }
    }

    // Render lighting to texture
    this.app.renderer.render({
      container: this.lightingGraphics,
      target: this.lightingTexture,
      clear: true,
    });
  }

  /** Draw a radial light onto the lighting graphics (additive on dark background) */
  private drawLight(x: number, y: number, radius: number, color: number, intensity: number): void {
    const steps = 6;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = radius * t;
      const alpha = intensity * (1 - t * t); // Quadratic falloff

      // Blend towards white (since we multiply)
      const cr = ((color >> 16) & 0xff) / 255;
      const cg = ((color >> 8) & 0xff) / 255;
      const cb = (color & 0xff) / 255;

      const lr = Math.min(255, Math.floor((0.08 + cr * alpha) * 255));
      const lg = Math.min(255, Math.floor((0.07 + cg * alpha) * 255));
      const lb = Math.min(255, Math.floor((0.1 + cb * alpha) * 255));

      const lightColor = (lr << 16) | (lg << 8) | lb;
      this.lightingGraphics.circle(x, y, Math.max(r, 1)).fill(lightColor);
    }
  }
}
