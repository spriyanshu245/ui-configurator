import {
  clonePageLocationSnapshot,
  createDefaultPageLocationSnapshot,
  createPageLocationSnapshot,
  hasSamePageLocationKeys,
} from "./controlPanelUtils";

describe("controlPanelUtils", () => {
  test("createDefaultPageLocationSnapshot returns an empty snapshot", () => {
    expect(createDefaultPageLocationSnapshot()).toEqual({
      componentLocations: {},
    });
  });

  test("clonePageLocationSnapshot creates a deep clone of component locations", () => {
    const snapshot = {
      componentLocations: {
        "tabs-1": { activeTabIndex: 2 },
      },
    };

    const clonedSnapshot = clonePageLocationSnapshot(snapshot);

    expect(clonedSnapshot).toEqual(snapshot);
    expect(clonedSnapshot).not.toBe(snapshot);
    expect(clonedSnapshot.componentLocations).not.toBe(
      snapshot.componentLocations,
    );
    expect(clonedSnapshot.componentLocations["tabs-1"]).not.toBe(
      snapshot.componentLocations["tabs-1"],
    );
  });

  test("hasSamePageLocationKeys returns false when key counts differ", () => {
    expect(
      hasSamePageLocationKeys(
        {
          page1: { "tabs-1": { activeTabIndex: 1 } },
        },
        {},
      ),
    ).toBe(false);
  });

  test("hasSamePageLocationKeys returns false when the next object is missing a key", () => {
    expect(
      hasSamePageLocationKeys(
        {
          page1: { "tabs-1": { activeTabIndex: 1 } },
        },
        {
          page2: { "tabs-1": { activeTabIndex: 1 } },
        },
      ),
    ).toBe(false);
  });

  test("hasSamePageLocationKeys returns false when matching keys point to different objects", () => {
    expect(
      hasSamePageLocationKeys(
        {
          page1: { "tabs-1": { activeTabIndex: 1 } },
        },
        {
          page1: { "tabs-1": { activeTabIndex: 1 } },
        },
      ),
    ).toBe(false);
  });

  test("hasSamePageLocationKeys returns true when both objects share the same keyed references", () => {
    const sharedLocation = { "tabs-1": { activeTabIndex: 1 } };

    expect(
      hasSamePageLocationKeys(
        {
          page1: sharedLocation,
        },
        {
          page1: sharedLocation,
        },
      ),
    ).toBe(true);
  });

  test("createPageLocationSnapshot clones page locations", () => {
    const pageComponentLocations = {
      page1: {
        "tabs-1": { activeTabIndex: 3 },
      },
    };

    const snapshot = createPageLocationSnapshot(
      "page1",
      pageComponentLocations,
    );

    expect(snapshot).toEqual({
      componentLocations: {
        "tabs-1": { activeTabIndex: 3 },
      },
    });
    expect(snapshot.componentLocations["tabs-1"]).not.toBe(
      pageComponentLocations.page1["tabs-1"],
    );
  });

  test("createPageLocationSnapshot returns empty component locations for missing pages", () => {
    expect(createPageLocationSnapshot("missing", {})).toEqual({
      componentLocations: {},
    });
  });
});
