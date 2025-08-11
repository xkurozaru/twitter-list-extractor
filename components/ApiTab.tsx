import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";
import React, { useState } from "react";
import { TwitterUser } from "../lib/types";

interface ApiTabProps {
  onDataFetched: (data: TwitterUser[]) => void;
}

export const ApiTab: React.FC<ApiTabProps> = ({ onDataFetched }) => {
  const [bearerToken, setBearerToken] = useState("");
  const [listId, setListId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("取得中...");
  const [maxRequests, setMaxRequests] = useState(15);

  const handleFetch = async () => {
    if (!bearerToken.trim() || !listId.trim()) {
      alert("Bearer Token と リストIDを入力してください");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("メンバー取得を開始中...");

    try {
      // タイムアウトを設定（15分に延長）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);

      setLoadingMessage(
        `メンバー取得中... (最大${maxRequests * 100}人まで取得)`
      );

      const response = await fetch("/api/twitter-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bearerToken: bearerToken.trim(),
          listId: listId.trim(),
          maxRequests: maxRequests,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success && result.data) {
        onDataFetched(result.data);
        alert(
          `✅ ${result.data.length}人のメンバーを取得しました！\n手動入力タブに自動で移動します。`
        );
      } else {
        if (result.error?.includes("レート制限")) {
          alert(
            `⏰ ${result.error}\n\n15分程度時間をおいてから再試行してください。`
          );
        } else {
          alert(`❌ エラー: ${result.error}`);
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        alert(
          "⏰ タイムアウトしました。レート制限により処理に時間がかかっています。\n15分程度時間をおいてから再試行してください。"
        );
      } else {
        alert(`❌ エラーが発生しました: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("取得中...");
    }
  };

  return (
    <VStack gap={6} align="stretch" pt={4}>
      {/* Setup Instructions */}
      <Box bg="blue.50" p={6} rounded="xl" border="1px" borderColor="blue.200">
        <Heading size="md" color="blue.700" mb={4}>
          🔧 Twitter API設定手順
        </Heading>
        <VStack align="start" color="blue.600" gap={2}>
          <Text>1. Twitter Developer Portal にアクセス</Text>
          <Text>2. 開発者アカウントを作成・申請</Text>
          <Text>3. 新しいアプリを作成</Text>
          <Text>4. Bearer Tokenを取得</Text>
          <Text>5. 下記フォームに必要情報を入力</Text>
        </VStack>
      </Box>

      {/* Info Alert */}
      <Box bg="blue.50" p={4} rounded="lg" border="1px" borderColor="blue.200">
        <Text fontWeight="bold" color="blue.700">
          ℹ️ 注意:
        </Text>
        <Text color="blue.600">
          大きなリストの場合、全メンバーの取得に時間がかかる場合があります。
          最大5000人まで取得可能です（安全制限）。
        </Text>
      </Box>

      {/* Warning Alert */}
      <Box
        bg="orange.50"
        p={4}
        rounded="lg"
        border="1px"
        borderColor="orange.200"
      >
        <Text fontWeight="bold" color="orange.700">
          ⚠️ レート制限について:
        </Text>
        <Text color="orange.600">
          Twitter APIには15分間で最大75回のリクエスト制限があります。
          大きなリストの場合、自動的に待機時間を設けて取得を続行します。 "Too
          Many
          Requests"エラーが発生した場合は、15分程度時間をおいてから再試行してください。
        </Text>
      </Box>

      {/* Form */}
      <Box bg="gray.50" p={6} rounded="xl">
        <Heading size="md" mb={4}>
          🔑 API認証情報
        </Heading>
        <VStack gap={4}>
          <Box w="full">
            <Text fontWeight="semibold" mb={2}>
              Bearer Token *
            </Text>
            <Input
              type="text"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
              placeholder="AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid..."
              bg="white"
            />
          </Box>

          <Box w="full">
            <Text fontWeight="semibold" mb={2}>
              リストID *
            </Text>
            <Input
              type="text"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              placeholder="1234567890123456789"
              bg="white"
            />
            <Text fontSize="sm" color="gray.600" mt={2}>
              リストURLの数字部分: https://twitter.com/i/lists/
              <Text as="span" fontWeight="bold">
                1234567890123456789
              </Text>
            </Text>
          </Box>

          <Box w="full">
            <Text fontWeight="semibold" mb={2}>
              最大リクエスト数 (レート制限対策)
            </Text>
            <select
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "6px",
              }}
              value={maxRequests}
              onChange={(e) => setMaxRequests(parseInt(e.target.value))}
            >
              <option value="5">5回 (最大500人) - 最も安全</option>
              <option value="10">10回 (最大1000人) - 安全</option>
              <option value="15">15回 (最大1500人) - 推奨</option>
              <option value="25">25回 (最大2500人) - 中程度</option>
              <option value="50">50回 (最大5000人) - 上級者向け</option>
            </select>
            <Text fontSize="sm" color="gray.600" mt={2}>
              レート制限を避けるため、少ない値から始めることをお勧めします
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* Action Button */}
      <Button
        size="lg"
        colorScheme="blue"
        onClick={handleFetch}
        disabled={isLoading}
        loading={isLoading}
        w="full"
      >
        {isLoading ? loadingMessage : "🚀 全メンバー取得"}
      </Button>
    </VStack>
  );
};
