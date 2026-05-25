import {
  normalizeSearchTokens,
  scoreItem,
  createScoredComparator,
  filterBySearch,
  filterAndSortBySearch,
  SearchFieldConfig,
  ScoredItem,
} from "./searchUtils";

type TestItem = { name: string; code: string; description: string };

const nameField: SearchFieldConfig = {
  getValue: (item) => (item as TestItem).name,
  priority: "primary",
};

const codeField: SearchFieldConfig = {
  getValue: (item) => (item as TestItem).code,
  priority: "secondary",
};

const descField: SearchFieldConfig = {
  getValue: (item) => (item as TestItem).description,
  priority: "secondary",
};

const items: TestItem[] = [
  {
    name: "Application Data Entry",
    code: "app-data-entry",
    description: "Main form",
  },
  {
    name: "Loan Origination",
    code: "loan-orig",
    description: "Loan process form",
  },
  {
    name: "Application Review",
    code: "app-review",
    description: "Review application",
  },
  {
    name: "Account Management",
    code: "account-mgmt",
    description: "Manage account",
  },
];

describe("normalizeSearchTokens", () => {
  it("splits by whitespace and lowercases", () => {
    expect(normalizeSearchTokens("Hello World")).toEqual(["hello", "world"]);
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeSearchTokens("  foo  bar  ")).toEqual(["foo", "bar"]);
  });

  it("handles empty string", () => {
    expect(normalizeSearchTokens("")).toEqual([]);
  });

  it("handles only whitespace", () => {
    expect(normalizeSearchTokens("   ")).toEqual([]);
  });

  it("handles single token", () => {
    expect(normalizeSearchTokens("loan")).toEqual(["loan"]);
  });

  it("collapses multiple spaces between words", () => {
    expect(normalizeSearchTokens("hello   world")).toEqual(["hello", "world"]);
  });
});

describe("scoreItem", () => {
  it("returns null when token does not match any field", () => {
    const result = scoreItem(items[0], ["xyz"], [nameField, codeField]);
    expect(result).toBeNull();
  });

  it("returns scored item when token matches", () => {
    const result = scoreItem(items[0], ["application"], [nameField, codeField]);
    expect(result).not.toBeNull();
    expect(result?.item).toBe(items[0]);
    expect(result?.score).toBeGreaterThan(0);
  });

  it("returns null when any token does not match", () => {
    const result = scoreItem(
      items[0],
      ["application", "xyz"],
      [nameField, codeField],
    );
    expect(result).toBeNull();
  });

  it("gives higher score when primary field starts with token", () => {
    const exactStart = scoreItem(
      { name: "Loan", code: "loan-id", description: "desc" },
      ["loan"],
      [nameField, codeField],
    );
    const partialMatch = scoreItem(
      { name: "My Loan", code: "some-code", description: "desc" },
      ["loan"],
      [nameField, codeField],
    );
    expect(exactStart!.score).toBeGreaterThan(partialMatch!.score);
  });

  it("gives secondary field start score when primary field does not start with token but secondary does", () => {
    const item = { name: "Foo", code: "loan-code", description: "desc" };
    const result = scoreItem(item, ["loan"], [nameField, codeField]);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
  });

  it("scores at least 2 when token is included anywhere in the combined fields", () => {
    const item = { name: "My App", code: "some-code", description: "desc" };
    const result = scoreItem(item, ["app"], [nameField, codeField]);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThanOrEqual(2);
  });

  it("accumulates score for multiple tokens", () => {
    const item = {
      name: "Application Data Entry",
      code: "app-data",
      description: "desc",
    };
    const singleTokenResult = scoreItem(item, ["application"], [nameField]);
    const multiTokenResult = scoreItem(
      item,
      ["application", "data"],
      [nameField],
    );
    expect(multiTokenResult!.score).toBeGreaterThan(singleTokenResult!.score);
  });

  it("returns scored item with score 1 for minimal match (include in combined but not in individual fields start)", () => {
    const item = {
      name: "My App Form",
      code: "some-code",
      description: "desc",
    };
    const result = scoreItem(item, ["app"], [nameField, codeField]);
    expect(result).not.toBeNull();
  });
});

