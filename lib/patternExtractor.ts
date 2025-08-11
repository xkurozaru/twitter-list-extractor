import { PatternMatch } from "./types";

// 全角英数字を半角に変換
export function toHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
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
  const normalizedName = toHalfWidth(displayName);
  const matches: PatternMatch[] = [];

  // 日程情報を抽出
  const day = extractDay(displayName);

  // 複数のパターンを試行
  const patterns = [
    // パターン1: 東西南北 + エリア記号 + 数字 + ab (例: 西2す-16a, 東モ23b)
    /([東西南北][1-7]?)\s*([あ-んア-ンA-Za-z])\s*[-ー]?\s*([0-9]{1,2})\s*([ab]+)/gi,

    // パターン2: 東西南北 + 数字 + エリア記号 + 数字 + ab (例: 西2"こ"-28a)
    /([東西南北][1-7]?)\s*["']?([あ-んア-ンA-Za-z])["']?\s*[-ー]?\s*([0-9]{1,2})\s*([ab]+)/gi,

    // パターン3: エリア記号 + 数字 + ab のみ (例: す-16a, モ23b)
    /([あ-んア-ンA-Za-z])\s*[-ー]?\s*([0-9]{1,2})\s*([ab]+)/gi,

    // パターン4: 数字 + エリア記号 + 数字 + ab (例: 7Q-05b)
    /([0-9])\s*([A-Za-z])\s*[-ー]?\s*([0-9]{1,2})\s*([ab]+)/gi,

    // パターン5: アルファベット + 数字 + ab (例: Q-17b, R45b)
    /([A-Za-z])\s*[-ー]?\s*([0-9]{1,2})\s*([ab]+)/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0; // リセット
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(normalizedName)) !== null) {
      let converted = "";

      if (match.length === 5) {
        // パターン1,2: 4つのグループ
        const area = match[1]; // 東西南北
        const section = match[2]; // エリア記号
        const number = match[3].padStart(2, "0"); // 数字を2桁に
        const block = match[4]; // ab
        converted = `${section}${number}${block}`;
      } else if (match.length === 4) {
        // パターン3,5: 3つのグループ
        const section = match[1]; // エリア記号
        const number = match[2].padStart(2, "0"); // 数字を2桁に
        const block = match[3]; // ab
        converted = `${section}${number}${block}`;
      }

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

// CSVファイル生成（新しいカラム追加）
export function generateCSV(data: any[]): string {
  let csvContent = "\ufeff抽出文字,ユーザー表示名,ユーザーのリンクurl,日程\n";
  data.forEach((item) => {
    csvContent += `"${item.extracted}","${item.displayName}","${item.profileUrl}","${item.day}"\n`;
  });
  return csvContent;
}
