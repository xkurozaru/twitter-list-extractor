import { VStack } from "@chakra-ui/react";
import { useState } from "react";
import { MapActions } from "./MapActions";
import { MapPreview } from "./MapPreview";
import { MapUploadForm } from "./MapUploadForm";

interface MapTabProps {
  locations: string[]; // 処理済みの配置場所リスト
}

export const MapTab: React.FC<MapTabProps> = ({ locations }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [colorizedPdf, setColorizedPdf] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <VStack gap={6} align="stretch">
      <MapUploadForm
        pdfFile={pdfFile}
        setPdfFile={setPdfFile}
        locations={locations}
        setColorizedPdf={setColorizedPdf}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />

      {colorizedPdf && (
        <>
          <MapPreview pdfData={colorizedPdf} />
          <MapActions pdfData={colorizedPdf} />
        </>
      )}
    </VStack>
  );
};
