/**
 * @jest-environment node
 */
import {
  DEFAULT_LAUNCHER,
  LAUNCHER_STORAGE_KEY,
  bubbleSide,
  clampLauncher,
  launcherTopLeft,
  loadLauncher,
  saveLauncher,
} from "../launcher-position";

const vp = { w: 1000, h: 800 };

describe("launcher position", () => {
  it("defaults to the bottom-right corner", () => {
    expect(launcherTopLeft(DEFAULT_LAUNCHER, vp)).toEqual({ x: 1000 - 60 - 24, y: 800 - 60 - 24 });
  });

  it("keeps a saved position, clamped so the whole button stays on screen", () => {
    expect(launcherTopLeft({ pos: { x: 100, y: 50 }, pinned: false }, vp)).toEqual({ x: 100, y: 50 });
    expect(clampLauncher({ x: 5000, y: -40 }, vp)).toEqual({ x: 940, y: 0 });
  });

  it("puts the greeting bubble on the side with room", () => {
    expect(bubbleSide(900, vp)).toBe("left");
    expect(bubbleSide(20, vp)).toBe("right");
  });

  it("persists and restores position and pin state", () => {
    const data: Record<string, string> = {};
    const store = { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => { data[k] = v; } };
    saveLauncher(store, { pos: { x: 10, y: 20 }, pinned: true });
    expect(JSON.parse(data[LAUNCHER_STORAGE_KEY])).toEqual({ pos: { x: 10, y: 20 }, pinned: true });
    expect(loadLauncher(store)).toEqual({ pos: { x: 10, y: 20 }, pinned: true });
  });

  it("falls back to the default for missing, corrupt or invalid data, and never throws", () => {
    expect(loadLauncher(undefined)).toEqual(DEFAULT_LAUNCHER);
    expect(loadLauncher({ getItem: () => "{oops" })).toEqual(DEFAULT_LAUNCHER);
    expect(loadLauncher({ getItem: () => JSON.stringify({ pos: { x: "a" }, pinned: "yes" }) })).toEqual(DEFAULT_LAUNCHER);
    const broken = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
    expect(loadLauncher(broken)).toEqual(DEFAULT_LAUNCHER);
    expect(() => saveLauncher(broken, DEFAULT_LAUNCHER)).not.toThrow();
  });
});
