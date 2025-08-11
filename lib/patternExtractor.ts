import { PatternMatch } from "./types";

// 全角英数字を半角に変換
export function toHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
}

// "ブロック"や"エリア"などの冗長な文字列を削除
export function removeRedundantStrings(str: string): string {
  return str.replace(/(ブロック|エリア)/g, "");
}

// 日程情報を抽出・正規化（複数日程に対応）
export function extractDay(displayName: string): string {
  const normalizedName = toHalfWidth(displayName);
  const days: string[] = [];

  // より具体的なパターンを先に評価する

  // 土曜日・土曜を1日目に変換
  if (/土曜日/i.test(normalizedName) || /土曜/i.test(normalizedName)) {
    days.push("1日目");
  }

  // 日曜日・日曜を2日目に変換
  if (/日曜日/i.test(normalizedName) || /日曜/i.test(normalizedName)) {
    days.push("2日目");
  }

  // 明示的な1日目・2日目表記
  if (/[1１一]日目/i.test(normalizedName)) {
    days.push("1日目");
  }

  if (/[2２二]日目/i.test(normalizedName)) {
    days.push("2日目");
  }

  // 単独の「土」「日」（ただし曜日以外のコンテキスト）
  // 前後に文字がない、または記号に囲まれている場合のみ
  if (/(?:^|[^曜])土(?:[^曜]|$)/i.test(normalizedName)) {
    days.push("1日目");
  }

  if (/(?:^|[^曜])日(?:[^曜目]|$)/i.test(normalizedName)) {
    days.push("2日目");
  }

  // 重複を除去してソート
  const uniqueDays = [...new Set(days)].sort();

  if (uniqueDays.length === 0) {
    return ""; // 不明
  } else if (uniqueDays.length === 1) {
    return uniqueDays[0];
  } else {
    // 複数日程の場合は「両日」として返す
    return "両日";
  }
}

// コミケ配置場所のパターンマッチングと変換
export function extractAndConvertPattern(displayName: string): PatternMatch[] {
  const normalizedName = removeRedundantStrings(toHalfWidth(displayName));
  const matches: PatternMatch[] = [];

  // 日程情報を抽出
  const day = extractDay(displayName);

  // 複数のパターンを試行
  const patterns = [
    // パターン1: ブロック記号 + 数字 + ab (例: "こ"-28a)
    /["'“”]?([あ-んア-ンA-Za-z])["'“”]?\s*[-ー_－]?\s*([0-9]{1,2})\s*([ab]+)/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0; // リセット
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(normalizedName)) !== null) {
      let converted = "";

      const block = match[1]; // ブロック記号
      const number = match[2].padStart(2, "0"); // 数字を2桁に
      const ab = match[3]; // ab
      converted = `${block}${number}${ab}`;

      // 重複チェック
      const isDuplicate = matches.some(
        (m) =>
          m.converted === converted &&
          match &&
          Math.abs(m.startIndex - match.index) < 10
      );

      if (!isDuplicate && converted && match) {
        matches.push({
          original: match[0],
          converted: converted,
          startIndex: match.index,
          day: day,
        });
      }
    }
  }

  // マッチしなかった場合は空の結果を返す
  if (matches.length === 0) {
    return [
      {
        original: "",
        converted: "",
        startIndex: -1,
        day: day,
      },
    ];
  }

  return matches;
}

// CSVフィールド内の二重引用符をエスケープ
function escapeCSVField(field: string): string {
  if (!field) return "";
  return field.replace(/"/g, '""');
}

// CSVファイル生成
export function generateCSV(data: any[]): string {
  let csvContent = "\ufeff日程,スペース,ペンネーム,twitter\n";
  data.forEach((item) => {
    const day = escapeCSVField(item.day || "");
    const extracted = escapeCSVField(item.extracted || "");
    const displayName = escapeCSVField(item.displayName || "");
    const profileUrl = escapeCSVField(item.profileUrl || "");
    csvContent += `"${day}","${extracted}","${displayName}","${profileUrl}"\n`;
  });
  return csvContent;
}
