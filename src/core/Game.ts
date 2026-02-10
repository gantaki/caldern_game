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
  PLAYER_SPEED,
} from '@/config/constants';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { Player } from '@/entities/Player';
import { TileMap } from '@/world/TileMap';
import { resolveBodyTilemap } from '@/physics/CollisionSystem';
import { generateTestLevel } from '@/world/testLevel';
import { DebugPanel } from '@/utils/DebugPanel';
import { AmbientMusic } from '@/audio/AmbientMusic';
import { type InteractiveObject } from '@/entities/InteractiveObject';
import { SteamElevator } from '@/entities/SteamElevator';
import { Ladder } from '@/entities/Ladder';
import { Rope } from '@/entities/Rope';
import { NPC } from '@/entities/NPC';
import { DialogueManager } from '@/dialogue/DialogueManager';

export class Game {
  private app: Application;
  private input: InputManager;
  private camera: Camera;
  private player: Player;
  private tileMap: TileMap;

  // World objects
  private objects: InteractiveObject[] = [];
  private npcs: NPC[] = [];
  private dialogue: DialogueManager;

  // Render layers
  private worldContainer: Container;
  private tileGraphics: Graphics;
  private objectGraphics: Graphics;
  private entityGraphics: Graphics;
  private lightingSprite: Sprite;
  private lightingTexture: RenderTexture;
  private lightingGraphics: Graphics;

  // Debug & audio
  private debug: DebugPanel;
  private ambientMusic: AmbientMusic;
  private musicStarted = false;

  // Timing
  private accumulator = 0;
  private lastTime = 0;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager();
    this.camera = new Camera();
    this.dialogue = new DialogueManager();

    // Load test level
    const levelData = generateTestLevel();
    this.tileMap = new TileMap(levelData.tilemap);

    // Create player
    this.player = new Player(levelData.spawn.x, levelData.spawn.y);

    // Create interactive objects
    for (const def of levelData.objects) {
      switch (def.type) {
        case 'elevator':
          this.objects.push(
            new SteamElevator(def.x, def.y, def.width ?? 24, def.height ?? 6, def.travelDistance ?? 80),
          );
          break;
        case 'ladder':
          this.objects.push(new Ladder(def.x, def.y, def.height ?? 64));
          break;
        case 'rope':
          this.objects.push(new Rope(def.x, def.y, def.width ?? 80));
          break;
      }
    }

    // Create NPCs
    for (const npcData of levelData.npcs) {
      this.npcs.push(new NPC(npcData));
    }

    // Camera bounds
    this.camera.setBounds(0, 0, this.tileMap.pixelWidth, this.tileMap.pixelHeight);
    this.camera.snapTo({ x: this.player.body.centerX, y: this.player.body.centerY });

    // Render layers
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.tileGraphics = new Graphics();
    this.worldContainer.addChild(this.tileGraphics);

    this.objectGraphics = new Graphics();
    this.worldContainer.addChild(this.objectGraphics);

    this.entityGraphics = new Graphics();
    this.worldContainer.addChild(this.entityGraphics);

    // Lighting layer
    this.lightingGraphics = new Graphics();
    this.lightingTexture = RenderTexture.create({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    });
    this.lightingSprite = new Sprite(this.lightingTexture);
    this.lightingSprite.blendMode = 'multiply';
    this.app.stage.addChild(this.lightingSprite);

    // Debug & music
    this.debug = new DebugPanel();
    this.ambientMusic = new AmbientMusic();

