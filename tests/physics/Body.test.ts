import { describe, it, expect } from 'vitest';
import { Body } from '@/physics/Body';

describe('Body', () => {
  it('has correct bounding box edges', () => {
    const body = new Body(10, 20, 16, 24);
    expect(body.left).toBe(10);
    expect(body.right).toBe(26);
    expect(body.top).toBe(20);
    expect(body.bottom).toBe(44);
    expect(body.centerX).toBe(18);
    expect(body.centerY).toBe(32);
  });

  it('applies gravity on integrate', () => {
    const body = new Body(0, 0, 10, 10);
    body.vy = 0;
    body.integrate(1 / 60);
    expect(body.vy).toBeGreaterThan(0); // gravity pulls down
    expect(body.y).toBeGreaterThan(0);
  });

  it('moves horizontally', () => {
    const body = new Body(0, 0, 10, 10);
    body.gravityScale = 0;
    body.vx = 100;
    body.integrate(1 / 60);
    expect(body.x).toBeCloseTo(100 / 60, 1);
  });

  it('respects gravityScale = 0', () => {
    const body = new Body(0, 0, 10, 10);
    body.gravityScale = 0;
    body.integrate(1 / 60);
    expect(body.vy).toBe(0);
  });
});
