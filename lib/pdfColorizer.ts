import { PDFDocument, rgb } from "pdf-lib";
import { calculateCoordinates, parseLocation } from "./mapCoordinateCalculator";

export interface ColorConfig {
  r: number;
  g: number;
  b: number;
  opacity?: number;
}

const DEFAULT_COLOR: ColorConfig = {
  r: 1,
  g: 0.8,
  b: 0.2,
  opacity: 0.5,
};

/**
 * PDFに配置場所を色付けする
 * @param pdfPath PDFファイルのパス（ブラウザの場合はURL）
 * @param locations 色付けする配置場所の配列（例: ["西1-a-01a", "東2-b-05b"]）
 * @param color 色の設定（デフォルト: 黄色、半透明）
 * @param debugMode デバッグモード（trueの場合、より大きく目立つマーカーを描画）
 * @returns 色付けされたPDFのUint8Array
 */
export async function colorizeMap(
  pdfBytes: Uint8Array | ArrayBuffer,
  locations: string[],
  color: ColorConfig = DEFAULT_COLOR,
  debugMode: boolean = true // デフォルトでデバッグモードON
): Promise<Uint8Array> {
  // PDFを読み込む
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  console.log(`[PDF Info] Size: ${width} x ${height} pt`);

  // 各配置場所を色付け
  for (const location of locations) {
    const space = parseLocation(location);
    if (!space) {
      console.warn(`Invalid location format: ${location}`);
      continue;
    }

    const coords = calculateCoordinates(space, width, height);

    // デバッグ用ログ
    console.log(`[Colorize] ${location}:`, {
      space,
      pdfSize: { width, height },
      coords,
    });

    // PDF座標系は下から上なので、Y座標を反転
    const pdfY = height - coords.y - coords.height;

    if (debugMode) {
      // デバッグモード: より大きく目立つマーカーを描画
      const debugSize = 20; // デバッグ用の大きなマーカー
      firstPage.drawRectangle({
        x: coords.x - 5,
        y: pdfY - 5,
        width: debugSize,
        height: debugSize,
        color: rgb(1, 0, 0), // 赤色
        opacity: 0.7,
        borderColor: rgb(0, 0, 0),
        borderWidth: 2,
      });

      // 座標情報をテキストで表示
      firstPage.drawText(
        `${space.block}${space.spaceNumber}${space.position}`,
        {
          x: coords.x + debugSize + 2,
          y: pdfY,
          size: 8,
          color: rgb(0, 0, 0),
        }
      );
    } else {
      // 通常モード: 実際のスペースサイズで描画
      firstPage.drawRectangle({
        x: coords.x,
        y: pdfY,
        width: coords.width,
        height: coords.height,
        color: rgb(color.r, color.g, color.b),
        opacity: color.opacity || 0.5,
        borderColor: rgb(color.r * 0.8, color.g * 0.8, color.b * 0.8),
        borderWidth: 1,
      });
    }
  }

  // PDFをバイト配列として保存
  const pdfBytesModified = await pdfDoc.save();
  return pdfBytesModified;
}

/**
 * ブラウザでPDFファイルを読み込む
 * @param file File オブジェクト
 * @returns ArrayBuffer
 */
export async function loadPdfFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * URLからPDFを読み込む
 * @param url PDFのURL
 * @returns ArrayBuffer
 */
export async function loadPdfFromUrl(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * 色付けされたPDFをダウンロード
 * @param pdfBytes PDFのバイト配列
 * @param filename ダウンロードするファイル名
 */
export function downloadPdf(
  pdfBytes: Uint8Array,
  filename: string = "colorized-map.pdf"
): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
