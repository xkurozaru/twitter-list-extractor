import { ExtractedData } from "@/lib/types";
import { Button, HStack, VStack } from "@chakra-ui/react";
import { InputForm } from "./InputForm";
import { PatternInfo } from "./PatternInfo";
import { ResultsSection } from "./ResultsSection";

interface InputTabProps {
  inputData: string;
  onInputChange: (data: string) => void;
  processData: () => void;
  clearAll: () => void;
  showResults: boolean;
  data: ExtractedData[];
}

export const InputTab: React.FC<InputTabProps> = ({
  inputData,
  onInputChange,
  processData,
  clearAll,
  showResults,
  data,
}) => {
  return (
    <VStack gap={6} align="stretch">
      <InputForm inputData={inputData} onInputChange={onInputChange} />

      <PatternInfo />

      {/* Action Buttons */}
      <HStack gap={4} w="full" justify="center">
        <Button
          size="lg"
          w={"calc(100% / 2 - 8px)"}
          colorPalette="blue"
          onClick={processData}
        >
          🔍 パターン抽出処理
        </Button>
        <Button
          size="lg"
          w={"calc(100% / 2 - 8px)"}
          colorPalette="gray"
          variant="outline"
          onClick={clearAll}
        >
          🗑️ すべてクリア
        </Button>
      </HStack>

      {showResults && (
        <ResultsSection
          data={data}
          inputLineCount={
            inputData.split("\n").filter((line) => line.trim()).length
          }
        />
      )}
    </VStack>
  );
};
