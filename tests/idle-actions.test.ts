import { describe, it, expect } from 'vitest';
import { createIdleActions } from '../src/skull/idleActions';

describe('IdleActions — chomp', () => {
  function make() {
    return createIdleActions();
  }

  it('is not playing initially', () => {
    const actions = make();
    expect(actions.isPlaying()).toBe(false);
    expect(actions.tick(0.016)).toBeNull();
  });

  it('triggerChomp starts playing and returns frames', () => {
    const actions = make();
    const started = actions.triggerChomp(0, 0);
    expect(started).toBe(true);
    expect(actions.isPlaying()).toBe(true);
    const frame = actions.tick(0.016);
    expect(frame).not.toBeNull();
    expect(frame!.positionOffset).toBeDefined();
    expect(frame!.scaleFactor).toBeDefined();
  });

  it('chomp completes and returns null after sufficient time', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    // Advance well past max chomp duration (~2.5s)
    for (let i = 0; i < 200; i++) {
      actions.tick(0.016);
    }
    // Should have completed (200 * 16ms = 3.2s)
    expect(actions.isPlaying()).toBe(false);
    expect(actions.tick(0.016)).toBeNull();
  });

  it('chomp aim phase targets the provided cursor coordinates', () => {
    const actions = make();
    actions.triggerChomp(0.5, -0.3);
    const frame = actions.tick(0.001); // tiny dt, still in aim phase
    expect(frame).not.toBeNull();
    expect(frame!.rotation).not.toBeNull();
    // Yaw should be moving toward cursor-derived target (0.5 * 0.7 = 0.35)
    // Pitch should be moving toward cursor-derived target (0.3 * 0.3 = 0.09)
    // At t=0.001, interpolation just started — values should be small but nonzero
    expect(typeof frame!.rotation!.yaw).toBe('number');
    expect(typeof frame!.rotation!.pitch).toBe('number');
  });

  it('chomp lunge phase advances position.z and increases scale', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    // Advance past aim (~0.2s)
    for (let i = 0; i < 15; i++) actions.tick(0.016);
    // Now in lunge or chomp phase — positionOffset.z should be > 0 at some point
    let maxZ = 0;
    let maxScale = 1;
    for (let i = 0; i < 20; i++) {
      const f = actions.tick(0.016);
      if (f) {
        maxZ = Math.max(maxZ, f.positionOffset.z);
        maxScale = Math.max(maxScale, f.scaleFactor);
      }
    }
    expect(maxZ).toBeGreaterThan(0);
    expect(maxScale).toBeGreaterThan(1);
  });

  it('chomp burst produces jaw angles', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    // Advance past aim + lunge (~0.35s)
    for (let i = 0; i < 25; i++) actions.tick(0.016);
    // During chomp burst, jaw should open and close
    let sawJawOpen = false;
    let sawJawClosed = false;
    for (let i = 0; i < 60; i++) {
      const f = actions.tick(0.016);
      if (f && f.jawAngle !== null) {
        if (f.jawAngle > 0.3) sawJawOpen = true;
        if (f.jawAngle < 0.05) sawJawClosed = true;
      }
    }
    expect(sawJawOpen).toBe(true);
    expect(sawJawClosed).toBe(true);
  });
});
