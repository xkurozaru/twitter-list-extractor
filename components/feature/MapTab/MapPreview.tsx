import { Box, Text } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// react-pdfを動的インポートしてSSRを無効化
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
});

interface MapPreviewProps {
  pdfData: Uint8Array;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ pdfData }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // PDF.jsのworkerを設定（クライアントサイドのみ）
    if (typeof window !== "undefined") {
      import("react-pdf").then((pdfjs) => {
        pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.pdfjs.version}/pdf.worker.min.js`;
      });
    }
  }, []);

  useEffect(() => {
    if (isClient && pdfData) {
      // Uint8ArrayをBlobに変換
      const pdfBlob = new Blob([pdfData as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [isClient, pdfData]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  if (!isClient || !pdfUrl) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          🗺️ プレビュー
        </Text>
        <Box
          borderWidth={1}
          borderRadius="md"
          p={8}
          display="flex"
          justifyContent="center"
          bg="gray.100"
        >
          <Text>読み込み中...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        🗺️ プレビュー
      </Text>
      <Box
        borderWidth={1}
        borderRadius="md"
        overflow="auto"
        maxH="600px"
        display="flex"
        justifyContent="center"
        bg="gray.100"
        p={4}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<Text>PDFを読み込み中...</Text>}
          error={<Text color="red.500">PDFの読み込みに失敗しました</Text>}
        >
          <Page
            pageNumber={1}
            width={800}
            loading={<Text>ページを読み込み中...</Text>}
          />
        </Document>
      </Box>
      {numPages > 1 && (
        <Text fontSize="sm" color="gray.600" mt={2}>
          ※ {numPages}ページ中1ページ目を表示しています
        </Text>
      )}
    </Box>
  );
};
