import { downloadPdf } from "@/lib/pdfColorizer";
import { Button, HStack } from "@chakra-ui/react";

interface MapActionsProps {
  pdfData: Uint8Array;
}

export const MapActions: React.FC<MapActionsProps> = ({ pdfData }) => {
  const handleDownload = () => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `comiket-map-${timestamp}.pdf`;
    downloadPdf(pdfData, filename);
  };

  return (
    <HStack gap={4} w="full" justify="center">
      <Button size="lg" w="full" colorPalette="green" onClick={handleDownload}>
        💾 PDFをダウンロード
      </Button>
    </HStack>
  );
};
