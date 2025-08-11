import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { TwitterUser } from "../lib/types";

interface ScrapingTabProps {
  onDataFetched: (data: TwitterUser[]) => void;
}

export const ScrapingTab: React.FC<ScrapingTabProps> = ({ onDataFetched }) => {
  const [listUrl, setListUrl] = useState("");
  const [maxMembers, setMaxMembers] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    if (!listUrl.trim()) {
      alert("リストURLを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/scraping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listUrl: listUrl.trim(),
          maxMembers,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onDataFetched(result.data);
        alert(`${result.data.length}人のメンバーを取得しました！`);
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error: any) {
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack gap={6} align="stretch" pt={4}>
      <Box
        bg="orange.50"
        p={4}
        rounded="xl"
        border="1px"
        borderColor="orange.200"
      >
        <VStack align="start" gap={1}>
          <Text fontWeight="bold" color="orange.700">
            ⚠️ 注意:
          </Text>
          <Text fontSize="sm" color="orange.600">
            スクレイピング機能はTwitterの利用規約に注意して使用してください。
            レート制限やアクセス制限にかかる可能性があります。
          </Text>
        </VStack>
      </Box>

      <Box bg="gray.50" p={6} rounded="xl">
        <Heading size="md" mb={4}>
          🕷️ スクレイピング設定
        </Heading>

        <VStack gap={4}>
          <Box w="full">
            <Text mb={2} fontWeight="medium">
              リストURL *
            </Text>
            <Input
              type="url"
              value={listUrl}
              onChange={(e) => setListUrl(e.target.value)}
              placeholder="https://twitter.com/username/lists/listname"
              bg="white"
            />
          </Box>

          <Box w="full">
            <Text mb={2} fontWeight="medium">
              最大取得数
            </Text>
            <Input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value) || 100)}
              min={1}
              max={1000}
              placeholder="100"
              bg="white"
            />
          </Box>
        </VStack>
      </Box>

      <Button
        onClick={handleFetch}
        disabled={isLoading}
        colorScheme="blue"
        size="lg"
        w="full"
      >
        {isLoading ? (
          <HStack>
            <Spinner size="sm" />
            <Text>取得中...</Text>
          </HStack>
        ) : (
          "🔍 スクレイピングで取得"
        )}
      </Button>
    </VStack>
  );
};
