import { extractAndConvertPattern } from "../lib/patternExtractor";

describe(extractAndConvertPattern, () => {
  test("シゃモナへ゛", () => {
    const result = extractAndConvertPattern("シゃモナへ゛", "C106");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "",
      converted: "",
      day: "",
    });
  });

  test("芹沢@土曜日西2さ41", () => {
    const result = extractAndConvertPattern("芹沢@土曜日西2さ41", "C106");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "",
      converted: "",
      day: "1日目",
    });
  });

  test("ふらら 土曜日 西つ 13b", () => {
    const result = extractAndConvertPattern("ふらら 土曜日 西つ 13b", "C106");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "つ 13b",
      converted: "つ13b",
      day: "1日目",
    });
  });

  test("ろりちゃーはん2杯目🔞C106土曜 西2す-16a", () => {
    const result = extractAndConvertPattern(
      "ろりちゃーはん2杯目🔞C106土曜 西2す-16a",
      "C106"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "す-16a",
      converted: "す16a",
      day: "1日目",
    });
  });

  test("微熱2℃ コミケ【土曜日南“ｓ”05a】", () => {
    const result = extractAndConvertPattern(
      "微熱2℃ コミケ【土曜日南“ｓ”05a】",
      "C106"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "“ｓ”05a",
      converted: "s05a",
      day: "1日目",
    });
  });

  test("竹輪@C106 1日目南 “ｂ”ブロック－06a", () => {
    const result = extractAndConvertPattern(
      "竹輪@C106 1日目南 “ｂ”ブロック－06a",
      "C106"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: " “ｂ”ブロック－06a",
      converted: "b06a",
      day: "1日目",
    });
  });

  test("栗芋パイ　日曜東Q‐23b", () => {
    const result = extractAndConvertPattern("栗芋パイ　日曜東Q‐23b", "C106");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "Q‐23b",
      converted: "Q23b",
      day: "2日目",
    });
  });

  test("カネダイチ@土曜日（西）''に''14b", () => {
    const result = extractAndConvertPattern(
      "カネダイチ@土曜日（西）''に''14b",
      "C106"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "''に''14b",
      converted: "に14b",
      day: "1日目",
    });
  });

  test("イロリ@C106土曜日“西すｰ18b”", () => {
    const result = extractAndConvertPattern(
      "イロリ@C106土曜日“西すｰ18b”",
      "C106"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "すｰ18b",
      converted: "す18b",
      day: "1日目",
    });
  });

  test("うこ🔞1日目南1ｒ17ab", () => {
    const result = extractAndConvertPattern("うこ🔞1日目南1ｒ17ab", "C106");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "ｒ17ab",
      converted: "r17ab",
      day: "1日目",
    });
  });

  test("キノキング@土西す14b／日東Q46a", () => {
    const result = extractAndConvertPattern(
      "キノキング@土西す14b／日東Q46a",
      "C106"
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      original: "す14b",
      converted: "す14b",
      day: "1日目",
    });
    expect(result[1]).toMatchObject({
      original: "Q46a",
      converted: "Q46a",
      day: "2日目",
    });
  });

  test("kozi@本日新刊発売C107一日目南1t09a二日目東5ノ32b DL販売半額&男の娘グッズCP中", () => {
    const result = extractAndConvertPattern(
      "kozi@本日新刊発売C107一日目南1t09a二日目東5ノ32b DL販売半額&男の娘グッズCP中",
      "C107"
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      original: "t09a",
      converted: "t09a",
      day: "1日目",
    });
    expect(result[1]).toMatchObject({
      original: "ノ32b",
      converted: "ノ32b",
      day: "2日目",
    });
  });

  test("てんぴぼし＠C107(火)東ヨ37b", () => {
    const result = extractAndConvertPattern(
      "てんぴぼし＠C107(火)東ヨ37b",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "ヨ37b",
      converted: "ヨ37b",
      day: "1日目",
    });
  });

  test("racer@C107水曜日 東Ｊ-25b", () => {
    const result = extractAndConvertPattern(
      "racer@C107水曜日 東Ｊ-25b",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "Ｊ-25b",
      converted: "J25b",
      day: "2日目",
    });
  });

  test("生はむエ駄肉🥩🥜火東ホ41a/水東モ19a", () => {
    const result = extractAndConvertPattern(
      "生はむエ駄肉🥩🥜火東ホ41a/水東モ19a",
      "C107"
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      original: "ホ41a",
      converted: "ホ41a",
      day: "1日目",
    });
    expect(result[1]).toMatchObject({
      original: "モ19a",
      converted: "モ19a",
      day: "2日目",
    });
  });

  test("かねた＠C107欠席", () => {
    const result = extractAndConvertPattern("かねた＠C107欠席", "C107");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "",
      converted: "",
      day: "欠席",
    });
  });

  test("宮野木＠C107二日目・東ヤ－01a", () => {
    const result = extractAndConvertPattern(
      "宮野木＠C107二日目・東ヤ－01a",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "ヤ－01a",
      converted: "ヤ01a",
      day: "2日目",
    });
  });

  test(`𝙁𝙖𝙩𝙖𝙖𝙖 | 火曜東" ア "69ab`, () => {
    const result = extractAndConvertPattern(
      `𝙁𝙖𝙩𝙖𝙖𝙖 | 火曜東" ア "69ab`,
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: `" ア "69ab`,
      converted: "ア69ab",
      day: "1日目",
    });
  });

  test("グンプウ C107 1日目東厶33-a", () => {
    const result = extractAndConvertPattern(
      "グンプウ C107 1日目東厶33-a",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "厶33-a",
      converted: "ム33a",
      day: "1日目",
    });
  });

  test("ミリカ@C107一日目東ﾑ48a", () => {
    const result = extractAndConvertPattern("ミリカ@C107一日目東ﾑ48a", "C107");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "ﾑ48a",
      converted: "ム48a",
      day: "1日目",
    });
  });

  test("モ誰@C107火曜日/東/ア-48ab", () => {
    const result = extractAndConvertPattern(
      "モ誰@C107火曜日/東/ア-48ab",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "ア-48ab",
      converted: "ア48ab",
      day: "1日目",
    });
  });

  test("新屋敷◆冬コミ@東ヘ09b(１日目）東マ05b（２日目）", () => {
    const result = extractAndConvertPattern(
      "新屋敷◆冬コミ@東ヘ09b(１日目）東マ05b（２日目）",
      "C107"
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      original: "ヘ09b",
      converted: "ヘ09b",
      day: "1日目",
    });
    expect(result[1]).toMatchObject({
      original: "マ05b",
      converted: "マ05b",
      day: "2日目",
    });
  });

  test("コザ@二日目・東7・Ｉ-48b　※垢解凍しました", () => {
    const result = extractAndConvertPattern(
      "コザ@二日目・東7・Ｉ-48b　※垢解凍しました",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "Ｉ-48b",
      converted: "I48b",
      day: "2日目",
    });
  });

  test("むにもに@C107 1日目(12/30)-東４『ヤ』64b", () => {
    const result = extractAndConvertPattern(
      "むにもに@C107 1日目(12/30)-東４『ヤ』64b",
      "C107"
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      original: "『ヤ』64b",
      converted: "ヤ64b",
      day: "1日目",
    });
  });
});
