import { toaster } from "@/components/ui/toaster";
import { colorizeMap, loadPdfFile } from "@/lib/pdfColorizer";
import {
  Box,
  Button,
  FileUpload,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

interface MapUploadFormProps {
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  locations: string[];
  setColorizedPdf: (pdf: Uint8Array | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export const MapUploadForm: React.FC<MapUploadFormProps> = ({
  pdfFile,
  setPdfFile,
  locations,
  setColorizedPdf,
  isProcessing,
  setIsProcessing,
}) => {
  const handleFileAccept = (details: { files: File[] }) => {
    const file = details.files[0];
    if (file) {
      setPdfFile(file);
      setColorizedPdf(null); // 新しいファイル選択時は前の結果をクリア
    }
  };

  const handleColorize = async () => {
    if (!pdfFile) {
      toaster.create({
        title: "エラー",
        description: "PDFファイルを選択してください",
        type: "error",
      });
      return;
    }

    if (locations.length === 0) {
      toaster.create({
        title: "エラー",
        description:
          "配置場所がありません。先に入力タブでデータを処理してください",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await loadPdfFile(pdfFile);
      const colorized = await colorizeMap(pdfBytes, locations);
      setColorizedPdf(colorized);

      toaster.create({
        title: "成功",
        description: `${locations.length}件の配置場所を色付けしました`,
        type: "success",
      });
    } catch (error) {
      console.error("PDF色付けエラー:", error);
      toaster.create({
        title: "エラー",
        description: "PDFの色付け処理に失敗しました",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          📁 Map PDFをアップロード
        </Text>
        <FileUpload.Root
          maxFiles={1}
          accept="application/pdf"
          onFileAccept={handleFileAccept}
        >
          <FileUpload.Trigger asChild>
            <Button variant="outline" w="full">
              PDFファイルを選択
            </Button>
          </FileUpload.Trigger>
          <FileUpload.List />
        </FileUpload.Root>
      </Box>

      {pdfFile && (
        <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
          <Text fontSize="sm" color="gray.600">
            選択されたファイル: <strong>{pdfFile.name}</strong>
          </Text>
          <Text fontSize="sm" color="gray.600" mt={1}>
            色付け対象: <strong>{locations.length}件</strong>の配置場所
          </Text>
        </Box>
      )}

      <HStack gap={4} w="full" justify="center">
        <Button
          size="lg"
          w="full"
          colorPalette="blue"
          onClick={handleColorize}
          disabled={!pdfFile || locations.length === 0 || isProcessing}
          loading={isProcessing}
        >
          🎨 Map色付け処理
        </Button>
      </HStack>
    </VStack>
  );
};
