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
  /** Envelope shape exponent. ~0.55 = pointed accent, ~1.0 = round bell. */
  let pulseShape = 1;

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
    // Mixed phrase lengths: mostly "sentences" (3-7), with short
    // interjections ("hmm", 1-2) and occasional ramblings (8-12).
    const r = Math.random();
    if (r < 0.15) {
      pulsesRemaining = 1 + Math.floor(Math.random() * 2);  // 1..2
    } else if (r < 0.9) {
      pulsesRemaining = 3 + Math.floor(Math.random() * 5);  // 3..7
    } else {
      pulsesRemaining = 8 + Math.floor(Math.random() * 5);  // 8..12
    }
    beginPulse();
  }

  function beginPulse() {
    // ~20% of pulses are "stressed" — bigger and slower (accented syllables).
    // The rest are normal syllables with a wide dynamic range.
    const stressed = Math.random() < 0.2;
    if (stressed) {
      pulseAmp = 0.22 + Math.random() * 0.22;       // 0.22..0.44 rad
      pulseDuration = 0.22 + Math.random() * 0.2;   // 220..420ms
    } else {
      pulseAmp = 0.03 + Math.random() * 0.18;       // 0.03..0.21 rad
      pulseDuration = 0.09 + Math.random() * 0.18;  // 90..270ms
    }
    // Shape varies from pointed (0.55) to rounded (1.0), so pulses don't all
    // have the same envelope character.
    pulseShape = 0.55 + Math.random() * 0.45;
    pulseAge = 0;
    talkPhase = 'pulse';
  }

  function scheduleNextRest() {
    // 70% tight (syllables running together), 25% comma-length,
    // 5% hesitation pause (thinking mid-sentence).
    const r = Math.random();
    if (r < 0.7) {
      talkTimer = 0.03 + Math.random() * 0.08;  // 30..110ms
    } else if (r < 0.95) {
      talkTimer = 0.15 + Math.random() * 0.15;  // 150..300ms
    } else {
      talkTimer = 0.35 + Math.random() * 0.3;   // 350..650ms
    }
    talkPhase = 'rest';
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
              scheduleNextRest();
              skullMotion.setJawOffset(0);
            }
          } else {
            // Shaped half-sine envelope: sin ramps 0->1->0, then raised to
            // pulseShape to vary the peak character (pointed vs round).
            const phase = Math.sin((Math.PI * pulseAge) / pulseDuration);
            const value = pulseAmp * Math.pow(phase, pulseShape);
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
