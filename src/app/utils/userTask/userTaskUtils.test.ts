import { saveMicrosite } from "./userTaskUtils";
import { Microsite, UserTask, Section } from "../../types/types";

describe("saveMicrosite", () => {
  test("removes history and currentIndex from each page", () => {
    const microsite: Microsite = {
      id: "ms1",
      name: "Test Microsite",
      description: "A sample microsite",
      pages: [
        {
          id: "page1",
          title: "Page One",
          // Provide history as an array of Section[] (empty array for simplicity)
          sections: [] as Section[],
        } as UserTask,
        {
          id: "page2",
          title: "Page Two",
          sections: [] as Section[],
        } as UserTask,
      ],
      firstPageId: "page1",
      code: "",
      published: false,
      version: 0,
    };

    const result = saveMicrosite(microsite);

    // The returned object should preserve microsite properties (except pages details)
    expect(result.id).toBe("ms1");
    expect(result.name).toBe("Test Microsite");
    expect(result.description).toBe("A sample microsite");
    expect(result.firstPageId).toBe("page1");

    // Pages should exist and have history/currentIndex removed.
    expect(result.pages).toHaveLength(2);
    result.pages?.forEach((page: any) => {
      expect(page).not.toHaveProperty("history");
      expect(page).not.toHaveProperty("currentIndex");
      // Other properties should remain intact.
      expect(page).toHaveProperty("id");
      expect(page).toHaveProperty("title");
      expect(page).toHaveProperty("sections");
    });
  });
});
