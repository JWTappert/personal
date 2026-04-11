import type { InteractionBus } from './interactions';

export interface IdleHandle {
  tick(dt: number): void;
  getDecayLevel(): number;
  getGlitchBurst(): number;
}

export function createIdleBehavior(bus: InteractionBus): IdleHandle {
  let decayLevel = 0;
  let burst = 0;
  let burstCooldown = 2 + Math.random() * 2;

  const reset = () => {
    decayLevel = 0;
  };
  bus.on('pointer', reset);
  bus.on('click', reset);
  bus.on('scroll', reset);
  bus.on('key', reset);

  return {
    tick(dt: number) {
      const idleMs = performance.now() - bus.getLastInputTime();

      // After 1s of no input, ramp linearly to 1.0 over 8s.
      if (idleMs > 1000) {
        const t = (idleMs - 1000) / 8000;
        decayLevel = Math.min(1, t);
      }

      // Glitch bursts only when decay > 0.3
      if (decayLevel > 0.3) {
        burstCooldown -= dt;
        if (burstCooldown <= 0) {
          burst = 1;
          burstCooldown = 2 + Math.random() * 2 - decayLevel;
        }
      }
      burst = Math.max(0, burst - dt / 0.15);
    },
    getDecayLevel() {
      return decayLevel;
    },
    getGlitchBurst() {
      return burst;
    },
  };
}
