/**
 * コミケのブロックとホールの対応マッピング
 * PDFマップの構造に基づいて、ブロック記号から自動的にホール情報を推定
 *
 * s12 -> 南12ホール -> a ~ t ブロック
 * w12 -> 西12ホール -> あ ~ め ブロック
 * e7 -> 東7ホール -> A ~ W ブロック
 * e456 -> 東456ホール -> ア ~ ヨ ブロック
 */

export interface HallBlockMapping {
  block: string; // ブロック記号（a, b, あ, イ など）
  area: "東" | "西" | "南"; // エリア
  hall: string; // ホール番号（1, 2, 4, 5, 6, 7 など）
  day?: string; // 開催日（オプション）
}

/**
 * ブロックとホールの対応表
 */
export const HALL_BLOCK_MAPPINGS: HallBlockMapping[] = [
  // 南1・2ホール（a〜tブロック）
  { block: "a", area: "南", hall: "1" },
  { block: "b", area: "南", hall: "1" },
  { block: "c", area: "南", hall: "1" },
  { block: "d", area: "南", hall: "1" },
  { block: "e", area: "南", hall: "1" },
  { block: "f", area: "南", hall: "1" },
  { block: "g", area: "南", hall: "1" },
  { block: "h", area: "南", hall: "1" },
  { block: "i", area: "南", hall: "1" },
  { block: "j", area: "南", hall: "1" },
  { block: "k", area: "南", hall: "2" },
  { block: "l", area: "南", hall: "2" },
  { block: "m", area: "南", hall: "2" },
  { block: "n", area: "南", hall: "2" },
  { block: "o", area: "南", hall: "2" },
  { block: "p", area: "南", hall: "2" },
  { block: "q", area: "南", hall: "2" },
  { block: "r", area: "南", hall: "2" },
  { block: "s", area: "南", hall: "2" },
  { block: "t", area: "南", hall: "2" },

  // 西1・2ホール（あ〜めブロック）
  { block: "あ", area: "西", hall: "1" },
  { block: "い", area: "西", hall: "1" },
  { block: "う", area: "西", hall: "1" },
  { block: "え", area: "西", hall: "1" },
  { block: "お", area: "西", hall: "1" },
  { block: "か", area: "西", hall: "1" },
  { block: "き", area: "西", hall: "1" },
  { block: "く", area: "西", hall: "1" },
  { block: "け", area: "西", hall: "1" },
  { block: "こ", area: "西", hall: "1" },
  { block: "さ", area: "西", hall: "1" },
  { block: "し", area: "西", hall: "1" },
  { block: "す", area: "西", hall: "1" },
  { block: "せ", area: "西", hall: "1" },
  { block: "そ", area: "西", hall: "1" },
  { block: "た", area: "西", hall: "1" },
  { block: "ち", area: "西", hall: "2" },
  { block: "つ", area: "西", hall: "2" },
  { block: "て", area: "西", hall: "2" },
  { block: "と", area: "西", hall: "2" },
  { block: "な", area: "西", hall: "2" },
  { block: "に", area: "西", hall: "2" },
  { block: "ぬ", area: "西", hall: "2" },
  { block: "ね", area: "西", hall: "2" },
  { block: "の", area: "西", hall: "2" },
  { block: "は", area: "西", hall: "2" },
  { block: "ひ", area: "西", hall: "2" },
  { block: "ふ", area: "西", hall: "2" },
  { block: "へ", area: "西", hall: "2" },
  { block: "ほ", area: "西", hall: "2" },
  { block: "ま", area: "西", hall: "2" },
  { block: "み", area: "西", hall: "2" },
  { block: "む", area: "西", hall: "2" },
  { block: "め", area: "西", hall: "2" },

  // 東7ホール（A〜Wブロック）
  { block: "A", area: "東", hall: "7" },
  { block: "B", area: "東", hall: "7" },
  { block: "C", area: "東", hall: "7" },
  { block: "D", area: "東", hall: "7" },
  { block: "E", area: "東", hall: "7" },
  { block: "F", area: "東", hall: "7" },
  { block: "G", area: "東", hall: "7" },
  { block: "H", area: "東", hall: "7" },
  { block: "I", area: "東", hall: "7" },
  { block: "J", area: "東", hall: "7" },
  { block: "K", area: "東", hall: "7" },
  { block: "L", area: "東", hall: "7" },
  { block: "M", area: "東", hall: "7" },
  { block: "N", area: "東", hall: "7" },
  { block: "O", area: "東", hall: "7" },
  { block: "P", area: "東", hall: "7" },
  { block: "Q", area: "東", hall: "7" },
  { block: "R", area: "東", hall: "7" },
  { block: "S", area: "東", hall: "7" },
  { block: "T", area: "東", hall: "7" },
  { block: "U", area: "東", hall: "7" },
  { block: "V", area: "東", hall: "7" },
  { block: "W", area: "東", hall: "7" },

  // 東4・5・6ホール（ア〜ヨブロック）
  { block: "ア", area: "東", hall: "4" },
  { block: "イ", area: "東", hall: "4" },
  { block: "ウ", area: "東", hall: "4" },
  { block: "エ", area: "東", hall: "4" },
  { block: "オ", area: "東", hall: "4" },
  { block: "カ", area: "東", hall: "4" },
  { block: "キ", area: "東", hall: "4" },
  { block: "ク", area: "東", hall: "4" },
  { block: "ケ", area: "東", hall: "4" },
  { block: "コ", area: "東", hall: "4" },
  { block: "サ", area: "東", hall: "4" },
  { block: "シ", area: "東", hall: "4" },
  { block: "ス", area: "東", hall: "4" },
  { block: "セ", area: "東", hall: "5" },
  { block: "ソ", area: "東", hall: "5" },
  { block: "タ", area: "東", hall: "5" },
  { block: "チ", area: "東", hall: "5" },
  { block: "ツ", area: "東", hall: "5" },
  { block: "テ", area: "東", hall: "5" },
  { block: "ト", area: "東", hall: "5" },
  { block: "ナ", area: "東", hall: "5" },
  { block: "ニ", area: "東", hall: "5" },
  { block: "ヌ", area: "東", hall: "5" },
  { block: "ネ", area: "東", hall: "5" },
  { block: "ノ", area: "東", hall: "5" },
  { block: "ハ", area: "東", hall: "6" },
  { block: "ヒ", area: "東", hall: "6" },
  { block: "フ", area: "東", hall: "6" },
  { block: "ヘ", area: "東", hall: "6" },
  { block: "ホ", area: "東", hall: "6" },
  { block: "マ", area: "東", hall: "6" },
  { block: "ミ", area: "東", hall: "6" },
  { block: "ム", area: "東", hall: "6" },
  { block: "メ", area: "東", hall: "6" },
  { block: "モ", area: "東", hall: "6" },
  { block: "ヤ", area: "東", hall: "6" },
  { block: "ユ", area: "東", hall: "6" },
  { block: "ヨ", area: "東", hall: "6" },
];

