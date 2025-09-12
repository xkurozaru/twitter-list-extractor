import { toaster } from "@/components/ui/toaster";
import { ExtractedData } from "@/lib/types";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  SimpleGrid,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import React from "react";

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
    let csvContent = "\ufeff日程,スペース,ペンネーム,twitter\n";
    data.forEach((item) => {
      const day = escapeCSVField(item.day || "");
      const extracted = escapeCSVField(item.extracted || "");
      const displayName = escapeCSVField(item.displayName || "");
      const profileUrl = escapeCSVField(item.profileUrl || "");
      csvContent += `"${day}","${extracted}","${displayName}","${profileUrl}"\n`;
    });
    return csvContent;
  };

  function escapeCSVField(field: string): string {
    if (!field) return "";
    return field.replace(/"/g, '""');
  }

  const copyToClipboard = async () => {
    if (data.length === 0) {
      toaster.create({
        title: "データなし",
        description: "まずデータを処理してください",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const csvContent = generateCSVContent();
      await navigator.clipboard.writeText(csvContent);

      toaster.create({
        title: "コピー完了",
        description: `CSV データをクリップボードにコピーしました (${data.length}件)`,
        type: "success",
        duration: 3000,
      });
    } catch {
      toaster.create({
        title: "コピー失敗",
        description: "クリップボードへのコピーに失敗しました",
        type: "error",
        duration: 3000,
      });
    }
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
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="sm">CSV プレビュー</Heading>
          <IconButton
            aria-label="CSVをクリップボードにコピー"
            size="sm"
            variant="ghost"
            onClick={copyToClipboard}
            disabled={data.length === 0}
            _hover={{ bg: "gray.100" }}
          >
            <Text fontSize="lg">📋</Text>
          </IconButton>
        </Flex>
        <Table.ScrollArea borderWidth="1px" rounded="md" height="400px">
          <Table.Root size="sm" variant="outline" interactive>
            <Table.Header bg="gray.100">
              <Table.Row>
                <Table.ColumnHeader fontWeight="bold" color="gray.700">
                  日程
                </Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="bold" color="gray.700">
                  スペース
                </Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="bold" color="gray.700">
                  ペンネーム
                </Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="bold" color="gray.700">
                  Twitter
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.length === 0 ? (
                <Table.Row>
                  <Table.Cell
                    colSpan={4}
                    textAlign="center"
                    color="gray.500"
                    py={8}
                  >
                    データがありません
                  </Table.Cell>
                </Table.Row>
              ) : (
                data.map((item, index) => (
                  <Table.Row key={index} _hover={{ bg: "gray.50" }}>
                    <Table.Cell
                      fontSize="sm"
                      maxW="80px"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {item.day || "-"}
                    </Table.Cell>
                    <Table.Cell
                      fontSize="sm"
                      maxW="80px"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {item.extracted || "-"}
                    </Table.Cell>
                    <Table.Cell
                      fontSize="sm"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {item.displayName || "-"}
                    </Table.Cell>
                    <Table.Cell
                      fontSize="sm"
                      maxW="300px"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {item.profileUrl ? (
                        <Link
                          href={item.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="blue.500"
                          _hover={{ textDecoration: "underline" }}
                        >
                          {item.profileUrl}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>
    </VStack>
  );
};
