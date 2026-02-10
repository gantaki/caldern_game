import { type Graphics } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_BG } from '@/config/constants';

/**
 * A single element in a background layer (building, door, road, ruin, etc.)
 */
export interface BgElement {
  type: 'building' | 'door' | 'window' | 'arch' | 'pipe' | 'sign' | 'road' | 'pillar';
  x: number;  // world-space x
  y: number;  // world-space y
  w: number;
  h: number;
  color: number;
  detail?: number;  // seed for variation
}

/**
 * A parallax background layer with a scroll factor and set of elements.
 */
export interface BgLayer {
  scrollX: number;  // 0 = static, 1 = moves with camera
  scrollY: number;
  elements: BgElement[];
  tint: number;     // color tint for depth fog
}

/** Deterministic hash for variation */
function bgHash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

/** Darken a color by mixing toward black */
function fogColor(color: number, fog: number, fogTint: number): number {
  const r1 = (color >> 16) & 0xff;
  const g1 = (color >> 8) & 0xff;
  const b1 = color & 0xff;
  const r2 = (fogTint >> 16) & 0xff;
  const g2 = (fogTint >> 8) & 0xff;
  const b2 = fogTint & 0xff;
  const r = Math.floor(r1 * (1 - fog) + r2 * fog);
  const g = Math.floor(g1 * (1 - fog) + g2 * fog);
  const b = Math.floor(b1 * (1 - fog) + b2 * fog);
  return (r << 16) | (g << 8) | b;
}

/**
 * Renders parallax background layers for an abandoned underground city.
 * SOLID: Single responsibility — only draws backgrounds.
 * DRY: Each element type has a reusable draw method.
 */
export class BackgroundRenderer {
  private layers: BgLayer[];

  constructor(worldWidth: number, worldHeight: number) {
    this.layers = this.generateLayers(worldWidth, worldHeight);
  }

  render(gfx: Graphics, camX: number, camY: number): void {
    // Fill with deep background
    gfx.rect(camX, camY, GAME_WIDTH, GAME_HEIGHT).fill(COLOR_BG);

    for (const layer of this.layers) {
      const offsetX = camX * layer.scrollX;
      const offsetY = camY * layer.scrollY;

      // Culling: only draw elements visible on screen
      const viewLeft = offsetX - 40;
      const viewRight = offsetX + GAME_WIDTH + 40;
      const viewTop = offsetY - 40;
      const viewBottom = offsetY + GAME_HEIGHT + 40;

      for (const el of layer.elements) {
        if (el.x + el.w < viewLeft || el.x > viewRight) continue;
        if (el.y + el.h < viewTop || el.y > viewBottom) continue;

        // World pos → camera-adjusted screen pos
        const sx = el.x - offsetX + camX;
        const sy = el.y - offsetY + camY;

        this.drawElement(gfx, el, sx, sy, layer.tint);
      }
    }
  }

  private drawElement(gfx: Graphics, el: BgElement, sx: number, sy: number, fogTint: number): void {
    switch (el.type) {
      case 'building': this.drawBuilding(gfx, sx, sy, el, fogTint); break;
      case 'door':     this.drawDoor(gfx, sx, sy, el, fogTint); break;
      case 'window':   this.drawWindow(gfx, sx, sy, el, fogTint); break;
      case 'arch':     this.drawArch(gfx, sx, sy, el, fogTint); break;
      case 'pipe':     this.drawPipe(gfx, sx, sy, el, fogTint); break;
      case 'sign':     this.drawSign(gfx, sx, sy, el, fogTint); break;
      case 'road':     this.drawRoad(gfx, sx, sy, el, fogTint); break;
      case 'pillar':   this.drawPillar(gfx, sx, sy, el, fogTint); break;
    }
  }

  private drawBuilding(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(el.color, 0.6, fog);
    const cDark = fogColor(el.color, 0.75, fog);
    const cLight = fogColor(el.color, 0.5, fog);
    const seed = el.detail ?? 0;

    // Main facade
    gfx.rect(x, y, el.w, el.h).fill(c);
    // Roof line
    gfx.rect(x, y, el.w, 2).fill(cLight);
    // Foundation
    gfx.rect(x, y + el.h - 2, el.w, 2).fill(cDark);
    // Side shadow
    gfx.rect(x + el.w - 1, y + 2, 1, el.h - 4).fill(cDark);

    // Brickwork lines (subtle horizontal mortar)
    const brickSpace = 6 + (seed % 3);
    for (let by = y + 4; by < y + el.h - 3; by += brickSpace) {
      gfx.rect(x + 1, by, el.w - 2, 1).fill(cDark);
    }

    // Crumble detail at top (damage)
    if (seed % 3 === 0) {
      const crumbleW = 3 + seed % 4;
      gfx.rect(x + el.w - crumbleW, y, crumbleW, 3).fill(fog);
    }
  }

  private drawDoor(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x0a0a12, 0.4, fog);
    const frame = fogColor(0x333328, 0.5, fog);

