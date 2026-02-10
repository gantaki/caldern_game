/**
 * Pixel-art portrait renderer in Celeste dialogue style.
 * Each portrait is drawn procedurally on a small canvas (48x48).
 *
 * SOLID: Open/Closed — new portraits are added by registering draw functions,
 * not by modifying existing code.
 */

export type PortraitDrawFn = (ctx: CanvasRenderingContext2D) => void;

const SIZE = 48;
const registry = new Map<string, PortraitDrawFn>();

/** Register a portrait draw function for an NPC name. */
export function registerPortrait(name: string, draw: PortraitDrawFn): void {
  registry.set(name, draw);
}

/** Render a portrait to a data URL. Returns null if no portrait registered. */
export function renderPortrait(name: string): string | null {
  const draw = registry.get(name);
  if (!draw) return null;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return canvas.toDataURL();
}

// ---- Helper functions for pixel drawing ----

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// ========================================================
// Old Miner Gregor — Celeste-style portrait
// Weathered face, deep-set eyes, mining helmet, gray stubble,
// warm lighting from below (as if lantern-lit).
// ========================================================
registerPortrait('Old Miner Gregor', (ctx) => {
  // Background — dark with warm gradient hint
  px(ctx, 0, 0, SIZE, SIZE, '#0a0a12');
  // Subtle warm ambient glow from bottom
  px(ctx, 0, 36, SIZE, 12, '#12100a');
  px(ctx, 0, 42, SIZE, 6, '#1a1408');

  // --- Neck / collar area ---
  px(ctx, 18, 38, 12, 10, '#554433'); // shirt collar
  px(ctx, 17, 42, 14, 6, '#443322');  // vest/coat
  px(ctx, 16, 44, 16, 4, '#3a2a1a');  // lower coat

  // --- Face ---
  // Face shape — slightly weathered/angular
  const faceColor = '#b89878';
  const faceShadow = '#8a7058';
  const faceHighlight = '#ccaa88';

  // Main face block
  px(ctx, 18, 16, 12, 22, faceColor);
  // Jaw wider
  px(ctx, 17, 24, 14, 10, faceColor);
  // Forehead
  px(ctx, 19, 14, 10, 4, faceColor);

  // Face highlight (left side — light from lantern)
  px(ctx, 18, 18, 2, 12, faceHighlight);
  px(ctx, 17, 24, 2, 6, faceHighlight);

  // Face shadow (right side)
  px(ctx, 28, 18, 2, 12, faceShadow);
  px(ctx, 29, 24, 2, 6, faceShadow);

  // Chin shadow
  px(ctx, 19, 34, 10, 2, faceShadow);

  // --- Wrinkles / age lines ---
  px(ctx, 20, 20, 3, 1, faceShadow);  // left crow's feet
  px(ctx, 25, 20, 3, 1, faceShadow);  // right crow's feet
  px(ctx, 19, 30, 2, 1, faceShadow);  // nasolabial left
  px(ctx, 27, 30, 2, 1, faceShadow);  // nasolabial right
  px(ctx, 22, 33, 4, 1, faceShadow);  // chin crease

  // --- Eyes — deep-set, tired ---
  // Eye sockets (shadow)
  px(ctx, 20, 21, 4, 3, '#5a4838');
  px(ctx, 25, 21, 4, 3, '#5a4838');

  // Eyeballs
  px(ctx, 21, 22, 2, 2, '#ddd8cc');
  px(ctx, 26, 22, 2, 2, '#ddd8cc');

  // Pupils — looking slightly to the side
  px(ctx, 21, 22, 1, 2, '#2a2a22');
  px(ctx, 26, 22, 1, 2, '#2a2a22');

  // Eye highlights (small bright dot)
  px(ctx, 22, 22, 1, 1, '#ffffff');
  px(ctx, 27, 22, 1, 1, '#ffffff');

  // Bushy eyebrows
  px(ctx, 19, 20, 6, 1, '#666658');
  px(ctx, 20, 19, 4, 1, '#555548');
  px(ctx, 24, 20, 6, 1, '#666658');
  px(ctx, 25, 19, 4, 1, '#555548');

  // --- Nose ---
  px(ctx, 23, 25, 2, 4, faceHighlight);
  px(ctx, 24, 28, 1, 1, faceShadow);  // nostril shadow

  // --- Mouth ---
  px(ctx, 21, 31, 6, 1, '#6a5040');   // mouth line
  px(ctx, 22, 32, 4, 1, faceShadow);  // lower lip shadow

  // --- Stubble / gray beard ---
  const stubbleColor = '#7a7a6a';
  for (let sy = 30; sy <= 36; sy++) {
    for (let sx = 18; sx <= 29; sx++) {
      if ((sx + sy) % 3 === 0) {
        px(ctx, sx, sy, 1, 1, stubbleColor);
      }
    }
  }
  // Thicker stubble on chin
  px(ctx, 20, 34, 8, 2, '#6a6a5a');
  px(ctx, 21, 36, 6, 1, '#5a5a4a');

  // --- Ears ---
  px(ctx, 16, 22, 2, 4, faceColor);
  px(ctx, 30, 22, 2, 4, faceShadow);

  // --- Hair (gray, messy, visible under helmet) ---
  px(ctx, 16, 15, 3, 7, '#555548');
  px(ctx, 29, 15, 3, 7, '#4a4a40');
  px(ctx, 17, 14, 2, 2, '#555548');
  px(ctx, 29, 14, 2, 2, '#4a4a40');

  // --- Mining Helmet ---
  const helmetMain = '#8a7744';
  const helmetLight = '#aa9955';
  const helmetDark = '#6a5533';

  // Helmet dome
  px(ctx, 16, 8, 16, 7, helmetMain);
  px(ctx, 18, 6, 12, 3, helmetMain);
  px(ctx, 20, 5, 8, 2, helmetMain);

  // Brim
  px(ctx, 14, 14, 20, 2, helmetDark);
  px(ctx, 15, 13, 18, 2, helmetMain);

  // Helmet highlight
  px(ctx, 19, 7, 10, 1, helmetLight);
  px(ctx, 20, 6, 8, 1, helmetLight);

  // Helmet rivets
  px(ctx, 17, 10, 1, 1, helmetLight);
  px(ctx, 30, 10, 1, 1, helmetLight);

  // Helmet strap
  px(ctx, 16, 15, 1, 8, helmetDark);
  px(ctx, 31, 15, 1, 8, helmetDark);

  // --- Headlamp ---
  const lampColor = '#ffdd88';
  const lampGlow = '#ffeeaa';
  px(ctx, 22, 8, 4, 3, '#666655');   // lamp housing
  px(ctx, 23, 9, 2, 2, lampColor);    // lamp lens
  px(ctx, 23, 9, 1, 1, lampGlow);     // bright spot
  // Glow halo around lamp
  circle(ctx, 24, 10, 4, 'rgba(255, 220, 130, 0.08)');
  circle(ctx, 24, 10, 3, 'rgba(255, 220, 130, 0.12)');

  // --- Scar on right cheek ---
  px(ctx, 27, 27, 1, 3, '#8a6858');

  // --- Subtle warm under-lighting on face (lantern glow from below) ---
  ctx.fillStyle = 'rgba(255, 200, 120, 0.04)';
  ctx.fillRect(18, 30, 12, 8);

  // --- Border frame (Celeste-style thin dark border) ---
  ctx.strokeStyle = '#222228';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
});
