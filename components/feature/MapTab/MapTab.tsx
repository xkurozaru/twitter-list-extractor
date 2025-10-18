import { VStack } from "@chakra-ui/react";
import { useState } from "react";
import { MapActions } from "./MapActions";
import { MapPreview } from "./MapPreview";
import { MapProcessForm } from "./MapProcessForm";

interface MapTabProps {
  locations: string[]; // 短縮形の配置場所リスト（例: ["a01a", "B05b"]）
}

export const MapTab: React.FC<MapTabProps> = ({ locations }) => {
  const [colorizedPdf, setColorizedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPdfPath, setSelectedPdfPath] = useState<string>("");

  return (
    <VStack gap={6} align="stretch">
      <MapProcessForm
        locations={locations}
        setColorizedPdf={setColorizedPdf}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        setSelectedPdfPath={setSelectedPdfPath}
      />

      {colorizedPdf && (
        <>
          <MapPreview
            pdfData={colorizedPdf}
            selectedPdfPath={selectedPdfPath}
          />
          <MapActions pdfData={colorizedPdf} />
        </>
      )}
    </VStack>
  );
};
