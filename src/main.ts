import { Application } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, PIXEL_SCALE } from '@/config/constants';
import { Game } from '@/core/Game';

async function main(): Promise<void> {
  const app = new Application();

  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x000000,
    resolution: 1,
    antialias: false,
    roundPixels: true,
  });

  // Scale canvas up for pixel-art crispness
  const canvas = app.canvas;
  canvas.style.width = `${GAME_WIDTH * PIXEL_SCALE}px`;
  canvas.style.height = `${GAME_HEIGHT * PIXEL_SCALE}px`;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.position = 'absolute';
  canvas.style.left = '50%';
  canvas.style.top = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';

  document.body.appendChild(canvas);

  const game = new Game(app);
  game.start();
}

main().catch(console.error);
