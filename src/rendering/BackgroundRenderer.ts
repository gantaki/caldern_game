import { type Graphics } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COLOR_BG } from '@/config/constants';

export interface BgElement {
  type: 'building' | 'door' | 'window' | 'arch' | 'pipe' | 'pillar';
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
  detail?: number;
}

export interface BgLayer {
  scrollX: number;
  scrollY: number;
  elements: BgElement[];
  tint: number;
}

function bgHash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

function fogColor(color: number, fog: number, fogTint: number): number {
  const r1 = (color >> 16) & 0xff, g1 = (color >> 8) & 0xff, b1 = color & 0xff;
  const r2 = (fogTint >> 16) & 0xff, g2 = (fogTint >> 8) & 0xff, b2 = fogTint & 0xff;
  return (((r1 * (1 - fog) + r2 * fog) | 0) << 16)
       | (((g1 * (1 - fog) + g2 * fog) | 0) << 8)
       | ((b1 * (1 - fog) + b2 * fog) | 0);
}

/**
 * Optimized parallax background renderer. Pre-computes colors at generation
 * time and uses minimal draw calls per element.
 */
export class BackgroundRenderer {
  private layers: BgLayer[];

  constructor(worldWidth: number, worldHeight: number) {
    this.layers = this.generateLayers(worldWidth, worldHeight);
  }

  render(gfx: Graphics, camX: number, camY: number): void {
    gfx.clear(); // CRITICAL: clear previous frame's draws

    gfx.rect(camX, camY, GAME_WIDTH, GAME_HEIGHT).fill(COLOR_BG);

    for (const layer of this.layers) {
      const offsetX = camX * layer.scrollX;
      const offsetY = camY * layer.scrollY;
      const viewLeft = offsetX - 40;
      const viewRight = offsetX + GAME_WIDTH + 40;
      const viewTop = offsetY - 40;
      const viewBottom = offsetY + GAME_HEIGHT + 40;

      for (const el of layer.elements) {
        if (el.x + el.w < viewLeft || el.x > viewRight) continue;
        if (el.y + el.h < viewTop || el.y > viewBottom) continue;
        this.drawElement(gfx, el, el.x - offsetX + camX, el.y - offsetY + camY, layer.tint);
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
      case 'pillar':   this.drawPillar(gfx, sx, sy, el, fogTint); break;
    }
  }

  private drawBuilding(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(el.color, 0.6, fog);
    const cDark = fogColor(el.color, 0.75, fog);
    const cLight = fogColor(el.color, 0.5, fog);

    gfx.rect(x, y, el.w, el.h).fill(c);
    gfx.rect(x, y, el.w, 2).fill(cLight);
    gfx.rect(x, y + el.h - 2, el.w, 2).fill(cDark);
    gfx.rect(x + el.w - 1, y + 2, 1, el.h - 4).fill(cDark);
  }

  private drawDoor(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    gfx.rect(x - 1, y - 1, el.w + 2, el.h + 2).fill(fogColor(0x333328, 0.5, fog));
    gfx.rect(x, y, el.w, el.h).fill(fogColor(0x0a0a12, 0.4, fog));
  }

  private drawWindow(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const frame = fogColor(0x2a2a22, 0.5, fog);
    gfx.rect(x - 1, y - 1, el.w + 2, el.h + 2).fill(frame);
    gfx.rect(x, y, el.w, el.h).fill(fogColor(0x0c0c18, 0.4, fog));
    gfx.rect(x, y + (el.h >> 1), el.w, 1).fill(frame);
    gfx.rect(x + (el.w >> 1), y, 1, el.h).fill(frame);
  }

  private drawArch(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x222218, 0.5, fog);
    gfx.rect(x, y, 3, el.h).fill(c);
    gfx.rect(x + el.w - 3, y, 3, el.h).fill(c);
    gfx.rect(x, y, el.w, 3).fill(c);
    gfx.rect(x + 3, y + 3, el.w - 6, el.h - 3).fill(fogColor(0x0a0a10, 0.4, fog));
  }

