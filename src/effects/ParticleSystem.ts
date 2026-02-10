import { type Graphics } from 'pixi.js';

export interface ParticleDef {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;      // seconds
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  gravity?: number;   // pixels/sec²
  fadeOut?: boolean;
  shrink?: boolean;
}

export class ParticleSystem {
  private particles: ParticleDef[] = [];

  get count(): number {
    return this.particles.length;
  }

  emit(p: Omit<ParticleDef, 'maxLife'>): void {
    this.particles.push({ ...p, maxLife: p.life });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(gfx: Graphics): void {
    for (const p of this.particles) {
      const t = p.life / p.maxLife; // 1 = born, 0 = dead
      const alpha = p.fadeOut !== false ? p.alpha * t : p.alpha;
      const size = p.shrink ? p.size * t : p.size;
      if (size < 0.3 || alpha < 0.05) continue;

      // Blend alpha into color brightness
      const r = Math.floor(((p.color >> 16) & 0xff) * alpha);
      const g = Math.floor(((p.color >> 8) & 0xff) * alpha);
      const b = Math.floor((p.color & 0xff) * alpha);
      const col = (r << 16) | (g << 8) | b;

      if (size <= 1) {
        gfx.rect(Math.floor(p.x), Math.floor(p.y), 1, 1).fill(col);
      } else {
        gfx.circle(Math.floor(p.x), Math.floor(p.y), size).fill(col);
      }
    }
  }

  clear(): void {
    this.particles.length = 0;
  }
}
