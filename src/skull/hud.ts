import type { InteractionBus } from './interactions';

// Provided by puzzle.ts in a later task; for now accept a minimal interface
// so HUD can be wired up before puzzle is implemented.
export interface PuzzleLinesProvider {
  getHudLines(t: number): {
    tl: string;
    tr: string;
    bl: string;
    br: string;
  };
  isUnlocked(): boolean;
}

export interface HudHandle {
  tick(t: number): void;
  setUnlocked(flag: boolean): void;
}

export function createHud(
  root: HTMLElement,
  bus: InteractionBus,
  provider: PuzzleLinesProvider
): HudHandle {
  const corners: Record<'tl' | 'tr' | 'bl' | 'br', HTMLElement> = {
    tl: root.querySelector('.hud-tl')!,
    tr: root.querySelector('.hud-tr')!,
    bl: root.querySelector('.hud-bl')!,
    br: root.querySelector('.hud-br')!,
  };

  let unlocked = false;

  return {
    tick(t: number) {
      // Opacity driven by edge proximity (smooth curve)
      const p = bus.getCursor().edgeProximity;
      const targetOpacity = Math.pow(p, 1.4);
      root.style.opacity = String(targetOpacity);
      root.classList.toggle('revealed', targetOpacity > 0.3);

      const lines = provider.getHudLines(t);
      corners.tl.textContent = lines.tl;
      corners.tr.textContent = lines.tr;
      corners.bl.textContent = lines.bl;
      corners.br.textContent = lines.br;
    },
    setUnlocked(flag: boolean) {
      unlocked = flag;
      if (flag) {
        corners.br.textContent = 'well played.';
      }
    },
  };
}
