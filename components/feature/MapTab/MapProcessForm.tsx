import { toaster } from "@/components/ui/toaster";
import {
  buildFullLocation,
  getPdfPath,
  inferHallFromBlock,
} from "@/lib/hallBlockMapping";
import { colorizeMap, loadPdfFromUrl } from "@/lib/pdfColorizer";
import {
  Box,
  Button,
  HStack,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface MapProcessFormProps {
  locations: string[]; // 短縮形の配置場所リスト
  setColorizedPdf: (pdf: Uint8Array | null) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  setSelectedPdfPath: (path: string) => void;
}

export const MapProcessForm: React.FC<MapProcessFormProps> = ({
  locations,
  setColorizedPdf,
  isProcessing,
  setIsProcessing,
  setSelectedPdfPath,
}) => {
  const [pdfPath, setPdfPath] = useState<string>("");
  const [fullLocations, setFullLocations] = useState<string[]>([]);

  // 配置場所が変更されたら、完全な配置場所を構築し、PDFを自動選択
  useEffect(() => {
    if (locations.length === 0) {
      setFullLocations([]);
      setPdfPath("");
      return;
    }

    // 短縮形から完全な配置場所を構築
    const built = locations
      .map((loc) => buildFullLocation(loc))
      .filter((loc): loc is string => loc !== null);

    setFullLocations(built);

    // 最初の配置場所からPDFパスを決定
    if (built.length > 0 && locations.length > 0) {
      const firstBlock = locations[0].charAt(0);
      const { area, hall } = inferHallFromBlock(firstBlock);
      const path = getPdfPath(area, hall);
      setPdfPath(path);
      setSelectedPdfPath(path);
    }
  }, [locations, setSelectedPdfPath]);

  const handleColorize = async () => {
    if (!pdfPath) {
      toaster.create({
        title: "エラー",
        description: "PDFファイルが選択されていません",
        type: "error",
      });
      return;
    }

    if (fullLocations.length === 0) {
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
      const pdfBytes = await loadPdfFromUrl(pdfPath);
      const colorized = await colorizeMap(pdfBytes, fullLocations);
      setColorizedPdf(colorized);

      toaster.create({
        title: "成功",
        description: `${fullLocations.length}件の配置場所を色付けしました`,
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

  const handlePdfChange = (value: string) => {
    setPdfPath(value);
    setSelectedPdfPath(value);
  };

  return (
    <VStack gap={4} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          🗺️ Map設定
        </Text>

        {locations.length > 0 && (
          <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50" mb={4}>
            <Text fontSize="sm" color="gray.600" mb={2}>
              処理対象: <strong>{locations.length}件</strong>の配置場所
            </Text>
            <Text fontSize="sm" color="gray.600">
              完全形式に変換: <strong>{fullLocations.length}件</strong>
            </Text>
            <Box
              mt={2}
              p={2}
              bg="white"
              borderRadius="md"
              maxH="100px"
              overflowY="auto"
            >
              <Text fontSize="xs" fontFamily="monospace">
                {fullLocations.slice(0, 5).join(", ")}
                {fullLocations.length > 5 &&
                  ` ... (+${fullLocations.length - 5}件)`}
              </Text>
            </Box>
          </Box>
        )}

        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            使用するMap
          </Text>
          <NativeSelect.Root size="md">
            <NativeSelect.Field
              value={pdfPath}
              onChange={(e) => handlePdfChange(e.target.value)}
            >
              <option value="">Mapを選択</option>
              <option value="/C106Map_w12_B4.pdf">西12ホール</option>
              <option value="/C106Map_e456_B4.pdf">東456ホール</option>
              <option value="/C106Map_e7_B4.pdf">東7ホール</option>
              <option value="/C106Map_s12_B4.pdf">南12ホール</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Box>
      </Box>

      <HStack gap={4} w="full" justify="center">
        <Button
          size="lg"
          w="full"
          colorPalette="blue"
          onClick={handleColorize}
          disabled={!pdfPath || fullLocations.length === 0 || isProcessing}
          loading={isProcessing}
        >
          🎨 Map色付け処理
        </Button>
      </HStack>
    </VStack>
  );
};
