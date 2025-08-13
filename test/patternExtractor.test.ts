import { extractAndConvertPattern } from "../lib/patternExtractor";
import { PatternMatch } from "../lib/types";

describe(extractAndConvertPattern, () => {
  test("シゃモナへ゛", () => {
    const result = extractAndConvertPattern("シゃモナへ゛");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "",
      converted: "",
      startIndex: -1,
      day: "",
    });
  });

  test("芹沢@土曜日西2さ41", () => {
    const result = extractAndConvertPattern("芹沢@土曜日西2さ41");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "",
      converted: "",
      startIndex: -1,
      day: "1日目",
    });
  });

  test("ふらら 土曜日 西つ 13b", () => {
    const result = extractAndConvertPattern("ふらら 土曜日 西つ 13b");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "つ 13b",
      converted: "つ13b",
      startIndex: 9,
      day: "1日目",
    });
  });

  test("ろりちゃーはん2杯目🔞C106土曜 西2す-16a", () => {
    const result = extractAndConvertPattern(
      "ろりちゃーはん2杯目🔞C106土曜 西2す-16a"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "す-16a",
      converted: "す16a",
      startIndex: 21,
      day: "1日目",
    });
  });

  test("微熱2℃ コミケ【土曜日南“ｓ”05a】", () => {
    const result = extractAndConvertPattern("微熱2℃ コミケ【土曜日南“ｓ”05a】");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "“ｓ”05a",
      converted: "s05a",
      startIndex: 13,
      day: "1日目",
    });
  });

  test("竹輪@C106 1日目南 “ｂ”ブロック－06a", () => {
    const result = extractAndConvertPattern(
      "竹輪@C106 1日目南 “ｂ”ブロック－06a"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "“ｂ”ブロック－06a",
      converted: "b06a",
      startIndex: 13,
      day: "1日目",
    });
  });

  test("栗芋パイ　日曜東Q‐23b", () => {
    const result = extractAndConvertPattern("栗芋パイ　日曜東Q‐23b");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "Q‐23b",
      converted: "Q23b",
      startIndex: 8,
      day: "2日目",
    });
  });

  test("カネダイチ@土曜日（西）''に''14b", () => {
    const result = extractAndConvertPattern("カネダイチ@土曜日（西）''に''14b");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "''に''14b",
      converted: "に14b",
      startIndex: 12,
      day: "1日目",
    });
  });

  test("イロリ@C106土曜日“西すｰ18b”", () => {
    const result = extractAndConvertPattern("イロリ@C106土曜日“西すｰ18b”");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "すｰ18b",
      converted: "す18b",
      startIndex: 13,
      day: "1日目",
    });
  });

  test("うこ🔞1日目南1ｒ17ab", () => {
    const result = extractAndConvertPattern("うこ🔞1日目南1ｒ17ab");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "ｒ17ab",
      converted: "r17ab",
      startIndex: 9,
      day: "1日目",
    });
  });

  test("キノキング@土西す14b／日東Q46a", () => {
    const result = extractAndConvertPattern("キノキング@土西す14b／日東Q46a");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      original: "す14b",
      converted: "す14b",
      startIndex: 8,
      day: "両日",
    });
    expect(result[1]).toMatchObject({
      original: "Q46a",
      converted: "Q46a",
      startIndex: 15,
      day: "両日",
    });
  });
});

// テストケース追加用のヘルパー関数
export function createTestCase(
  description: string,
  input: string,
  expectedMatches: Partial<PatternMatch>[]
) {
  return {
    description,
    testFunction: () => {
      const result = extractAndConvertPattern(input);

      if (expectedMatches.length === 0) {
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          original: "",
          converted: "",
          startIndex: -1,
        });
      } else {
        expect(result).toHaveLength(expectedMatches.length);

        expectedMatches.forEach((expectedMatch, index) => {
          if (expectedMatch.original !== undefined) {
            expect(result[index].original).toBe(expectedMatch.original);
          }
          if (expectedMatch.converted !== undefined) {
            expect(result[index].converted).toBe(expectedMatch.converted);
          }
          if (expectedMatch.day !== undefined) {
            expect(result[index].day).toBe(expectedMatch.day);
          }
          expect(result[index].startIndex).toBeGreaterThanOrEqual(-1);
        });
      }
    },
  };
}
