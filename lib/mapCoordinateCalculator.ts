import { MapCoordinates, MapSpace } from "./types";

/**
 * コミケ配置場所文字列をパースしてMapSpaceオブジェクトに変換
 * 例: "西1-a-01a" -> { area: "西", hall: "1", block: "a", spaceNumber: "01", position: "a" }
 */
export function parseLocation(location: string): MapSpace | null {
  // パターン: エリア(東/西) + ホール番号 + "-" + ブロック + "-" + スペース番号 + 位置(a/b/ab)
  const pattern = /^([東西])(\d+)-([a-z])-(\d+)(a|b|ab)$/;
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
 * この関数は実際のPDFマップの構造に基づいて調整が必要です。
 * 現在は仮の実装で、実際の座標マッピングには
 * PDFの実際のレイアウトを分析して定数を調整する必要があります。
 */
export function calculateCoordinates(
  space: MapSpace,
  pdfWidth: number = 1031.81,
  _pdfHeight: number = 728.504
): MapCoordinates {
  // 基準座標とスペースサイズ（実際のPDFに合わせて調整が必要）
  const baseConfig = {
    // エリアごとの開始X座標
    areaStartX: {
      西: 50,
      東: pdfWidth / 2 + 50,
    },
    // ホールごとのY座標オフセット
    hallOffsetY: {
      "1": 100,
      "2": 250,
      "3": 400,
    },
    // ブロックごとのX座標オフセット（a, b, c...）
    blockOffsetX: 30,
    // スペースのサイズ
    spaceWidth: 20,
    spaceHeight: 15,
    // スペース間の間隔
    spaceGap: 2,
  };

  // エリアの基準X座標
  const areaX =
    baseConfig.areaStartX[space.area as keyof typeof baseConfig.areaStartX] ||
    50;

  // ホールのY座標オフセット
  const hallY =
    baseConfig.hallOffsetY[space.hall as keyof typeof baseConfig.hallOffsetY] ||
    100;

  // ブロック文字をインデックスに変換 (a=0, b=1, c=2...)
  const blockIndex = space.block.charCodeAt(0) - "a".charCodeAt(0);
  const blockX = blockIndex * baseConfig.blockOffsetX;

  // スペース番号から行位置を計算
  const spaceNum = parseInt(space.spaceNumber, 10);
  const rowOffset = Math.floor((spaceNum - 1) / 10); // 10スペースごとに改行
  const colOffset = (spaceNum - 1) % 10;

  // 最終的な座標を計算
  let x =
    areaX + blockX + colOffset * (baseConfig.spaceWidth + baseConfig.spaceGap);
  const y = hallY + rowOffset * (baseConfig.spaceHeight + baseConfig.spaceGap);

  // 位置(a/b/ab)に応じて幅と座標を調整
  let width = baseConfig.spaceWidth;

  if (space.position === "a") {
    // 左半分
    width = baseConfig.spaceWidth / 2;
  } else if (space.position === "b") {
    // 右半分
    width = baseConfig.spaceWidth / 2;
    x += width; // 右半分なので幅の半分だけX座標をずらす
  }
  // position === 'ab' の場合は全体なので width はそのまま

  return {
    x,
    y,
    width,
    height: baseConfig.spaceHeight,
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
