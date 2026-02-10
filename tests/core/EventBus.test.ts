import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/core/EventBus';

describe('EventBus', () => {
  it('calls listener on emit', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.emit('test', 42);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('supports multiple listeners', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('test', fn1);
    bus.on('test', fn2);
    bus.emit('test');
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it('unsubscribes correctly', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    const unsub = bus.on('test', fn);
    unsub();
    bus.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });

  it('once fires only once', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.once('test', fn);
    bus.emit('test');
    bus.emit('test');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('clear removes all listeners for event', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.clear('test');
    bus.emit('test');
    expect(fn).not.toHaveBeenCalled();
  });
});
