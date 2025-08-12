import { extractAndConvertPattern } from "../lib/patternExtractor";
import { PatternMatch } from "../lib/types";

describe("patternExtractor", () => {
  describe("extractAndConvertPattern", () => {
    test("パターンマッチなしの場合", () => {
      const result = extractAndConvertPattern("パターンなし文字列");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        original: "",
        converted: "",
        startIndex: -1,
        day: "",
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
      const result = extractAndConvertPattern(
        "微熱2℃ コミケ【土曜日南“ｓ”05a】"
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        original: "“s”05a",
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
        original: "“b”－06a",
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
      const result = extractAndConvertPattern(
        "カネダイチ@土曜日（西）''に''14b"
      );
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

    /**
     * ========================================
     * テストケース挿入エリア
     * ========================================
     *
     * 以下のフォーマットでテストケースを挿入してください：
     *
     * test('テストケース名', () => {
     *   const result = extractAndConvertPattern('入力文字列');
     *   expect(result).toHaveLength(1);
     *   expect(result[0]).toMatchObject({
     *     original: '期待するoriginal値',
     *     converted: '期待するconverted値',
     *     day: '期待するday値'
     *   });
     *   // startIndex が適切な値かどうかのチェック
     *   expect(result[0].startIndex).toBeGreaterThanOrEqual(0);
     * });
     *
     * パターンマッチしない場合のテスト：
     * test('パターンマッチしない場合', () => {
     *   const result = extractAndConvertPattern('マッチしない文字列');
     *   expect(result).toHaveLength(1);
     *   expect(result[0]).toMatchObject({
     *     original: '',
     *     converted: '',
     *     startIndex: -1,
     *     day: '期待するday値（あれば）'
     *   });
     * });
     *
     * 複数マッチする場合のテスト：
     * test('複数パターンマッチ', () => {
     *   const result = extractAndConvertPattern('複数パターンを含む文字列');
     *   expect(result).toHaveLength(2); // マッチした数
     *   expect(result[0]).toMatchObject({
     *     original: '1番目のマッチ',
     *     converted: '1番目の変換結果',
     *     day: 'day値'
     *   });
     *   expect(result[1]).toMatchObject({
     *     original: '2番目のマッチ',
     *     converted: '2番目の変換結果',
     *     day: 'day値'
     *   });
     * });
     *
     * ========================================
     */

    // TEST_CASES_PLACEHOLDER - ここに追加のテストケースを挿入してください
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
