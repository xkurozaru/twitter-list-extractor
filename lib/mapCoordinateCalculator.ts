import { MapCoordinates, MapSpace } from "./types";

/**
 * コミケ配置場所文字列をパースしてMapSpaceオブジェクトに変換
 * 例: "西1-あ-01a" -> { area: "西", hall: "1", block: "あ", spaceNumber: "01", position: "a" }
 * 例: "南1-a-01a" -> { area: "南", hall: "1", block: "a", spaceNumber: "01", position: "a" }
 * 例: "東7-A-01a" -> { area: "東", hall: "7", block: "A", spaceNumber: "01", position: "a" }
 */
export function parseLocation(location: string): MapSpace | null {
  // パターン: エリア(東/西/南) + ホール番号 + "-" + ブロック + "-" + スペース番号 + 位置(a/b/ab)
  // ブロックは英字（大文字小文字）、ひらがな、カタカナに対応
  const pattern = /^([東西南])(\d+)-([a-zA-Zあ-んア-ン])-(\d+)(a|b|ab)$/;
  const match = location.match(pattern);

  if (!match) {
    return null;
  }

  const [, area, hall, block, spaceNumber, position] = match;

  return {
    location,
    area,
    hall,
    block,
    spaceNumber,
    position: position as "a" | "b" | "ab",
  };
}

/**
 * MapSpaceからPDF上の座標を計算
 *
 * コミケPDFマップの実際の構造に基づいた座標計算
 * PDFサイズ: B4横 (約1031 x 728pt)
 * マップは複数のブロックがグリッド状に配置されている
 */
export function calculateCoordinates(
  space: MapSpace,
  pdfWidth: number = 1031.81,
  pdfHeight: number = 728.504
): MapCoordinates {
  // PDFマップの余白とレイアウト定数
  const MARGIN_LEFT = 50;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 50;

  // 利用可能な描画領域
  const usableWidth = pdfWidth - MARGIN_LEFT * 2;
  const usableHeight = pdfHeight - MARGIN_TOP - MARGIN_BOTTOM;

  // ブロックとスペースの基本サイズ
  const SPACE_WIDTH = 8; // 1スペースの幅（pt）
  const SPACE_HEIGHT = 8; // 1スペースの高さ（pt）
  const BLOCK_GAP = 15; // ブロック間の間隔

  // 1ブロックあたりの列数と行数（典型的なコミケ配置）
  const SPACES_PER_ROW = 30; // 横に並ぶスペース数
  const ROWS_PER_BLOCK = 10; // ブロック内の行数

  // ブロック文字をインデックスに変換
  let blockIndex = 0;
  const blockChar = space.block;

  // 英字小文字 (a-z)
  if (blockChar >= "a" && blockChar <= "z") {
    blockIndex = blockChar.charCodeAt(0) - "a".charCodeAt(0);
  }
  // 英字大文字 (A-Z)
  else if (blockChar >= "A" && blockChar <= "Z") {
    blockIndex = blockChar.charCodeAt(0) - "A".charCodeAt(0);
  }
  // ひらがな (あ-ん)
  else if (blockChar >= "あ" && blockChar <= "ん") {
    blockIndex = blockChar.charCodeAt(0) - "あ".charCodeAt(0);
  }
  // カタカナ (ア-ン)
  else if (blockChar >= "ア" && blockChar <= "ン") {
    blockIndex = blockChar.charCodeAt(0) - "ア".charCodeAt(0);
  }

  // ホール番号によるY座標オフセット
  const hallNum = parseInt(space.hall, 10);
  let hallYOffset = 0;

  // 南・西・東で異なる配置になる可能性を考慮
  if (space.area === "南") {
    // 南1,2ホール: 1ページに2ホール分
    hallYOffset = (hallNum - 1) * (usableHeight / 2);
  } else if (space.area === "西") {
    // 西1,2ホール: 1ページに2ホール分
    hallYOffset = (hallNum - 1) * (usableHeight / 2);
  } else if (space.area === "東") {
    if (hallNum === 7) {
      // 東7ホール: 1ページ全体
      hallYOffset = 0;
    } else {
      // 東456ホール: 1ページに3ホール分
      hallYOffset = (hallNum - 4) * (usableHeight / 3);
    }
  }

  // ブロックの配置（横方向）
  // 通常、ブロックは横に並んで配置される（4〜5ブロックごとに改行）
  const BLOCKS_PER_ROW_COUNT = 5;
  const blockRow = Math.floor(blockIndex / BLOCKS_PER_ROW_COUNT);
  const blockCol = blockIndex % BLOCKS_PER_ROW_COUNT;

  const blockWidth = SPACE_WIDTH * SPACES_PER_ROW + BLOCK_GAP;
  const blockHeight = SPACE_HEIGHT * ROWS_PER_BLOCK + BLOCK_GAP;

  // スペース番号から位置を計算
  const spaceNum = parseInt(space.spaceNumber, 10);
  const spaceRow = Math.floor((spaceNum - 1) / SPACES_PER_ROW);
  const spaceCol = (spaceNum - 1) % SPACES_PER_ROW;

  // 最終座標を計算
  let x = MARGIN_LEFT + blockCol * blockWidth + spaceCol * SPACE_WIDTH;

  const y =
    MARGIN_TOP + hallYOffset + blockRow * blockHeight + spaceRow * SPACE_HEIGHT;

  // 位置(a/b/ab)に応じて幅と座標を調整
  let width = SPACE_WIDTH;

  if (space.position === "a") {
    // 左半分
    width = SPACE_WIDTH / 2;
  } else if (space.position === "b") {
    // 右半分
    width = SPACE_WIDTH / 2;
    x += width; // 右半分なので幅の半分だけX座標をずらす
  }
  // position === 'ab' の場合は全体なので width はそのまま

  return {
    x,
    y,
    width,
    height: SPACE_HEIGHT,
  };
}

/**
 * 複数の配置場所から座標を一括計算
 */
export function calculateMultipleCoordinates(
  locations: string[],
  pdfWidth?: number,
  pdfHeight?: number
): Array<{ location: string; coordinates: MapCoordinates | null }> {
  return locations.map((location) => {
    const space = parseLocation(location);
    if (!space) {
      return { location, coordinates: null };
    }
    const coordinates = calculateCoordinates(space, pdfWidth, pdfHeight);
    return { location, coordinates };
  });
}