    const startMusic = (): void => {
      if (!this.musicStarted) {
        this.ambientMusic.start();
        this.musicStarted = true;
      }
    };
    window.addEventListener('keydown', startMusic, { once: true });
    window.addEventListener('click', startMusic, { once: true });
  }

  start(): void {
    this.lastTime = performance.now() / 1000;
    this.app.ticker.add(() => this.loop());
  }

  private loop(): void {
    const now = performance.now() / 1000;
    let frameTime = now - this.lastTime;
    this.lastTime = now;

    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_DT) {
      this.fixedUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    this.render();
    this.input.endFrame();
  }

  private fixedUpdate(dt: number): void {
    // Dialogue blocks gameplay input
    if (this.dialogue.isActive) {
      if (this.input.isPressed('interact')) {
        this.dialogue.dismiss();
      }
      return;
    }

    if (this.debug.state.noGravity) {
      const axisX = this.input.getAxisX();
      const axisY = this.input.getAxisY();
      const flySpeed = PLAYER_SPEED * 2.5;
      this.player.body.vx = 0;
      this.player.body.vy = 0;
      this.player.body.x += axisX * flySpeed * dt;
      this.player.body.y += axisY * flySpeed * dt;
    } else {
      this.handleObjectInteractions();
      this.handleNPCInteractions();

      this.player.update(this.input, dt);

      if (this.player.state === 'normal') {
        resolveBodyTilemap(this.player.body, this.tileMap, dt);
      } else {
        // On ladder/rope: apply velocity directly, no gravity
        this.player.body.x += this.player.body.vx * dt;
        this.player.body.y += this.player.body.vy * dt;
      }
    }

    for (const obj of this.objects) {
      obj.update(dt);
    }
    for (const npc of this.npcs) {
      npc.update(dt);
    }

    this.camera.follow(
      { x: this.player.body.centerX, y: this.player.body.centerY },
      dt,
    );
  }

  private handleObjectInteractions(): void {
    const body = this.player.body;

    for (const obj of this.objects) {
      if (obj.type === 'ladder' && obj.overlaps(body)) {
        if (this.player.state === 'normal' && (this.input.isDown('up') || this.input.isDown('down'))) {
          this.player.startClimbing();
          this.player.body.x = obj.x + (obj.width - body.width) / 2;
        }
      }
      if (obj.type === 'ladder' && this.player.state === 'climbing' && !obj.overlaps(body)) {
        this.player.state = 'normal';
      }

      if (obj.type === 'rope' && obj.overlaps(body)) {
        if (this.player.state === 'normal' && this.input.isDown('up')) {
          this.player.startRope();
          this.player.body.y = obj.y;
        }
      }

      if (obj.type === 'elevator') {
        const elevator = obj as SteamElevator;
        if (obj.inRange(body) && this.input.isPressed('interact')) {
          elevator.activate();
        }
        if (elevator.active) {
          const onTop =
            body.bottom >= obj.y - 2 &&
            body.bottom <= obj.y + 4 &&
            body.right > obj.x &&
            body.left < obj.x + obj.width;
          if (onTop) {
            body.y = obj.y - body.height;
            body.onGround = true;
          }
        }
      }
    }
  }

  private handleNPCInteractions(): void {
    if (!this.input.isPressed('interact')) return;

    for (const npc of this.npcs) {
      if (npc.inRange(this.player.body)) {
        const { name, text } = npc.interact();
        this.dialogue.show(name, text);
        return;
      }
    }
  }

  private render(): void {
    const camX = Math.round(this.camera.viewX);
    const camY = Math.round(this.camera.viewY);

    this.worldContainer.x = -camX;
    this.worldContainer.y = -camY;

    this.renderTiles(camX, camY);
    this.renderObjects();
    this.renderEntities();
    this.renderLighting(camX, camY);
  }

  private renderTiles(camX: number, camY: number): void {
    this.tileGraphics.clear();

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
          const lumbriteVal = this.tileMap.lumbrite[idx] ?? 0;
          if (lumbriteVal > 0) {
            const t = lumbriteVal / 255;
            const r = Math.floor(0x1a + (0x44 - 0x1a) * t);
            const g = Math.floor(0x1a + (0x77 - 0x1a) * t);
            const b = Math.floor(0x22 + (0xaa - 0x22) * t);
            const color = (r << 16) | (g << 8) | b;
            this.tileGraphics.rect(px, py, TILE_SIZE, TILE_SIZE).fill(color);
          } else {
            const shade = 0x1a1a22 + ((tx * 7 + ty * 13) % 4) * 0x020203;
            this.tileGraphics.rect(px, py, TILE_SIZE, TILE_SIZE).fill(shade);
          }
        } else {
          this.tileGraphics.rect(px, py, TILE_SIZE, TILE_SIZE).fill(COLOR_BG);
        }
      }
    }
  }

  private renderObjects(): void {
    this.objectGraphics.clear();
    for (const obj of this.objects) {
      obj.render(this.objectGraphics);
    }
  }

  private renderEntities(): void {
    this.entityGraphics.clear();

    // NPCs
    for (const npc of this.npcs) {
      npc.render(this.entityGraphics);
      if (npc.inRange(this.player.body) && !this.dialogue.isActive) {
        npc.renderHint(this.entityGraphics);
      }
    }

    // Player
    const p = this.player.body;
    this.entityGraphics.rect(p.x, p.y, p.width, p.height).fill(0xccccaa);

    const headX = p.x + p.width / 2;
    const headY = p.y + 2;
    this.entityGraphics.circle(headX, headY, 3).fill(0xddddbb);

    const lanternOffX = this.player.facingRight ? p.width + 1 : -3;
    this.entityGraphics
      .circle(p.x + lanternOffX, p.y + p.height * 0.4, 2)
      .fill(0xffcc66);
  }

  private renderLighting(camX: number, camY: number): void {
    this.lightingGraphics.clear();

    if (this.debug.state.fullLighting) {
      this.lightingGraphics
        .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        .fill(0xffffff);
      this.app.renderer.render({
        container: this.lightingGraphics,
        target: this.lightingTexture,
        clear: true,
      });
      return;
    }

    const darkR = Math.floor(AMBIENT_DARKNESS * 20);
    const darkG = Math.floor(AMBIENT_DARKNESS * 18);
    const darkB = Math.floor(AMBIENT_DARKNESS * 25);
    const darkColor = (darkR << 16) | (darkG << 8) | darkB;
    this.lightingGraphics
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill(darkColor);

    // Player lantern
    const plx = this.player.body.centerX - camX;
    const ply = this.player.body.centerY - camY;
    this.drawLight(plx, ply, PLAYER_LIGHT_RADIUS, 0xffeedd, PLAYER_LIGHT_INTENSITY);

    // NPC glow
    for (const npc of this.npcs) {
      const nx = npc.x + npc.width / 2 - camX;
      const ny = npc.y + npc.height / 2 - camY;
      this.drawLight(nx, ny, 30, 0xddaa77, 0.35);
    }

    // Lumbrite lights
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 4);
    const endTx = Math.min(this.tileMap.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE) + 4);
    const startTy = Math.max(0, Math.floor(camY / TILE_SIZE) - 4);
    const endTy = Math.min(this.tileMap.height - 1, Math.ceil((camY + GAME_HEIGHT) / TILE_SIZE) + 4);

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

    this.app.renderer.render({
      container: this.lightingGraphics,
      target: this.lightingTexture,
      clear: true,
    });
  }

  private drawLight(x: number, y: number, radius: number, color: number, intensity: number): void {
    const steps = 6;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = radius * t;
      const alpha = intensity * (1 - t * t);

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
