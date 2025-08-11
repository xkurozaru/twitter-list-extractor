import { PatternMatch } from "./types";

// 全角英数字を半角に変換
export function toHalfWidth(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
}

// パターンマッチングと変換
export function extractAndConvertPattern(displayName: string): PatternMatch[] {
  const normalizedName = toHalfWidth(displayName);
  const pattern = /([あ-んA-Za-z])([-ー]?)([0-9]{2})([ab]+)/g;
  const matches: PatternMatch[] = [];

  let match;
  while ((match = pattern.exec(normalizedName)) !== null) {
    const converted = match[1] + match[3] + match[4];
    matches.push({
      original: match[0],
      converted: converted,
      startIndex: match.index,
    });
  }

  return matches;
}

// CSVファイル生成
export function generateCSV(data: any[]): string {
  let csvContent = "\ufeff抽出文字,ユーザー表示名,ユーザーのリンクurl\n";
  data.forEach((item) => {
    csvContent += `"${item.extracted}","${item.displayName}","${item.profileUrl}"\n`;
  });
  return csvContent;
}