    // Door frame
    gfx.rect(x - 1, y - 1, el.w + 2, el.h + 1).fill(frame);
    // Door opening (very dark)
    gfx.rect(x, y, el.w, el.h).fill(c);
    // Doorstep
    gfx.rect(x - 1, y + el.h, el.w + 2, 1).fill(frame);
    // Handle
    gfx.rect(x + el.w - 2, y + Math.floor(el.h / 2), 1, 1).fill(fogColor(0x887744, 0.5, fog));
  }

  private drawWindow(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const frame = fogColor(0x2a2a22, 0.5, fog);
    const glass = fogColor(0x0c0c18, 0.4, fog);
    const seed = el.detail ?? 0;

    // Frame
    gfx.rect(x - 1, y - 1, el.w + 2, el.h + 2).fill(frame);
    // Glass panes
    gfx.rect(x, y, el.w, el.h).fill(glass);
    // Cross divider
    gfx.rect(x, y + Math.floor(el.h / 2), el.w, 1).fill(frame);
    gfx.rect(x + Math.floor(el.w / 2), y, 1, el.h).fill(frame);

    // Some windows are broken — missing pane
    if (seed % 4 === 0) {
      gfx.rect(x + 1, y + 1, Math.floor(el.w / 2) - 1, Math.floor(el.h / 2) - 1).fill(fogColor(0x060610, 0.5, fog));
    }
  }

  private drawArch(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x222218, 0.5, fog);
    const cDark = fogColor(0x0a0a10, 0.4, fog);

    // Arch pillars
    gfx.rect(x, y, 3, el.h).fill(c);
    gfx.rect(x + el.w - 3, y, 3, el.h).fill(c);
    // Arch top beam
    gfx.rect(x, y, el.w, 3).fill(c);
    // Inside (dark void)
    gfx.rect(x + 3, y + 3, el.w - 6, el.h - 3).fill(cDark);
    // Keystone
    gfx.rect(x + Math.floor(el.w / 2) - 1, y, 2, 4).fill(fogColor(0x333328, 0.5, fog));
  }

  private drawPipe(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x333330, 0.5, fog);
    const highlight = fogColor(0x444440, 0.5, fog);

    if (el.w > el.h) {
      // Horizontal pipe
      gfx.rect(x, y, el.w, el.h).fill(c);
      gfx.rect(x, y, el.w, 1).fill(highlight);
      // Joints
      for (let jx = x + 12; jx < x + el.w; jx += 16) {
        gfx.rect(jx, y - 1, 2, el.h + 2).fill(highlight);
      }
    } else {
      // Vertical pipe
      gfx.rect(x, y, el.w, el.h).fill(c);
      gfx.rect(x, y, 1, el.h).fill(highlight);
      for (let jy = y + 12; jy < y + el.h; jy += 16) {
        gfx.rect(x - 1, jy, el.w + 2, 2).fill(highlight);
      }
    }
  }

  private drawSign(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const board = fogColor(0x2a2218, 0.5, fog);
    const post = fogColor(0x1a1a18, 0.5, fog);

    // Post
    gfx.rect(x + Math.floor(el.w / 2), y + el.h, 1, 6).fill(post);
    // Board
    gfx.rect(x, y, el.w, el.h).fill(board);
    gfx.rect(x + 1, y + 1, el.w - 2, 1).fill(fogColor(0x3a3228, 0.4, fog));
    // Faded text lines
    gfx.rect(x + 2, y + 3, el.w - 4, 1).fill(fogColor(0x444438, 0.5, fog));
    if (el.h > 6) {
      gfx.rect(x + 2, y + 5, Math.floor(el.w * 0.6), 1).fill(fogColor(0x3a3a30, 0.5, fog));
    }
  }

  private drawRoad(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x121218, 0.5, fog);
    const line = fogColor(0x1a1a20, 0.4, fog);

    gfx.rect(x, y, el.w, el.h).fill(c);
    // Cobblestone pattern
    const seed = el.detail ?? 0;
    for (let cx = 0; cx < el.w; cx += 5) {
      const rowOff = ((cx / 5) % 2) * 2;
      for (let cy = 0; cy < el.h; cy += 4) {
        const h = bgHash(cx + seed, cy);
        if (h % 3 === 0) {
          gfx.rect(x + cx, y + cy + rowOff, 4, 3).fill(line);
        }
      }
    }
  }

  private drawPillar(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x222220, 0.5, fog);
    const cLight = fogColor(0x2a2a28, 0.45, fog);

    gfx.rect(x, y, el.w, el.h).fill(c);
    // Highlight edge
    gfx.rect(x, y, 1, el.h).fill(cLight);
    // Capital (top decoration)
    gfx.rect(x - 1, y, el.w + 2, 2).fill(cLight);
    // Base
    gfx.rect(x - 1, y + el.h - 2, el.w + 2, 2).fill(cLight);
  }

  /**
   * Procedurally generate background layers for the abandoned underground city.
   * Layer 0: deepest — distant rock/walls (scrollX=0.1)
   * Layer 1: middle — building facades, arches (scrollX=0.3)
   * Layer 2: near — doors, pipes, signs (scrollX=0.5)
   */
  private generateLayers(worldW: number, worldH: number): BgLayer[] {
    const layers: BgLayer[] = [];

    // --- Layer 0: Distant cavern walls & far buildings ---
    const layer0: BgLayer = {
      scrollX: 0.1, scrollY: 0.1,
      tint: COLOR_BG,
      elements: [],
    };

    // Distant large building silhouettes
    for (let bx = -100; bx < worldW + 100; bx += 60 + bgHash(bx, 0) % 40) {
      const h = 40 + bgHash(bx, 1) % 50;
      const w = 30 + bgHash(bx, 2) % 20;
      const by = worldH * 0.5 - h + bgHash(bx, 3) % 20;
      layer0.elements.push({
        type: 'building', x: bx, y: by, w, h,
        color: 0x0e0e14, detail: bx,
      });
    }

    // Distant road at bottom
    layer0.elements.push({
      type: 'road', x: -100, y: worldH * 0.75, w: worldW + 200, h: 12,
      color: 0x0c0c12, detail: 42,
    });

    layers.push(layer0);

    // --- Layer 1: Mid-ground buildings & arches ---
    const layer1: BgLayer = {
      scrollX: 0.3, scrollY: 0.25,
      tint: COLOR_BG,
      elements: [],
    };

    for (let bx = -50; bx < worldW + 50; bx += 40 + bgHash(bx, 10) % 30) {
      const h = 30 + bgHash(bx, 11) % 40;
      const w = 20 + bgHash(bx, 12) % 15;
      const by = worldH * 0.4 - h / 2 + bgHash(bx, 13) % 30;
      layer1.elements.push({
        type: 'building', x: bx, y: by, w, h,
        color: 0x121218, detail: bx + 100,
      });

      // Windows on buildings
      const windowCount = 1 + bgHash(bx, 14) % 3;
      for (let wi = 0; wi < windowCount; wi++) {
        const wx = bx + 3 + (wi * Math.floor((w - 6) / Math.max(1, windowCount)));
        const wy = by + 6 + bgHash(bx, 15 + wi) % (h / 2);
        layer1.elements.push({
          type: 'window', x: wx, y: wy, w: 4, h: 5,
          color: 0x0c0c18, detail: bx + wi,
        });
      }
    }

    // Arches/tunnels
    for (let ax = 80; ax < worldW; ax += 120 + bgHash(ax, 20) % 60) {
      const aw = 18 + bgHash(ax, 21) % 10;
      const ah = 20 + bgHash(ax, 22) % 12;
      const ay = worldH * 0.55 + bgHash(ax, 23) % 20;
      layer1.elements.push({
        type: 'arch', x: ax, y: ay, w: aw, h: ah,
        color: 0x181820,
      });
    }

    layers.push(layer1);

    // --- Layer 2: Near elements — doors, pipes, signs, pillars ---
    const layer2: BgLayer = {
      scrollX: 0.5, scrollY: 0.4,
      tint: COLOR_BG,
      elements: [],
    };

    // Doors into buildings
    for (let dx = 30; dx < worldW; dx += 50 + bgHash(dx, 30) % 40) {
      const dh = 10 + bgHash(dx, 31) % 6;
      const dw = 5 + bgHash(dx, 32) % 3;
      const dy = worldH * 0.5 + bgHash(dx, 33) % 20;
      layer2.elements.push({
        type: 'door', x: dx, y: dy, w: dw, h: dh,
        color: 0x0a0a12,
      });
    }

    // Pipes running along walls
    for (let px = 0; px < worldW; px += 80 + bgHash(px, 40) % 50) {
      const isHoriz = bgHash(px, 41) % 2 === 0;
      if (isHoriz) {
        const plen = 30 + bgHash(px, 42) % 40;
        const py = worldH * 0.3 + bgHash(px, 43) % (worldH * 0.3);
        layer2.elements.push({
          type: 'pipe', x: px, y: py, w: plen, h: 3,
          color: 0x2a2a28,
        });
      } else {
        const plen = 20 + bgHash(px, 42) % 30;
        const py = worldH * 0.25 + bgHash(px, 43) % (worldH * 0.2);
        layer2.elements.push({
          type: 'pipe', x: px, y: py, w: 3, h: plen,
          color: 0x2a2a28,
        });
      }
    }

    // Signs
    for (let sx = 60; sx < worldW; sx += 100 + bgHash(sx, 50) % 60) {
      const sw = 10 + bgHash(sx, 51) % 6;
      const sh = 5 + bgHash(sx, 52) % 3;
      const sy = worldH * 0.35 + bgHash(sx, 53) % 30;
      layer2.elements.push({
        type: 'sign', x: sx, y: sy, w: sw, h: sh,
        color: 0x2a2218, detail: sx,
      });
    }

    // Decorative pillars
    for (let cx = 40; cx < worldW; cx += 70 + bgHash(cx, 60) % 40) {
      const ph = 25 + bgHash(cx, 61) % 20;
      const cy = worldH * 0.4 + bgHash(cx, 62) % 20;
      layer2.elements.push({
        type: 'pillar', x: cx, y: cy, w: 4, h: ph,
        color: 0x1a1a18,
      });
    }

    layers.push(layer2);

    return layers;
  }
}
