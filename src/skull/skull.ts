import { createScene } from './scene';
import { createSkullMaterial } from './material';
import { createComposer, type GlitchInstance } from './postfx';
import { createInteractions } from './interactions';
import { createIdleBehavior } from './idle';
import { createSkullMotion } from './skullMotion';
import { createHud, type PuzzleLinesProvider } from './hud';
import { createPuzzle } from './puzzle';

// Neon palette for click color flash
const CLICK_COLORS: number[] = [
  0x00ffc8,  // cyan (idle)
  0x5bff1a,  // acid green
  0xffb000,  // amber
  0xff1a80,  // magenta
  0xff3030,  // red
  0x30a0ff,  // electric blue
];

type Variant = 0 | 1 | 2;

function randVariant(): Variant {
  return Math.floor(Math.random() * 3) as Variant;
}

interface BurstSlotOptions {
  /** Seconds between bursts: [min, max] */
  gap: [number, number];
  /** Burst lifetime in seconds: [min, max] */
  lifetime: [number, number];
  /** Peak intensity: [min, max] */
  peak: [number, number];
  /** If true, burst covers the full screen. If false, random vertical band. */
  fullScreen?: boolean;
}

/**
 * One independent burst slot. Owns its own timing, decay, and randomization.
 * Multiple slots run in parallel so different glitch types can overlap.
 *
 * Each burst has an explicit lifetime and envelope: fast attack (~20ms), then
 * linear decay to 0 over the rest of the lifetime.
 */
class BurstSlot {
  private age = 0;
  private lifetime = 0;
  private peak = 0;
  private nextIn: number;
  private inst: GlitchInstance;

  constructor(private readonly opts: BurstSlotOptions) {
    this.nextIn = opts.gap[0] + Math.random() * (opts.gap[1] - opts.gap[0]);
    this.inst = {
      variant: 0,
      intensity: 0,
      regionCenter: 0.5,
      regionHeight: 1.0,
      jitter: 0,
    };
  }

  tick(dt: number): GlitchInstance {
    this.nextIn -= dt;
    if (this.nextIn <= 0) {
      this.trigger();
    }

    this.age += dt;
    if (this.age >= this.lifetime) {
      this.inst.intensity = 0;
    } else {
      const attack = 0.02;  // 20ms rise
      let envelope: number;
      if (this.age < attack) {
        envelope = this.age / attack;
      } else {
        envelope = 1 - (this.age - attack) / (this.lifetime - attack);
      }
      this.inst.intensity = this.peak * envelope;
    }
    return this.inst;
  }

  private trigger() {
    const { gap, lifetime, peak, fullScreen } = this.opts;
    this.age = 0;
    this.peak = peak[0] + Math.random() * (peak[1] - peak[0]);
    this.inst.variant = randVariant();
    if (fullScreen) {
      this.inst.regionCenter = 0.5;
      this.inst.regionHeight = 1.0;
      this.inst.jitter = 0.7;  // > 0.5 disables horizontal masking in shader
    } else {
      this.inst.regionCenter = 0.2 + Math.random() * 0.6;
      this.inst.regionHeight = 0.08 + Math.random() * 0.32;
      this.inst.jitter = Math.random();
    }
    this.lifetime = lifetime[0] + Math.random() * (lifetime[1] - lifetime[0]);
    this.nextIn = gap[0] + Math.random() * (gap[1] - gap[0]);
  }
}

