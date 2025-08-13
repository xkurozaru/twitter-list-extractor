import { toaster } from "@/components/ui/toaster";
import { TwitterList } from "@/lib/types";
import {
  Box,
  Button,
  Checkbox,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";

interface ScrapingTabProps {
  onDataFetched: (data: TwitterList[]) => void;
}

export const ScrapingTab: React.FC<ScrapingTabProps> = ({ onDataFetched }) => {
  const [listUrl, setListUrl] = useState("");
  const [maxMembers, setMaxMembers] = useState(500);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useLogin, setUseLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    if (!listUrl.trim()) {
      toaster.create({
        title: "入力エラー",
        description: "リストURLを入力してください",
        type: "error",
        duration: 3000,
      });
      return;
    }

    if (useLogin && (!username.trim() || !password.trim())) {
      toaster.create({
        title: "入力エラー",
        description:
          "ログインする場合はユーザー名とパスワードを入力してください",
        type: "error",
        duration: 3000,
      });
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
          username: useLogin ? username : undefined,
          password: useLogin ? password : undefined,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onDataFetched(result.data);
        toaster.create({
          title: "取得成功",
          description: `${result.data.length}人のメンバーを取得しました！`,
          type: "success",
          duration: 5000,
        });
      } else {
        toaster.create({
          title: "エラー",
          description: `エラー: ${result.error}`,
          type: "error",
          duration: 5000,
        });
      }
    } catch (error: any) {
      toaster.create({
        title: "エラー",
        description: `エラーが発生しました: ${error.message}`,
        type: "error",
        duration: 5000,
      });
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
          <Text fontSize="sm" color="orange.600" mt={2}>
            <strong>認証について:</strong> Xのリストは現在ログインが必要です。
            認証情報を入力することでアクセス可能になりますが、
            セキュリティ上のリスクを理解の上でご使用ください。
          </Text>
          <Text fontSize="sm" color="red.600" mt={1}>
            <strong>重要:</strong>{" "}
            二段階認証が有効な場合、ログインが失敗する可能性があります。
            一時的に無効にするか、アプリパスワードを使用してください。
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
              placeholder="https://x.com/i/lists/1234567890123456789/members"
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
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              min={100}
              max={1000}
              step={100}
              placeholder="100"
              bg="white"
            />
          </Box>

          <Box w="full">
            <Checkbox.Root onCheckedChange={(e) => setUseLogin(!!e.checked)}>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>Xアカウントでログインする</Checkbox.Label>
            </Checkbox.Root>
            <Text fontSize="sm" color="gray.600" mt={1}>
              認証情報はスクレイピング処理中のみ使用され、保存されません。
            </Text>
          </Box>

          {useLogin && (
            <>
              <Box w="full">
                <Text mb={2} fontWeight="medium">
                  ユーザー名/メールアドレス *
                </Text>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username または email@example.com"
                  bg="white"
                />
              </Box>

              <Box w="full">
                <Text mb={2} fontWeight="medium">
                  パスワード *
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  bg="white"
                />
              </Box>
            </>
          )}
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
