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
 * 各ホールごとに異なる配置パターンを考慮
 */
export function calculateCoordinates(
  space: MapSpace,
  _pdfWidth: number = 1031.81,
  _pdfHeight: number = 728.504
): MapCoordinates {
  // ホールごとの設定を定義
  const hallConfigs = getHallConfig(space.area, space.hall);

  // ブロック文字をインデックスに変換
  const absoluteBlockIndex = getBlockIndex(space.block);
  
  // ホール固有のオフセットを適用（南2の場合、k=10から始まるが、0から計算すべき）
  const blockIndex = absoluteBlockIndex - hallConfigs.blockIndexOffset;

  // ブロックのグリッド位置を計算
  const blockRow = Math.floor(blockIndex / hallConfigs.blocksPerRow);
  const blockCol = blockIndex % hallConfigs.blocksPerRow;

  // スペース番号から位置を計算
  const spaceNum = parseInt(space.spaceNumber, 10);
  const spaceRow = Math.floor((spaceNum - 1) / hallConfigs.spacesPerRow);
  const spaceCol = (spaceNum - 1) % hallConfigs.spacesPerRow;

  // 基準座標を計算
  let x =
    hallConfigs.startX +
    blockCol * (hallConfigs.blockWidth + hallConfigs.blockGapX) +
    spaceCol * hallConfigs.spaceWidth;

  const y =
    hallConfigs.startY +
    blockRow * (hallConfigs.blockHeight + hallConfigs.blockGapY) +
    spaceRow * hallConfigs.spaceHeight;

  // 位置(a/b/ab)に応じて幅と座標を調整
  let width = hallConfigs.spaceWidth;

  if (space.position === "a") {
    // 左半分
    width = hallConfigs.spaceWidth / 2;
  } else if (space.position === "b") {
    // 右半分
    width = hallConfigs.spaceWidth / 2;
    x += width;
  }

  return {
    x,
    y,
    width,
    height: hallConfigs.spaceHeight,
  };
}

/**
 * ブロック文字をインデックスに変換
 */
function getBlockIndex(blockChar: string): number {
  // 英字小文字 (a-z)
  if (blockChar >= "a" && blockChar <= "z") {
    return blockChar.charCodeAt(0) - "a".charCodeAt(0);
  }
  // 英字大文字 (A-Z)
  if (blockChar >= "A" && blockChar <= "Z") {
    return blockChar.charCodeAt(0) - "A".charCodeAt(0);
  }
  // ひらがな (あ-ん)
  if (blockChar >= "あ" && blockChar <= "ん") {
    return blockChar.charCodeAt(0) - "あ".charCodeAt(0);
  }
  // カタカナ (ア-ン)
  if (blockChar >= "ア" && blockChar <= "ン") {
    return blockChar.charCodeAt(0) - "ア".charCodeAt(0);
  }
  return 0;
}

/**
 * ホールごとの配置設定を取得
 *
 * 注意: これらの値は実際のPDFに合わせて調整が必要です
 * PDFのPNG画像を確認して、各値を微調整してください
 */
function getHallConfig(area: string, hall: string) {
  const hallKey = `${area}${hall}`;

  // B4サイズ (1031.81 x 728.504 pt)

  // デフォルト設定（南12ホール用の仮設定）
  const defaultConfig = {
    startX: 60, // 左マージン
    startY: 80, // 上マージン
    spaceWidth: 6, // 1スペースの幅
    spaceHeight: 6, // 1スペースの高さ
    blockWidth: 180, // 1ブロックの幅
    blockHeight: 60, // 1ブロックの高さ
    blockGapX: 20, // ブロック間の横間隔
    blockGapY: 20, // ブロック間の縦間隔
    blocksPerRow: 5, // 1行あたりのブロック数
    spacesPerRow: 30, // 1ブロック内の1行あたりのスペース数
    blockIndexOffset: 0, // ブロックインデックスのオフセット
  };

  // ホールごとの個別設定
  const configs: Record<string, typeof defaultConfig> = {
    // 南1・2ホール (a-t ブロック)
    南1: {
      ...defaultConfig,
      startY: 80, // 南1は上部
      blockIndexOffset: 0, // a=0 から開始
    },
    南2: {
      ...defaultConfig,
      startY: 400, // 南2は下部
      blockIndexOffset: 10, // k=10 だが、0から計算するためオフセット10
    },

    // 西1・2ホール (あ-め ブロック)
    西1: {
      ...defaultConfig,
      startY: 80,
      blockIndexOffset: 0, // あ=0 から開始
      // ひらがなブロックの配置は異なる可能性あり
    },
    西2: {
      ...defaultConfig,
      startY: 400,
      blockIndexOffset: 16, // ち=16（あから数えて）から開始
    },

    // 東7ホール (A-W ブロック)
    東7: {
      ...defaultConfig,
      startY: 80,
      blockIndexOffset: 0, // A=0 から開始
      // 東7は1ページ全体を使用
    },

    // 東4・5・6ホール (ア-ヨ ブロック)
    東4: {
      ...defaultConfig,
      startY: 80, // 上部
      blockIndexOffset: 0, // ア=0 から開始
    },
    東5: {
      ...defaultConfig,
      startY: 300, // 中部
      blockIndexOffset: 13, // セ=13（アから数えて）から開始
    },
    東6: {
      ...defaultConfig,
      startY: 520, // 下部
      blockIndexOffset: 25, // ハ=25（アから数えて）から開始
    },
  };

  return configs[hallKey] || defaultConfig;
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
