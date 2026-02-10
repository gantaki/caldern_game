import { Body } from './Body';
import { TileMap } from '@/world/TileMap';
import { TILE_SIZE } from '@/config/constants';

/**
 * Resolve a body's movement against the tilemap.
 * Uses separate X/Y resolution for clean corner handling.
 */
export function resolveBodyTilemap(body: Body, map: TileMap, dt: number): void {
  // Reset flags
  body.onGround = false;
  body.onCeiling = false;
  body.onWallLeft = false;
  body.onWallRight = false;

  // Apply gravity
  body.vy += 600 * body.gravityScale * dt;

  // Move X, then resolve
  body.x += body.vx * dt;
  resolveX(body, map);

  // Move Y, then resolve
  body.y += body.vy * dt;
  resolveY(body, map);
}

function resolveX(body: Body, map: TileMap): void {
  if (body.vx === 0) return;

  const startTy = Math.floor(body.top / TILE_SIZE);
  const endTy = Math.floor((body.bottom - 0.001) / TILE_SIZE);

  if (body.vx > 0) {
    // Moving right
    const edgeTx = Math.floor(body.right / TILE_SIZE);
    for (let ty = startTy; ty <= endTy; ty++) {
      if (map.isSolid(edgeTx, ty)) {
        body.x = edgeTx * TILE_SIZE - body.width;
        body.vx = 0;
        body.onWallRight = true;
        return;
      }
    }
  } else {
    // Moving left
    const edgeTx = Math.floor(body.left / TILE_SIZE);
    for (let ty = startTy; ty <= endTy; ty++) {
      if (map.isSolid(edgeTx, ty)) {
        body.x = (edgeTx + 1) * TILE_SIZE;
        body.vx = 0;
        body.onWallLeft = true;
        return;
      }
    }
  }
}

function resolveY(body: Body, map: TileMap): void {
  if (body.vy === 0) return;

  const startTx = Math.floor(body.left / TILE_SIZE);
  const endTx = Math.floor((body.right - 0.001) / TILE_SIZE);

  if (body.vy > 0) {
    // Moving down
    const edgeTy = Math.floor(body.bottom / TILE_SIZE);
    for (let tx = startTx; tx <= endTx; tx++) {
      if (map.isSolid(tx, edgeTy)) {
        body.y = edgeTy * TILE_SIZE - body.height;
        body.vy = 0;
        body.onGround = true;
        return;
      }
    }
  } else {
    // Moving up
    const edgeTy = Math.floor(body.top / TILE_SIZE);
    for (let tx = startTx; tx <= endTx; tx++) {
      if (map.isSolid(tx, edgeTy)) {
        body.y = (edgeTy + 1) * TILE_SIZE;
        body.vy = 0;
        body.onCeiling = true;
        return;
      }
    }
  }
}