  private drawPipe(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x333330, 0.5, fog);
    gfx.rect(x, y, el.w, el.h).fill(c);
    if (el.w > el.h) {
      gfx.rect(x, y, el.w, 1).fill(fogColor(0x444440, 0.5, fog));
    } else {
      gfx.rect(x, y, 1, el.h).fill(fogColor(0x444440, 0.5, fog));
    }
  }

  private drawPillar(gfx: Graphics, x: number, y: number, el: BgElement, fog: number): void {
    const c = fogColor(0x222220, 0.5, fog);
    const cLight = fogColor(0x2a2a28, 0.45, fog);
    gfx.rect(x, y, el.w, el.h).fill(c);
    gfx.rect(x, y, 1, el.h).fill(cLight);
    gfx.rect(x - 1, y, el.w + 2, 2).fill(cLight);
    gfx.rect(x - 1, y + el.h - 2, el.w + 2, 2).fill(cLight);
  }

  private generateLayers(worldW: number, worldH: number): BgLayer[] {
    const layers: BgLayer[] = [];

    // Layer 0: Distant buildings
    const layer0: BgLayer = { scrollX: 0.1, scrollY: 0.1, tint: COLOR_BG, elements: [] };
    for (let bx = -100; bx < worldW + 100; bx += 60 + bgHash(bx, 0) % 40) {
      const h = 40 + bgHash(bx, 1) % 50;
      const w = 30 + bgHash(bx, 2) % 20;
      layer0.elements.push({
        type: 'building', x: bx, y: worldH * 0.5 - h + bgHash(bx, 3) % 20, w, h,
        color: 0x0e0e14, detail: bx,
      });
    }
    layers.push(layer0);

    // Layer 1: Mid-ground buildings, arches, windows
    const layer1: BgLayer = { scrollX: 0.3, scrollY: 0.25, tint: COLOR_BG, elements: [] };
    for (let bx = -50; bx < worldW + 50; bx += 40 + bgHash(bx, 10) % 30) {
      const h = 30 + bgHash(bx, 11) % 40;
      const w = 20 + bgHash(bx, 12) % 15;
      const by = worldH * 0.4 - h / 2 + bgHash(bx, 13) % 30;
      layer1.elements.push({ type: 'building', x: bx, y: by, w, h, color: 0x121218, detail: bx + 100 });
      // 1-2 windows
      const wc = 1 + bgHash(bx, 14) % 2;
      for (let wi = 0; wi < wc; wi++) {
        layer1.elements.push({
          type: 'window', x: bx + 3 + wi * Math.floor((w - 6) / Math.max(1, wc)),
          y: by + 6 + bgHash(bx, 15 + wi) % (h / 2), w: 4, h: 5, color: 0x0c0c18, detail: bx + wi,
        });
      }
    }
    for (let ax = 80; ax < worldW; ax += 150 + bgHash(ax, 20) % 80) {
      layer1.elements.push({
        type: 'arch', x: ax, y: worldH * 0.55 + bgHash(ax, 23) % 20,
        w: 18 + bgHash(ax, 21) % 10, h: 20 + bgHash(ax, 22) % 12, color: 0x181820,
      });
    }
    layers.push(layer1);

    // Layer 2: Near — doors, pipes, pillars
    const layer2: BgLayer = { scrollX: 0.5, scrollY: 0.4, tint: COLOR_BG, elements: [] };
    for (let dx = 30; dx < worldW; dx += 60 + bgHash(dx, 30) % 50) {
      layer2.elements.push({
        type: 'door', x: dx, y: worldH * 0.5 + bgHash(dx, 33) % 20,
        w: 5 + bgHash(dx, 32) % 3, h: 10 + bgHash(dx, 31) % 6, color: 0x0a0a12,
      });
    }
    for (let px = 0; px < worldW; px += 100 + bgHash(px, 40) % 60) {
      const isHoriz = bgHash(px, 41) % 2 === 0;
      layer2.elements.push({
        type: 'pipe', x: px, y: worldH * 0.3 + bgHash(px, 43) % (worldH * 0.3),
        w: isHoriz ? 30 + bgHash(px, 42) % 40 : 3,
        h: isHoriz ? 3 : 20 + bgHash(px, 42) % 30, color: 0x2a2a28,
      });
    }
    for (let cx = 40; cx < worldW; cx += 90 + bgHash(cx, 60) % 50) {
      layer2.elements.push({
        type: 'pillar', x: cx, y: worldH * 0.4 + bgHash(cx, 62) % 20,
        w: 4, h: 25 + bgHash(cx, 61) % 20, color: 0x1a1a18,
      });
    }
    layers.push(layer2);

    return layers;
  }
}
