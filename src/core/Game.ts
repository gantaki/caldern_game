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
import { TileRenderer } from '@/rendering/TileRenderer';
import { ParticleSystem } from '@/effects/ParticleSystem';

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

  // Enhanced rendering
  private tileRenderer: TileRenderer;
  private particles: ParticleSystem;
  private particleGraphics: Graphics;

  // Debug & audio
  private debug: DebugPanel;
  private ambientMusic: AmbientMusic;
  private musicStarted = false;

  // Timing & effects
  private accumulator = 0;
  private lastTime = 0;
  private gameTime = 0;
  private lanternFlicker = 0;
  private dustTimer = 0;
  private dripTimer = 0;

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

    this.particleGraphics = new Graphics();
    this.worldContainer.addChild(this.particleGraphics);

    // Enhanced rendering
    this.tileRenderer = new TileRenderer(this.tileMap);
    this.particles = new ParticleSystem();

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

    // Update effects
    this.gameTime += dt;
    this.particles.update(dt);
    this.updateLanternFlicker(dt);
    this.spawnEnvironmentalParticles(dt);
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

    this.tileRenderer.render(this.tileGraphics, camX, camY);
    this.renderObjects();
    this.renderEntities();
    this.renderParticles();
    this.renderLighting(camX, camY);
  }

  private renderObjects(): void {
    this.objectGraphics.clear();
    for (const obj of this.objects) {
      obj.render(this.objectGraphics);
    }
  }

  private renderEntities(): void {
    this.entityGraphics.clear();
    const gfx = this.entityGraphics;

    // NPCs
    for (const npc of this.npcs) {
      npc.render(gfx);
      if (npc.inRange(this.player.body) && !this.dialogue.isActive) {
        npc.renderHint(gfx);
      }
    }

    // Player — detailed pixel sprite
    const p = this.player.body;
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    const cx = px + Math.floor(p.width / 2);
    const facingR = this.player.facingRight;

    // Shadow beneath player
    gfx.rect(px + 1, py + p.height, p.width - 2, 1).fill(0x080810);

    // Boots
    gfx.rect(px + 1, py + 11, 3, 3).fill(0x443322);    // left boot
    gfx.rect(px + 6, py + 11, 3, 3).fill(0x443322);    // right boot
    gfx.rect(px + 1, py + 13, 4, 1).fill(0x332211);    // left sole
    gfx.rect(px + 6, py + 13, 4, 1).fill(0x332211);    // right sole

    // Legs (trousers)
    gfx.rect(px + 2, py + 8, 3, 3).fill(0x554433);     // left leg
    gfx.rect(px + 5, py + 8, 3, 3).fill(0x554433);     // right leg

    // Body — layered tunic + vest
    gfx.rect(px + 1, py + 3, p.width - 2, 6).fill(0xbbaa88);  // tunic
    gfx.rect(px + 2, py + 3, 2, 5).fill(0x998866);     // vest left
    gfx.rect(px + p.width - 4, py + 3, 2, 5).fill(0x998866);  // vest right
    // Belt
    gfx.rect(px + 1, py + 7, p.width - 2, 1).fill(0x554433);
    gfx.rect(px + 4, py + 7, 2, 1).fill(0x887744);     // buckle

    // Collar detail
    gfx.rect(px + 3, py + 3, 4, 1).fill(0xccbb99);

    // Arm holding lantern
    const armX = facingR ? px + p.width - 1 : px - 1;
    gfx.rect(armX, py + 4, 2, 4).fill(0xbbaa88);

    // Other arm
    const arm2X = facingR ? px - 1 : px + p.width - 1;
    gfx.rect(arm2X, py + 4, 2, 4).fill(0xbbaa88);

    // Head
    const headY = py + 1;
    gfx.circle(cx, headY + 1, 3).fill(0xddccaa);

    // Eyes
    const eyeOff = facingR ? 1 : -1;
    gfx.rect(cx + eyeOff - 1, headY, 1, 1).fill(0x222222);
    gfx.rect(cx + eyeOff + 1, headY, 1, 1).fill(0x222222);

    // Mining helmet
    gfx.rect(cx - 4, py - 2, 8, 2).fill(0x887744);     // brim
    gfx.rect(cx - 3, py - 4, 6, 3).fill(0x998855);     // dome
    // Headlamp
    gfx.rect(cx - 1, py - 3, 2, 2).fill(0xffdd88);
    // Helmet highlight
    gfx.rect(cx - 2, py - 4, 4, 1).fill(0xaa9966);

    // Lantern — swinging slightly
    const lanternSwing = Math.sin(this.gameTime * 3) * 0.5;
    const lanternX = facingR ? px + p.width + 1 : px - 4;
    const lanternY = Math.floor(py + 5 + lanternSwing);

    // Lantern body (cage)
    gfx.rect(lanternX, lanternY, 3, 4).fill(0x665533);
    // Lantern handle
    gfx.rect(lanternX, lanternY - 1, 3, 1).fill(0x777766);
    // Lantern flame — flickers
    const flameIntensity = 0.7 + this.lanternFlicker * 0.3;
    const flameR = Math.floor(0xff * flameIntensity);
    const flameG = Math.floor(0xcc * flameIntensity);
    const flameB = Math.floor(0x44 * flameIntensity);
    const flameColor = (flameR << 16) | (flameG << 8) | flameB;
    gfx.rect(lanternX + 1, lanternY + 1, 1, 2).fill(flameColor);
    // Lantern glow (small bright dot)
    gfx.rect(lanternX + 1, lanternY + 1, 1, 1).fill(0xffeeaa);
  }

  private renderParticles(): void {
    this.particleGraphics.clear();
    this.particles.render(this.particleGraphics);
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

    // Player lantern — with flicker
    const plx = this.player.body.centerX - camX;
    const ply = this.player.body.centerY - camY;
    const flickerRadius = PLAYER_LIGHT_RADIUS * (0.95 + this.lanternFlicker * 0.05);
    const flickerIntensity = PLAYER_LIGHT_INTENSITY * (0.85 + this.lanternFlicker * 0.15);
    // Warm lantern color shifts slightly with flicker
    const warmShift = Math.floor(this.lanternFlicker * 15);
    const lanternColor = (0xff << 16) | ((0xee - warmShift) << 8) | (0xdd - warmShift * 2);
    this.drawLight(plx, ply, flickerRadius, lanternColor, flickerIntensity);

    // Secondary smaller warm glow around lantern position
    const facingR = this.player.facingRight;
    const lanternOffX = facingR ? 6 : -6;
    this.drawLight(plx + lanternOffX, ply - 2, flickerRadius * 0.4, 0xffcc88, flickerIntensity * 0.5);

    // NPC glow — warmer, with subtle pulse
    for (const npc of this.npcs) {
      const nx = npc.x + npc.width / 2 - camX;
      const ny = npc.y + npc.height / 2 - camY;
      const npcPulse = 0.3 + Math.sin(this.gameTime * 1.5) * 0.05;
      this.drawLight(nx, ny, 32, 0xddaa77, npcPulse);
    }

    // Lumbrite lights — with slow pulse
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
          // Each lumbrite tile pulses at a slightly different phase
          const phase = (tx * 17 + ty * 31) * 0.1;
          const pulse = 0.85 + Math.sin(this.gameTime * 0.8 + phase) * 0.15;
          const radius = LUMBRITE_LIGHT_RADIUS * (lumVal / 255) * pulse;
          const intensity = 0.4 * (lumVal / 255) * pulse;
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

  /** Update lantern flicker — randomized warmth oscillation */
  private updateLanternFlicker(_dt: number): void {
    // Combine two sine waves for organic flicker
    const fast = Math.sin(this.gameTime * 12.7);
    const slow = Math.sin(this.gameTime * 3.1);
    const noise = Math.sin(this.gameTime * 47.3) * 0.15; // high-freq jitter
    this.lanternFlicker = 0.5 + (fast * 0.3 + slow * 0.2 + noise);
    this.lanternFlicker = Math.max(0, Math.min(1, this.lanternFlicker));
  }

  /** Spawn floating dust motes, lumbrite sparkles, and water drips */
  private spawnEnvironmentalParticles(dt: number): void {
    const camX = this.camera.viewX;
    const camY = this.camera.viewY;

    // Cap particles
    if (this.particles.count > 200) return;

    // Dust motes — slow floating particles in air
    this.dustTimer += dt;
    if (this.dustTimer > 0.15) {
      this.dustTimer = 0;
      const dx = camX + Math.random() * GAME_WIDTH;
      const dy = camY + Math.random() * GAME_HEIGHT;
      // Only spawn in air (not inside solid tiles)
      const ttx = Math.floor(dx / TILE_SIZE);
      const tty = Math.floor(dy / TILE_SIZE);
      if (!this.tileMap.isSolid(ttx, tty)) {
        this.particles.emit({
          x: dx,
          y: dy,
          vx: (Math.random() - 0.5) * 3,
          vy: -2 - Math.random() * 4,
          life: 3 + Math.random() * 4,
          size: Math.random() < 0.5 ? 0.5 : 1,
          color: 0x555566,
          alpha: 0.3 + Math.random() * 0.2,
          fadeOut: true,
        });
      }
    }

    // Lumbrite sparkles — bright flashes near lumbrite tiles
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE));
    const endTx = Math.min(this.tileMap.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE));
    const startTy = Math.max(0, Math.floor(camY / TILE_SIZE));
    const endTy = Math.min(this.tileMap.height - 1, Math.ceil((camY + GAME_HEIGHT) / TILE_SIZE));

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const lumVal = this.tileMap.getLumbrite(tx, ty);
        if (lumVal > 50 && Math.random() < 0.002 * (lumVal / 255)) {
          // Check for adjacent air tile to spawn sparkle
          if (!this.tileMap.isSolid(tx, ty - 1) || !this.tileMap.isSolid(tx - 1, ty) ||
              !this.tileMap.isSolid(tx + 1, ty) || !this.tileMap.isSolid(tx, ty + 1)) {
            const spx = tx * TILE_SIZE + Math.random() * TILE_SIZE;
            const spy = ty * TILE_SIZE + Math.random() * TILE_SIZE;
            this.particles.emit({
              x: spx,
              y: spy,
              vx: (Math.random() - 0.5) * 6,
              vy: -8 - Math.random() * 10,
              life: 0.5 + Math.random() * 1,
              size: 1,
              color: 0x88bbee,
              alpha: 0.7 + Math.random() * 0.3,
              fadeOut: true,
              shrink: true,
            });
          }
        }
      }
    }

    // Water drips — occasional drops from ceiling
    this.dripTimer += dt;
    if (this.dripTimer > 0.5) {
      this.dripTimer = 0;
      if (Math.random() < 0.3) {
        // Pick a random x within view
        const dripTx = startTx + Math.floor(Math.random() * (endTx - startTx));
        // Find ceiling — first solid-to-air transition from top
        for (let scanTy = startTy; scanTy < endTy; scanTy++) {
          if (this.tileMap.isSolid(dripTx, scanTy) && !this.tileMap.isSolid(dripTx, scanTy + 1)) {
            this.particles.emit({
              x: dripTx * TILE_SIZE + TILE_SIZE / 2,
              y: (scanTy + 1) * TILE_SIZE,
              vx: 0,
              vy: 2,
              life: 2 + Math.random() * 2,
              size: 0.5,
              color: 0x5566aa,
              alpha: 0.5,
              gravity: 60,
              fadeOut: true,
            });
            break;
          }
        }
      }
    }

    // Player footstep dust when running on ground
    if (this.player.body.onGround && Math.abs(this.player.body.vx) > 30) {
      if (Math.random() < 0.3) {
        this.particles.emit({
          x: this.player.body.x + this.player.body.width / 2,
          y: this.player.body.y + this.player.body.height,
          vx: -this.player.body.vx * 0.1 + (Math.random() - 0.5) * 5,
          vy: -5 - Math.random() * 5,
          life: 0.3 + Math.random() * 0.4,
          size: 1,
          color: 0x444433,
          alpha: 0.4,
          fadeOut: true,
          shrink: true,
        });
      }
    }
  }
}
