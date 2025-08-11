import {
  Box,
  Button,
  Code,
  createToaster,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { ExtractedData } from "../lib/types";

const toaster = createToaster({
  placement: "top",
});

interface ResultsSectionProps {
  data: ExtractedData[];
  inputLineCount: number;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  data,
  inputLineCount,
}) => {
  const matchCount = data.length;
  const matchRate =
    inputLineCount > 0 ? Math.round((matchCount / inputLineCount) * 100) : 0;

  const generateCSVContent = () => {
    let csvContent = "抽出文字,ユーザー表示名,ユーザーのリンクurl,日程\n";
    data.forEach((item) => {
      csvContent += `"${item.extracted}","${item.displayName}","${item.profileUrl}","${item.day}"\n`;
    });
    return csvContent;
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toaster.create({
        title: "データなし",
        description: "まずデータを処理してください",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    const csvContent = "\ufeff" + generateCSVContent(); // BOM付きでUTF-8エンコーディング
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `twitter_list_extracted_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    // Success toast
    toaster.create({
      title: "ダウンロード完了",
      description: `CSVファイルをダウンロードしました (${data.length}件)`,
      type: "success",
      duration: 3000,
    });
  };

  return (
    <VStack gap={6} align="stretch" pt={4}>
      <Box bg="gray.50" p={6} rounded="xl">
        <Heading size="md" mb={4}>
          📊 処理結果
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
          <Box bg="blue.50" p={4} rounded="xl">
            <Text fontSize="sm" color="blue.600" fontWeight="medium">
              総データ数
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.700">
              {inputLineCount}
            </Text>
          </Box>
          <Box bg="green.50" p={4} rounded="xl">
            <Text fontSize="sm" color="green.600" fontWeight="medium">
              マッチ数
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.700">
              {matchCount}
            </Text>
          </Box>
          <Box bg="purple.50" p={4} rounded="xl">
            <Text fontSize="sm" color="purple.600" fontWeight="medium">
              マッチ率
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.700">
              {matchRate}%
            </Text>
          </Box>
        </SimpleGrid>

        <Button
          onClick={downloadCSV}
          disabled={matchCount === 0}
          colorScheme="blue"
          size="lg"
          w="full"
        >
          📥 CSV ダウンロード
        </Button>
      </Box>

      <Box bg="white" p={6} rounded="xl" border="1px" borderColor="gray.200">
        <Heading size="sm" mb={4}>
          CSV プレビュー
        </Heading>
        <Code
          display="block"
          whiteSpace="pre-wrap"
          fontSize="sm"
          bg="gray.50"
          p={4}
          rounded="md"
          maxH="300px"
          overflowY="auto"
        >
          {generateCSVContent()}
        </Code>
      </Box>
    </VStack>
  );
};
