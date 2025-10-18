import { PDFDocument } from "pdf-lib";

/**
 * PDFの構造を分析する
 */
export async function analyzePdf(pdfBytes: Uint8Array | ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  console.log("=== PDF Analysis ===");
  console.log(`Page Count: ${pages.length}`);
  console.log(`Page Size: ${width} x ${height}`);
  console.log(`Rotation: ${firstPage.getRotation().angle}`);

  return {
    pageCount: pages.length,
    width,
    height,
    rotation: firstPage.getRotation().angle,
  };
}
