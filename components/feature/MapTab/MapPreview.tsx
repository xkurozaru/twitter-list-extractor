import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface MapPreviewProps {
  pdfData: Uint8Array;
  selectedPdfPath: string;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  pdfData,
  selectedPdfPath,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && pdfData) {
      try {
        // Uint8ArrayをBlobに変換
        const pdfBlob = new Blob([pdfData as BlobPart], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setError("");

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error("PDF URL生成エラー:", err);
        setError("PDFのURLを生成できませんでした");
      }
    }
  }, [isClient, pdfData]);

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

  if (error) {
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
          <Text color="red.500">{error}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        🗺️ プレビュー
      </Text>
      <Text fontSize="sm" color="gray.600" mb={4}>
        使用中のMap: <strong>{selectedPdfPath.split("/").pop()}</strong>
      </Text>
      <Box borderWidth={1} borderRadius="md" overflow="hidden" bg="gray.100">
        {/* ブラウザネイティブのPDF表示を使用 */}
        <iframe
          src={pdfUrl}
          width="100%"
          height="600px"
          style={{
            border: "none",
            display: "block",
          }}
          title="PDF Preview"
        />
      </Box>
    </Box>
  );
};
