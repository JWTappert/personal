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
  flashHint(text: string): void;
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
  const flashEl = document.getElementById('hint-flash')!;

  let unlocked = false;

  return {
    tick(t: number) {
      const lines = provider.getHudLines(t);
      corners.tl.textContent = lines.tl;
      corners.tr.textContent = lines.tr;
      corners.bl.textContent = lines.bl;
      // Once unlocked, setUnlocked has written 'well played.' into br — don't
      // let the per-frame provider update overwrite it.
      if (!unlocked) {
        corners.br.textContent = lines.br;
      }
    },
    setUnlocked(flag: boolean) {
      unlocked = flag;
      if (flag) {
        corners.br.textContent = 'well played.';
      }
    },
    flashHint(text: string) {
      if (unlocked) return;
      flashEl.textContent = text;
      // Remove + force reflow + re-add so the animation restarts on every call
      flashEl.classList.remove('flash');
      void flashEl.offsetWidth;
      flashEl.classList.add('flash');
    },
  };
}
