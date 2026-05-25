import {
  PageComponentLocationState,
  PageLocationSnapshot,
} from "../types/types";

export const createDefaultPageLocationSnapshot = (): PageLocationSnapshot => ({
  componentLocations: {},
});

export const clonePageLocationSnapshot = (
  snapshot: PageLocationSnapshot,
): PageLocationSnapshot => ({
  componentLocations: Object.fromEntries(
    Object.entries(snapshot.componentLocations).map(
      ([componentId, location]) => [componentId, { ...location }],
    ),
  ),
});

export const hasSamePageLocationKeys = (
  current: Record<string, Record<string, PageComponentLocationState>>,
  next: Record<string, Record<string, PageComponentLocationState>>,
) => {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return currentKeys.every(
    (key) => Object.hasOwn(next, key) && current[key] === next[key],
  );
};

export const createPageLocationSnapshot = (
  pageCode: string,
  pageComponentLocations: Record<
    string,
    Record<string, PageComponentLocationState>
  >,
): PageLocationSnapshot => ({
  componentLocations: Object.fromEntries(
    Object.entries(pageComponentLocations[pageCode] ?? {}).map(
      ([componentId, location]) => [componentId, { ...location }],
    ),
  ),
});
