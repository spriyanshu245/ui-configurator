export interface ScoredItem<T> {
  item: T;
  score: number;
}

export interface SearchFieldConfig {
  getValue: (item: unknown) => string;
  priority: "primary" | "secondary";
}

export const normalizeSearchTokens = (searchValue: string): string[] => {
  return searchValue
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
};

const calculateFieldScore = (
  token: string,
  fieldValue: string,
  isPrimary: boolean
): number => {
  if (fieldValue.startsWith(token)) return isPrimary ? 4 : 3;
  if (fieldValue.includes(token)) return 2;
  return 1;
};

export const scoreItem = <T>(
  item: T,
  tokens: string[],
  fields: SearchFieldConfig[]
): ScoredItem<T> | null => {
  const fieldValues = fields.map((field) => ({
    value: field.getValue(item).toLowerCase(),
    isPrimary: field.priority === "primary",
  }));

  const combined = fieldValues.map((f) => f.value).join(" ");

  let score = 0;
  for (const token of tokens) {
    if (!combined.includes(token)) {
      return null;
    }
    let maxTokenScore = 1;
    for (const field of fieldValues) {
      const fieldScore = calculateFieldScore(
        token,
        field.value,
        field.isPrimary
      );
      if (fieldScore > maxTokenScore) {
        maxTokenScore = fieldScore;
      }
    }
    score += maxTokenScore;
  }

  return { item, score };
};

export const createScoredComparator = <T>(
  tiebreakers: Array<(item: T) => string | number>
): ((a: ScoredItem<T>, b: ScoredItem<T>) => number) => {
  return (a: ScoredItem<T>, b: ScoredItem<T>): number => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    for (const getTiebreakerValue of tiebreakers) {
      const aVal = getTiebreakerValue(a.item);
      const bVal = getTiebreakerValue(b.item);
      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        if (cmp !== 0) return cmp;
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        if (aVal !== bVal) return aVal - bVal;
      }
    }
    return 0;
  };
};

export const filterBySearch = <T>(
  items: T[],
  searchValue: string,
  fields: SearchFieldConfig[]
): T[] => {
  const tokens = normalizeSearchTokens(searchValue);
  if (tokens.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const combinedValue = fields
      .map((field) => field.getValue(item).toLowerCase())
      .join(" ");

    return tokens.every((token) => combinedValue.includes(token));
  });
};

export const filterAndSortBySearch = <T>(
  items: T[],
  searchValue: string,
  fields: SearchFieldConfig[],
  tiebreakers: Array<(item: T) => string | number>
): T[] => {
  const tokens = normalizeSearchTokens(searchValue);
  if (tokens.length === 0) {
    return items;
  }

  const comparator = createScoredComparator(tiebreakers);

  return items
    .map((item) => scoreItem(item, tokens, fields))
    .filter((entry): entry is ScoredItem<T> => entry !== null)
    .sort(comparator)
    .map((entry) => entry.item);
};