/**
 * ブロック記号からホール情報を推定
 * @param block ブロック記号（a, B, あ, イ など）
 * @returns ホール情報、または不明な場合はデフォルト値
 */
export function inferHallFromBlock(block: string): {
  area: "東" | "西" | "南";
  hall: string;
} {
  // 正規化（大文字小文字、全角半角）
  const normalizedBlock = normalizeBlock(block);

  // マッピングテーブルから検索
  const mapping = HALL_BLOCK_MAPPINGS.find(
    (m) => normalizeBlock(m.block) === normalizedBlock
  );

  if (mapping) {
    return { area: mapping.area, hall: mapping.hall };
  }

  // マッピングが見つからない場合、パターンから推定
  // 英小文字 → 南12
  if (/^[a-t]$/.test(block)) {
    const code = block.charCodeAt(0);
    if (code >= 97 && code <= 106) return { area: "南", hall: "1" }; // a-j
    if (code >= 107 && code <= 116) return { area: "南", hall: "2" }; // k-t
    return { area: "南", hall: "1" }; // デフォルト
  }

  // ひらがな → 西12
  if (/^[あ-た]$/.test(block)) {
    return { area: "西", hall: "1" };
  }
  if (/^[ち-め]$/.test(block)) {
    return { area: "西", hall: "2" };
  }

  // 英大文字 → 東7
  if (/^[A-W]$/.test(block)) {
    return { area: "東", hall: "7" };
  }

  // カタカナ → 東456
  if (/^[ア-ス]$/.test(block)) {
    return { area: "東", hall: "4" };
  }
  if (/^[セ-ノ]$/.test(block)) {
    return { area: "東", hall: "5" };
  }
  if (/^[ハ-ヨ]$/.test(block)) {
    return { area: "東", hall: "6" };
  }

  // デフォルト: 西1
  return { area: "西", hall: "1" };
}

/**
 * ブロック記号を正規化（大文字小文字、全角半角を統一）
 */
function normalizeBlock(block: string): string {
  // 全角英字を半角に変換
  let normalized = block.replace(/[Ａ-Ｚａ-ｚ]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });

  return normalized;
}

/**
 * PDFファイルパスを決定
 * @param area エリア（東/西/南）
 * @param hall ホール番号
 * @returns PDFファイルのパス
 */
export function getPdfPath(area: "東" | "西" | "南", hall: string): string {
  // 南ホール（1・2日目）
  if (area === "南" && (hall === "1" || hall === "2" || hall === "12")) {
    return "/C106Map_s12_B4.pdf";
  }

  // 西ホール（1・2日目）
  if (area === "西" && (hall === "1" || hall === "2" || hall === "12")) {
    return "/C106Map_w12_B4.pdf";
  }

  // 東7ホール
  if (area === "東" && hall === "7") {
    return "/C106Map_e7_B4.pdf";
  }

  // 東ホール（4・5・6）
  if (area === "東" && ["4", "5", "6", "456"].includes(hall)) {
    return "/C106Map_e456_B4.pdf";
  }

  // デフォルト: 西12
  return "/C106Map_w12_B4.pdf";
}

/**
 * 短縮形の配置場所から完全な配置場所を構築
 * @param extracted 短縮形（例: "a01a", "B05b", "あ23ab"）
 * @returns 完全な配置場所（例: "西1-a-01a", "東4-B-05b"）
 */
export function buildFullLocation(extracted: string): string | null {
  // パターン: ブロック + 数字2桁 + 位置(a/b/ab)
  const pattern = /^([a-zA-Zあ-んア-ン])(\d{2})([ab]{1,2})$/;
  const match = extracted.match(pattern);

  if (!match) {
    return null;
  }

  const [, block, number, position] = match;
  const { area, hall } = inferHallFromBlock(block);

  // 完全な配置場所を構築
  return `${area}${hall}-${block}-${number}${position}`;
}