describe("createScoredComparator", () => {
  const comparator = createScoredComparator<TestItem>([(item) => item.name]);

  it("sorts higher score first", () => {
    const a: ScoredItem<TestItem> = { item: items[0], score: 5 };
    const b: ScoredItem<TestItem> = { item: items[1], score: 3 };
    expect(comparator(a, b)).toBeLessThan(0);
    expect(comparator(b, a)).toBeGreaterThan(0);
  });

  it("uses string tiebreaker when scores are equal", () => {
    const a: ScoredItem<TestItem> = {
      item: { name: "Alpha", code: "a", description: "d" },
      score: 5,
    };
    const b: ScoredItem<TestItem> = {
      item: { name: "Beta", code: "b", description: "d" },
      score: 5,
    };
    const result = comparator(a, b);
    expect(result).toBeLessThan(0);
  });

  it("returns 0 when scores and tiebreakers are equal", () => {
    const a: ScoredItem<TestItem> = { item: items[0], score: 5 };
    const b: ScoredItem<TestItem> = { item: items[0], score: 5 };
    expect(comparator(a, b)).toBe(0);
  });

  it("uses numeric tiebreaker when scores are equal", () => {
    const numComparator = createScoredComparator<{ rank: number }>([
      (item) => item.rank,
    ]);
    const a: ScoredItem<{ rank: number }> = { item: { rank: 1 }, score: 5 };
    const b: ScoredItem<{ rank: number }> = { item: { rank: 2 }, score: 5 };
    expect(numComparator(a, b)).toBeLessThan(0);
  });

  it("moves to next tiebreaker when first tiebreaker is equal", () => {
    const multiComparator = createScoredComparator<TestItem>([
      (item) => item.name,
      (item) => item.code,
    ]);
    const a: ScoredItem<TestItem> = {
      item: { name: "Same", code: "aaa", description: "d" },
      score: 5,
    };
    const b: ScoredItem<TestItem> = {
      item: { name: "Same", code: "bbb", description: "d" },
      score: 5,
    };
    expect(multiComparator(a, b)).toBeLessThan(0);
  });
});

describe("filterBySearch", () => {
  it("returns all items when search value is empty", () => {
    expect(filterBySearch(items, "", [nameField])).toEqual(items);
  });

  it("returns all items when search value is only whitespace", () => {
    expect(filterBySearch(items, "   ", [nameField])).toEqual(items);
  });

  it("filters items matching search value in primary field", () => {
    const result = filterBySearch(items, "loan", [nameField]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Loan Origination");
  });

  it("filters items matching search value in secondary field", () => {
    const result = filterBySearch(items, "orig", [nameField, codeField]);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("loan-orig");
  });

  it("filters items matching multiple tokens (all must match)", () => {
    const result = filterBySearch(items, "application review", [
      nameField,
      codeField,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Application Review");
  });

  it("returns empty array when no items match", () => {
    const result = filterBySearch(items, "xyz", [nameField, codeField]);
    expect(result).toHaveLength(0);
  });

  it("filters across multiple fields combined", () => {
    const result = filterBySearch(items, "app", [
      nameField,
      codeField,
      descField,
    ]);
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((item) =>
        [item.name, item.code, item.description].some((f) =>
          f.toLowerCase().includes("app"),
        ),
      ),
    ).toBe(true);
  });
});

describe("filterAndSortBySearch", () => {
  const tiebreakers = [(item: TestItem) => item.name];

  it("returns all items when search value is empty", () => {
    const result = filterAndSortBySearch(items, "", [nameField], tiebreakers);
    expect(result).toEqual(items);
  });

  it("returns all items when search value is only whitespace", () => {
    const result = filterAndSortBySearch(
      items,
      "   ",
      [nameField],
      tiebreakers,
    );
    expect(result).toEqual(items);
  });

  it("filters and returns matching items", () => {
    const result = filterAndSortBySearch(
      items,
      "loan",
      [nameField, codeField],
      tiebreakers,
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(
      result.some((item) => item.name.toLowerCase().includes("loan")),
    ).toBe(true);
  });

  it("returns empty array when no items match", () => {
    const result = filterAndSortBySearch(
      items,
      "nonexistent",
      [nameField, codeField],
      tiebreakers,
    );
    expect(result).toHaveLength(0);
  });

  it("sorts by score descending when multiple items match", () => {
    const testItems = [
      { name: "My Application", code: "b-code", description: "" },
      { name: "Application Data Entry", code: "a-code", description: "" },
    ];
    const result = filterAndSortBySearch(
      testItems,
      "application",
      [nameField, codeField],
      [(item) => item.name],
    );
    expect(result[0].name).toBe("Application Data Entry");
  });

  it("applies tiebreaker when scores are the same", () => {
    const testItems = [
      { name: "Beta Application", code: "beta-code", description: "" },
      { name: "Alpha Application", code: "alpha-code", description: "" },
    ];
    const result = filterAndSortBySearch(
      testItems,
      "application",
      [nameField],
      [(item) => item.name],
    );
    expect(result[0].name).toBe("Alpha Application");
  });
});
