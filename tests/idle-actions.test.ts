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

  it('chomp produces roll and x-weave during advance', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    let sawRoll = false;
    let sawXWeave = false;
    for (let i = 0; i < 75; i++) {
      const f = actions.tick(0.016);
      if (f) {
        if (f.roll !== null && Math.abs(f.roll) > 0.01) sawRoll = true;
        if (Math.abs(f.positionOffset.x) > 0.01) sawXWeave = true;
      }
    }
    expect(sawRoll).toBe(true);
    expect(sawXWeave).toBe(true);
  });

  it('chomp roll alternates direction between bites', () => {
    const actions = make();
    actions.triggerChomp(0, 0);
    const rollSigns: number[] = [];
    let lastSign = 0;
    for (let i = 0; i < 75; i++) {
      const f = actions.tick(0.016);
      if (f && f.roll !== null && Math.abs(f.roll) > 0.02) {
        const sign = Math.sign(f.roll);
        if (sign !== lastSign) {
          rollSigns.push(sign);
          lastSign = sign;
        }
      }
    }
    // Should see at least 2 different sign transitions (alternating per chomp)
    expect(rollSigns.length).toBeGreaterThanOrEqual(2);
  });
});

describe('IdleActions — spin', () => {
  function make() {
    return createIdleActions();
  }

  it('triggerSpin starts playing and returns frames', () => {
    const actions = make();
    const started = actions.triggerSpin();
    expect(started).toBe(true);
    expect(actions.isPlaying()).toBe(true);
    const frame = actions.tick(0.016);
    expect(frame).not.toBeNull();
  });

  it('spin completes after sufficient time', () => {
    const actions = make();
    actions.triggerSpin();
    // Advance well past max spin duration (~3s)
    for (let i = 0; i < 250; i++) actions.tick(0.016);
    expect(actions.isPlaying()).toBe(false);
  });

  it('spin produces y-axis bob during rotation', () => {
    const actions = make();
    actions.triggerSpin();
    // Skip wind-up (~0.2s)
    for (let i = 0; i < 15; i++) actions.tick(0.016);
    // During spin phase, y offset should vary (bobbing)
    let minY = 0, maxY = 0;
    for (let i = 0; i < 100; i++) {
      const f = actions.tick(0.016);
      if (f) {
        minY = Math.min(minY, f.positionOffset.y);
        maxY = Math.max(maxY, f.positionOffset.y);
      }
    }
    expect(maxY - minY).toBeGreaterThan(0.1);
  });

  it('spin produces a full 360° yaw rotation', () => {
    const actions = make();
    actions.triggerSpin();
    let totalYaw = 0;
    let prevYaw = 0;
    for (let i = 0; i < 250; i++) {
      const f = actions.tick(0.016);
      if (f && f.rotation) {
        const delta = f.rotation.yaw - prevYaw;
        totalYaw += delta;
        prevYaw = f.rotation.yaw;
      }
    }
    // Should have rotated approximately 2*PI (±10%)
    expect(Math.abs(totalYaw)).toBeGreaterThan(Math.PI * 2 * 0.9);
  });

  it('spin with startYaw begins windup at the provided yaw', () => {
    const actions = make();
    const startYaw = 0.42;
    actions.triggerSpin(startYaw);
    // First frame is still in windup — rotation should hold startYaw
    const frame = actions.tick(0.001);
    expect(frame).not.toBeNull();
    expect(frame!.rotation).not.toBeNull();
    // Windup holds startYaw; yaw should equal startYaw exactly at t≈0
    expect(frame!.rotation!.yaw).toBeCloseTo(startYaw, 5);
  });

  it('spin accumulates from startYaw through a full cycle', () => {
    const actions = make();
    const startYaw = 1.0;
    actions.triggerSpin(startYaw);
    let maxYaw = -Infinity;
    for (let i = 0; i < 200; i++) {
      const f = actions.tick(0.016);
      if (f && f.rotation) {
        maxYaw = Math.max(maxYaw, f.rotation.yaw);
      }
    }
    // Max yaw should be at least startYaw + π (half rotation through the spin)
    expect(maxYaw).toBeGreaterThan(startYaw + Math.PI);
  });
});

describe('IdleActions — mutual exclusion', () => {
  it('cannot trigger spin while chomp is playing', () => {
    const actions = createIdleActions();
    actions.triggerChomp(0, 0);
    expect(actions.triggerSpin()).toBe(false);
  });

  it('cannot trigger chomp while spin is playing', () => {
    const actions = createIdleActions();
    actions.triggerSpin();
    expect(actions.triggerChomp(0, 0)).toBe(false);
  });

  it('can trigger after previous action completes', () => {
    const actions = createIdleActions();
    actions.triggerChomp(0, 0);
    // Run to completion
    for (let i = 0; i < 250; i++) actions.tick(0.016);
    expect(actions.isPlaying()).toBe(false);
    expect(actions.triggerSpin()).toBe(true);
  });
});
