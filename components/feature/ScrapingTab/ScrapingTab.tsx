import { toaster } from "@/components/ui/toaster";
import { TwitterList } from "@/lib/types";
import { Button, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import React, { useState } from "react";
import { Instructions } from "./Instractions";
import { RequestForm } from "./RequestForm";

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toaster.create({
        title: "エラー",
        description: `エラーが発生しました: ${errorMessage}`,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack gap={6} align="stretch" pt={4}>
      <Instructions />

      <RequestForm
        listUrl={listUrl}
        setListUrl={setListUrl}
        maxMembers={maxMembers}
        setMaxMembers={setMaxMembers}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        useLogin={useLogin}
        setUseLogin={setUseLogin}
      />

      <Button
        onClick={handleFetch}
        disabled={isLoading}
        size="lg"
        w="full"
        colorPalette="blue"
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