async function boot() {
  const canvas = document.getElementById('skull-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (!('WebGLRenderingContext' in window)) {
    const nogl = document.getElementById('nogl');
    if (nogl) nogl.classList.add('active');
    canvas.style.display = 'none';
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const noiseSeed = Math.random() * 1000;
  const { material, uniforms } = createSkullMaterial(noiseSeed);

  const scene = await createScene(canvas);
  scene.setMaterial(material);

  const composer = createComposer(scene);

  const skullMotion = createSkullMotion(scene);
  const bus = createInteractions(canvas, scene, () => ({
    yaw: skullMotion.getYaw(),
    pitch: skullMotion.getPitch(),
  }));
  const idle = createIdleBehavior(bus, skullMotion);

  const puzzle = createPuzzle(bus, idle);
  const hudEl = document.getElementById('hud') as HTMLElement;
  const hud = createHud(hudEl, bus, puzzle);

  puzzle.onUnlock(() => {
    console.log('[puzzle] UNLOCKED');
    composer.setUnlocked(true);
    hud.setUnlocked(true);
    uniforms.uUnlocked.value = true;
    // Shader branches to vec3(1.0, 0.1, 0.2) when unlocked regardless of
    // uBaseColor — mirror that into --hud-rgb so the HUD matches.
    document.documentElement.style.setProperty('--hud-rgb', '255 25 51');
  });

  // Click state
  let ringEffect = 0;               // expanding shader ring
  let jawClickBonus = 0;            // transient extra jaw opening from clicking the jaw
  let currentColorIndex = 0;        // index into CLICK_COLORS for uBaseColor
  let prevProgress = 0;             // tracks puzzle.getProgress() across clicks
  const clickPoint = { x: 0, y: 0, z: 0 };

  bus.on('click', ({ skullPart, hitLocal }) => {
    console.log('[click]', skullPart);
    if (hitLocal) {
      clickPoint.x = hitLocal.x;
      clickPoint.y = hitLocal.y;
      clickPoint.z = hitLocal.z;
    }
    ringEffect = 1;
    if (skullPart === 'jaw') {
      jawClickBonus = 1;
    }
    // Detect puzzle progress reset (wrong click after partial correct sequence)
    // and shake the skull as a "try again" signal. Puzzle's own click listener
    // runs before this one (registered first) so progress is up-to-date here.
    const progress = puzzle.getProgress();
    if (prevProgress > 0 && progress < prevProgress && !puzzle.isUnlocked()) {
      skullMotion.triggerShake();
    }
    prevProgress = progress;
    // Post-unlock: skip the color cycle. The shader ignores uBaseColor once
    // uUnlocked is true (renders red), so cycling would only desync --hud-rgb.
    if (puzzle.isUnlocked()) return;
    // Pick a new color — any from the palette except the current one
    let next = Math.floor(Math.random() * (CLICK_COLORS.length - 1));
    if (next >= currentColorIndex) next += 1;
    currentColorIndex = next;
    uniforms.uBaseColor.value.setHex(CLICK_COLORS[currentColorIndex]);
    // Update the --hud-rgb CSS variable so the HUD tracks the skull's color.
    const c = uniforms.uBaseColor.value;
    document.documentElement.style.setProperty(
      '--hud-rgb',
      `${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)}`
    );
  });

  // Three burst slots with distinct personalities.
  // Slot 0: rare ambient-style burst — full-screen, longer, lower intensity,
  //         infrequent. Reads as "signal drift" rather than a glitch.
  // Slots 1, 2: regional quick flashes with different rhythms.
  const ambientBurst = new BurstSlot({
    gap: [25, 55],
    lifetime: [0.35, 0.6],
    peak: [0.15, 0.28],
    fullScreen: true,
  });
  const burstA = new BurstSlot({
    gap: [7, 16],
    lifetime: [0.1, 0.22],
    peak: [0.5, 1.0],
  });
  const burstB = new BurstSlot({
    gap: [12, 28],
    lifetime: [0.1, 0.22],
    peak: [0.5, 1.0],
  });

  // Idle burst glitch (slot 3) — driven by idle.getGlitchBurst()
  let prevIdleBurst = 0;
  const idleGlitchInst: GlitchInstance = {
    variant: 0,
    intensity: 0,
    regionCenter: 0.5,
    regionHeight: 1.0,
    jitter: 0,
  };

  // Resting scale factor (applied in both normal and action paths)
  const RESTING_SCALE = 0.6;

  // Action blend factor: 0 = pure normal, 1 = pure action. Ramps smoothly
  // so actions ease in/out instead of snapping on/off.
  let actionBlend = 0;
  const ACTION_BLEND_IN = 0.25;   // seconds to ramp 0→1
  const ACTION_BLEND_OUT = 0.30;  // seconds to ramp 1→0

  function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    const t = scene.getTime();
    uniforms.uTime.value = t;

    if (!reducedMotion) idle.tick(dt);

    // Read action state (gated on reducedMotion: no actions during reduced motion)
    const actionFrame = !reducedMotion ? idle.getActionFrame() : null;
    const actionPlaying = !reducedMotion ? idle.isActionPlaying() : false;

    // Ramp action blend toward 1 while playing, toward 0 otherwise.
    if (actionPlaying) {
      actionBlend = Math.min(1, actionBlend + dt / ACTION_BLEND_IN);
    } else {
      actionBlend = Math.max(0, actionBlend - dt / ACTION_BLEND_OUT);
    }
    const blend = smoothstep(actionBlend);

    const cursorState = bus.getCursor();
    uniforms.uCursor.value.set(cursorState.x, cursorState.y);

    // Always run the normal look-target path so skullMotion's integrator
    // stays warm. When blend > 0 the action overrides the final output, but
    // skullMotion keeps tracking so handoff back to normal is seamless.
    if (bus.isDragging()) {
      const orbit = bus.getOrbit();
      skullMotion.lookAt(orbit.x, orbit.y);
    } else if (!idle.isActive()) {
      const wobbleX = reducedMotion ? 0 : Math.sin(t * 0.23) * 0.14;
      const wobbleY = reducedMotion ? 0 : Math.cos(t * 0.19) * 0.07;
      const targetYaw = cursorState.x * 0.7 + wobbleX;
      const targetPitch = -cursorState.y * 0.3 + wobbleY;
      skullMotion.lookAt(targetYaw, targetPitch);
    }
    skullMotion.tick(dt);

    // skullMotion just wrote "normal" rotation into scene.skull.rotation.
    // Read it as the baseline, then blend action overrides on top.
    const normalRotY = scene.skull.rotation.y;
    const normalRotX = scene.skull.rotation.x;
    const normalPosX = bus.isTouch() ? 0 : cursorState.x * 0.15;

    if (blend > 0 && actionFrame) {
      // Rotation: blend from skullMotion output toward action target
      if (actionFrame.rotation !== null) {
        scene.skull.rotation.y = normalRotY + (actionFrame.rotation.yaw - normalRotY) * blend;
        scene.skull.rotation.x = normalRotX + (actionFrame.rotation.pitch - normalRotX) * blend;
      }
      // Position: action offsets fade in/out; normal x parallax fades inversely
      scene.skull.position.x = normalPosX * (1 - blend) + actionFrame.positionOffset.x * blend;
      scene.skull.position.y = actionFrame.positionOffset.y * blend;
      scene.skull.position.z = actionFrame.positionOffset.z * blend;
      // Scale: blend between resting and action scale
      scene.skull.scale.setScalar(RESTING_SCALE * (1 + (actionFrame.scaleFactor - 1) * blend));
    } else {
      scene.skull.position.x = normalPosX;
      scene.skull.position.y = 0;
      scene.skull.position.z = 0;
      scene.skull.scale.setScalar(RESTING_SCALE);
    }

    // Scroll drives the jaw hinge directly. Max ~32 degrees open at full scroll.
    // The idle scheduler adds a transient "talk" offset via skullMotion.
    const scroll = bus.getScroll();
    // Jaw click bonus decays over ~0.6s
    jawClickBonus = Math.max(0, jawClickBonus - dt / 0.6);
    if (scene.jawPivot) {
      const scrollAngle = scroll * 0.55;
      const bonusAngle = jawClickBonus * 0.25;
      const talkOffset = skullMotion.getJawOffset();
      const normalJaw = Math.min(0.8, scrollAngle + bonusAngle + talkOffset);
      if (blend > 0 && actionFrame && actionFrame.jawAngle !== null) {
        scene.jawPivot.rotation.x = normalJaw + (actionFrame.jawAngle - normalJaw) * blend;
      } else {
        scene.jawPivot.rotation.x = normalJaw;
      }
    }

    // Ring effect decay (~1s) — expanding bright ring from the click point
    ringEffect = Math.max(0, ringEffect - dt / 1.0);
    uniforms.uRingEffect.value = ringEffect;
    uniforms.uClickPoint.value.set(clickPoint.x, clickPoint.y, clickPoint.z);

    if (!reducedMotion) {
      composer.setSlot(0, ambientBurst.tick(dt));
      composer.setSlot(1, burstA.tick(dt));
      composer.setSlot(2, burstB.tick(dt));
    }

    const idleBurst = idle.getGlitchBurst();
    if (prevIdleBurst <= 0 && idleBurst > 0) {
      idleGlitchInst.variant = Math.floor(Math.random() * 3) as 0 | 1 | 2;
      idleGlitchInst.regionCenter = 0.2 + Math.random() * 0.6;
      idleGlitchInst.regionHeight = 0.08 + Math.random() * 0.32;
      idleGlitchInst.jitter = Math.random();
      if (!puzzle.isUnlocked()) {
        hud.flashHint(puzzle.getGlitchHint());
      }
    }
    idleGlitchInst.intensity = idleBurst;
    prevIdleBurst = idleBurst;
    if (!reducedMotion) composer.setSlot(3, idleGlitchInst);

    composer.render();
    hud.tick(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    scene.resize();
    composer.resize();
  });
}

boot().catch((err) => console.error('[skull] boot failed', err));
