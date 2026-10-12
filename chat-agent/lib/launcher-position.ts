export interface LauncherState {
  pos: { x: number; y: number } | null;
  pinned: boolean;
}

export const LAUNCHER_SIZE = 60;
export const LAUNCHER_MARGIN = 24;
export const DRAG_THRESHOLD = 4;
export const LAUNCHER_STORAGE_KEY = "layoutx.chatLauncher";

export const DEFAULT_LAUNCHER: LauncherState = { pos: null, pinned: false };

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), Math.max(lo, hi));

export function clampLauncher(
  pos: { x: number; y: number },
  vp: { w: number; h: number },
): { x: number; y: number } {
  return {
    x: clamp(pos.x, 0, vp.w - LAUNCHER_SIZE),
    y: clamp(pos.y, 0, vp.h - LAUNCHER_SIZE),
  };
}

/** Resolved top-left of the button (the default sits in the bottom-right corner). */
export function launcherTopLeft(
  state: LauncherState,
  vp: { w: number; h: number },
): { x: number; y: number } {
  if (state.pos) return clampLauncher(state.pos, vp);
  return {
    x: vp.w - LAUNCHER_SIZE - LAUNCHER_MARGIN,
    y: vp.h - LAUNCHER_SIZE - LAUNCHER_MARGIN,
  };
}

export function bubbleSide(x: number, vp: { w: number }): "left" | "right" {
  return x + LAUNCHER_SIZE / 2 > vp.w / 2 ? "left" : "right";
}

export function loadLauncher(
  storage: Pick<Storage, "getItem"> | undefined,
): LauncherState {
  try {
    const raw = storage?.getItem(LAUNCHER_STORAGE_KEY);
    if (!raw) return DEFAULT_LAUNCHER;
    const parsed = JSON.parse(raw);
    const ok = (v: unknown) => typeof v === "number" && Number.isFinite(v);
    const pos =
      parsed?.pos && ok(parsed.pos.x) && ok(parsed.pos.y)
        ? { x: parsed.pos.x, y: parsed.pos.y }
        : null;
    return { pos, pinned: parsed?.pinned === true };
  } catch {
    return DEFAULT_LAUNCHER;
  }
}

export function saveLauncher(
  storage: Pick<Storage, "setItem"> | undefined,
  state: LauncherState,
) {
  try {
    storage?.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
