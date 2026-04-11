import type { InteractionBus } from './interactions';
import type { SkullMotionHandle } from './skullMotion';

export interface IdleHandle {
  tick(dt: number): void;
  /** True while idleness > the motion-activation threshold. */
  isActive(): boolean;
  /** 0..1 idle burst intensity for the composer glitch slot. */
  getGlitchBurst(): number;
}

const IDLE_ACTIVATION = 0.4;
const GLITCH_GATE = 0.3;

export function createIdleBehavior(
  bus: InteractionBus,
  skullMotion: SkullMotionHandle
): IdleHandle {
  let idleness = 0;

  // Glitch burst state
  let burst = 0;
  let burstCooldown = 2 + Math.random() * 2;

  // Look-around state
  let nextLookIn = 0;
  let wasActive = false;

  // Talk state
  // phase: 'silent' during inter-phrase gap, 'pulse' during an active pulse, 'rest' between pulses in a phrase
  type TalkPhase = 'silent' | 'pulse' | 'rest';
  let talkPhase: TalkPhase = 'silent';
  let talkTimer = 1.5 + Math.random() * 2.5; // initial silent delay
  let pulsesRemaining = 0;
  let pulseDuration = 0;
  let pulseAge = 0;
  let pulseAmp = 0;

  const reset = () => {
    idleness = 0;
  };
  bus.on('pointer', reset);
  bus.on('click', reset);
  bus.on('scroll', reset);
  bus.on('key', reset);

  function pickLookTarget() {
    const yaw = (Math.random() * 2 - 1) * 0.8;
    const pitch = (Math.random() * 2 - 1) * 0.35;
    skullMotion.lookAt(yaw, pitch);
  }

  function startPhrase() {
    pulsesRemaining = 3 + Math.floor(Math.random() * 5); // 3..7
    talkPhase = 'pulse';
    beginPulse();
  }

  function beginPulse() {
    pulseDuration = 0.14 + Math.random() * 0.12; // 140..260ms
    pulseAmp = 0.08 + Math.random() * 0.2;       // 0.08..0.28 rad
    pulseAge = 0;
    talkPhase = 'pulse';
  }

  function scheduleNextPhrase() {
    talkTimer = 1.5 + Math.random() * 2.5; // 1.5..4s silent gap
    talkPhase = 'silent';
  }

  return {
    tick(dt: number) {
      // idleness ramp: starts after 1s of no input, reaches 1.0 over 8s
      const idleMs = performance.now() - bus.getLastInputTime();
      if (idleMs > 1000) {
        idleness = Math.min(1, (idleMs - 1000) / 8000);
      } else {
        idleness = 0;
      }

      const active = idleness > IDLE_ACTIVATION;

      // Look-around scheduler
      if (active) {
        if (!wasActive) {
          pickLookTarget();
          nextLookIn = 2.5 + Math.random() * 3;
        } else {
          nextLookIn -= dt;
          if (nextLookIn <= 0) {
            pickLookTarget();
            nextLookIn = 2.5 + Math.random() * 3;
          }
        }
      }

      // Talk scheduler
      if (active) {
        if (talkPhase === 'silent') {
          talkTimer -= dt;
          if (talkTimer <= 0) startPhrase();
          skullMotion.setJawOffset(0);
        } else if (talkPhase === 'pulse') {
          pulseAge += dt;
          if (pulseAge >= pulseDuration) {
            pulsesRemaining -= 1;
            if (pulsesRemaining <= 0) {
              scheduleNextPhrase();
              skullMotion.setJawOffset(0);
            } else {
              talkPhase = 'rest';
              talkTimer = 0.04 + Math.random() * 0.08; // 40..120ms between pulses
              skullMotion.setJawOffset(0);
            }
          } else {
            // Half-sine envelope: 0 -> peak -> 0 over the pulse duration
            const value = pulseAmp * Math.sin((Math.PI * pulseAge) / pulseDuration);
            skullMotion.setJawOffset(value);
          }
        } else if (talkPhase === 'rest') {
          talkTimer -= dt;
          skullMotion.setJawOffset(0);
          if (talkTimer <= 0) beginPulse();
        }
      } else {
        // Not idle — silence the jaw.
        skullMotion.setJawOffset(0);
        talkPhase = 'silent';
        talkTimer = 1.5 + Math.random() * 2.5;
      }

      // Glitch burst (unchanged logic; gated on idleness instead of the removed decayLevel)
      if (idleness > GLITCH_GATE) {
        burstCooldown -= dt;
        if (burstCooldown <= 0) {
          burst = 1;
          burstCooldown = 2 + Math.random() * 2 - idleness;
        }
      }
      burst = Math.max(0, burst - dt / 0.15);

      wasActive = active;
    },
    isActive() {
      return idleness > IDLE_ACTIVATION;
    },
    getGlitchBurst() {
      return burst;
    },
  };
}
