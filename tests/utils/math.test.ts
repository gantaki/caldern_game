import { describe, it, expect } from 'vitest';
import { lerp, clamp, approach, sign, aabbOverlap } from '@/utils/math';

describe('lerp', () => {
  it('returns start when t=0', () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it('returns end when t=1', () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it('returns midpoint when t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

describe('clamp', () => {
  it('clamps below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('passes through when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('approach', () => {
  it('moves towards target', () => {
    expect(approach(0, 10, 3)).toBe(3);
  });

  it('does not overshoot', () => {
    expect(approach(8, 10, 5)).toBe(10);
  });

  it('works in negative direction', () => {
    expect(approach(10, 0, 3)).toBe(7);
  });

  it('returns current when at target', () => {
    expect(approach(5, 5, 3)).toBe(5);
  });
});

describe('sign', () => {
  it('returns 1 for positive', () => {
    expect(sign(5)).toBe(1);
  });

  it('returns -1 for negative', () => {
    expect(sign(-3)).toBe(-1);
  });

  it('returns 0 for zero', () => {
    expect(sign(0)).toBe(0);
  });
});

describe('aabbOverlap', () => {
  it('detects overlap', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(aabbOverlap(a, b)).toBe(true);
  });

  it('detects no overlap', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(aabbOverlap(a, b)).toBe(false);
  });

  it('touching edges do not overlap', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(aabbOverlap(a, b)).toBe(false);
  });
});
