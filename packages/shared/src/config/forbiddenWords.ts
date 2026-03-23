// List of forbidden words (lowercase). Games whose names contain any of these
// words (word-boundary matched, case-insensitive) will be skipped when
// seeding pools.
export const forbiddenWords = [
  "xxx",
  "porn",
  "nude",
  "sex",
  "violent",
  "racist",
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const forbiddenRegex: RegExp | null =
  forbiddenWords.length > 0
    ? new RegExp(
        `\\b(${forbiddenWords.map(escapeRegExp).join("|")})\\b`,
        "i"
      )
    : null;
