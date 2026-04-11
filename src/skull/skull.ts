import { createScene } from './scene';
import { createSkullMaterial } from './material';
import { createComposer, type GlitchInstance } from './postfx';
import { createInteractions } from './interactions';
import { createIdleBehavior } from './idle';
import { createSkullMotion } from './skullMotion';
import { createHud, type PuzzleLinesProvider } from './hud';

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
  if (!('WebGLRenderingContext' in window)) return;

  const noiseSeed = Math.random() * 1000;
  const { material, uniforms } = createSkullMaterial(noiseSeed);

  const scene = await createScene(canvas);
  scene.setMaterial(material);

  const composer = createComposer(scene);

  const bus = createInteractions(canvas, scene);
  const skullMotion = createSkullMotion(scene);
  const idle = createIdleBehavior(bus, skullMotion);

  const stubProvider: PuzzleLinesProvider = {
    getHudLines: () => ({
      tl: 'SYS_/CRANIUM.v2',
      tr: '42.5°N -123.8°W',
      bl: 'LINK_OK',
      br: '▓▒░ STANDBY',
    }),
    isUnlocked: () => false,
  };

  const hudEl = document.getElementById('hud') as HTMLElement;
  const hud = createHud(hudEl, bus, stubProvider);

  // Click state
  let ringEffect = 0;               // expanding shader ring
  let jawClickBonus = 0;            // transient extra jaw opening from clicking the jaw
  let currentColorIndex = 0;        // index into CLICK_COLORS for uBaseColor
  const clickPoint = { x: 0, y: 0, z: 0 };

  bus.on('click', ({ skullPart, hitLocal }) => {
    console.log('[click]', skullPart);
    if (hitLocal) {
      clickPoint.x = hitLocal.x;
      clickPoint.y = hitLocal.y;
      clickPoint.z = hitLocal.z;
    }
    ringEffect = 1;
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
    if (skullPart === 'jaw') {
      jawClickBonus = 1;
    }
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

  let lastFrame = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;

    const t = scene.getTime();
    uniforms.uTime.value = t;

    idle.tick(dt);

    // Lazy eye tracking: cursor driver feeds skullMotion with a target based
    // on cursor position plus a slow wobble. When the cursor is idle, the
    // idle scheduler (inside idle.tick) is driving skullMotion instead.
    const cursorState = bus.getCursor();
    uniforms.uCursor.value.set(cursorState.x, cursorState.y);
    if (!idle.isActive()) {
      const wobbleX = Math.sin(t * 0.23) * 0.14;
      const wobbleY = Math.cos(t * 0.19) * 0.07;
      const targetYaw = cursorState.x * 0.7 + wobbleX;
      const targetPitch = -cursorState.y * 0.3 + wobbleY;
      skullMotion.lookAt(targetYaw, targetPitch);
    }
    skullMotion.tick(dt);
    scene.skull.position.x = cursorState.x * 0.15;

    // Scroll drives the jaw hinge directly. Max ~32 degrees open at full scroll.
    // The idle scheduler adds a transient "talk" offset via skullMotion.
    const scroll = bus.getScroll();
    // Jaw click bonus decays over ~0.6s
    jawClickBonus = Math.max(0, jawClickBonus - dt / 0.6);
    if (scene.jawPivot) {
      const scrollAngle = scroll * 0.55;
      const bonusAngle = jawClickBonus * 0.25;
      const talkOffset = skullMotion.getJawOffset();
      scene.jawPivot.rotation.x = Math.min(0.8, scrollAngle + bonusAngle + talkOffset);
    }

    // Ring effect decay (~1s) — expanding bright ring from the click point
    ringEffect = Math.max(0, ringEffect - dt / 1.0);
    uniforms.uRingEffect.value = ringEffect;
    uniforms.uClickPoint.value.set(clickPoint.x, clickPoint.y, clickPoint.z);

    composer.setSlot(0, ambientBurst.tick(dt));
    composer.setSlot(1, burstA.tick(dt));
    composer.setSlot(2, burstB.tick(dt));

    const idleBurst = idle.getGlitchBurst();
    if (prevIdleBurst <= 0 && idleBurst > 0) {
      idleGlitchInst.variant = Math.floor(Math.random() * 3) as 0 | 1 | 2;
      idleGlitchInst.regionCenter = 0.2 + Math.random() * 0.6;
      idleGlitchInst.regionHeight = 0.08 + Math.random() * 0.32;
      idleGlitchInst.jitter = Math.random();
    }
    idleGlitchInst.intensity = idleBurst;
    prevIdleBurst = idleBurst;
    composer.setSlot(3, idleGlitchInst);

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
