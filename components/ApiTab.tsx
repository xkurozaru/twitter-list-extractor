import { toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { TwitterList } from "../lib/types";

interface ApiTabProps {
  onDataFetched: (data: TwitterList[]) => void;
}

export const ApiTab: React.FC<ApiTabProps> = ({ onDataFetched }) => {
  const [bearerToken, setBearerToken] = useState("");
  const [listId, setListId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("取得中...");
  const [maxRequests, setMaxRequests] = useState(15);
  const [currentCount, setCurrentCount] = useState(0);
  const [currentRequest, setCurrentRequest] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [clientWaitTime, setClientWaitTime] = useState(0); // クライアントサイドのカウントダウン用

  // 待機時間のカウントダウン
  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    console.log(
      "[COUNTDOWN] useEffect triggered, isWaiting:",
      isWaiting,
      "clientWaitTime:",
      clientWaitTime
    );

    if (isWaiting && clientWaitTime > 0) {
      console.log("[COUNTDOWN] Starting countdown interval");
      interval = setInterval(() => {
        setClientWaitTime((prev) => {
          const newTime = Math.max(0, prev - 1000);
          console.log("[COUNTDOWN] Updated time:", prev, "->", newTime);
          if (newTime === 0) {
            console.log(
              "[COUNTDOWN] Countdown finished, setting isWaiting to false"
            );
            setIsWaiting(false);
          }
          return newTime;
        });
      }, 1000);
    } else {
      console.log(
        "[COUNTDOWN] Not starting countdown - isWaiting:",
        isWaiting,
        "clientWaitTime:",
        clientWaitTime
      );
    }

    return () => {
      if (interval) {
        console.log("[COUNTDOWN] Clearing interval");
        clearInterval(interval);
      }
    };
  }, [isWaiting]); // clientWaitTime を依存配列から除外

  // デバッグ: 状態変化を監視
  React.useEffect(() => {
    console.log("[STATE] loadingMessage changed to:", loadingMessage);
  }, [loadingMessage]);

  React.useEffect(() => {
    console.log("[STATE] currentCount changed to:", currentCount);
  }, [currentCount]);

  React.useEffect(() => {
    console.log("[STATE] currentRequest changed to:", currentRequest);
  }, [currentRequest]);

  React.useEffect(() => {
    console.log("[STATE] isLoading changed to:", isLoading);
  }, [isLoading]);

  React.useEffect(() => {
    console.log("[STATE] isWaiting changed to:", isWaiting);
  }, [isWaiting]);

  React.useEffect(() => {
    console.log("[STATE] clientWaitTime changed to:", clientWaitTime);
  }, [clientWaitTime]);

  const resetProgress = () => {
    setCurrentCount(0);
    setCurrentRequest(0);
    setWaitTime(0);
    setIsWaiting(false);
  };

  const handleFetchWithEventSource = async () => {
    console.log("handleFetchWithEventSource called");

    if (!bearerToken.trim() || !listId.trim()) {
      toaster.create({
        title: "入力エラー",
        description: "Bearer Token と リストIDを入力してください",
        type: "error",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setCurrentCount(0);
    setCurrentRequest(0);
    setWaitTime(0);
    setIsWaiting(false);
    setLoadingMessage("初期化中...");
    console.log("Loading started with EventSource");

    let isCompleted = false; // 完了フラグを追加

    try {
      // EventSource を使用してSSE接続
      const params = new URLSearchParams({
        bearerToken: bearerToken.trim(),
        listId: listId.trim(),
        maxRequests: maxRequests.toString(),
      });

      const eventSourceUrl = `/api/twitter-api-stream?${params.toString()}`;
      console.log("EventSource URL:", eventSourceUrl);

      const eventSource = new EventSource(eventSourceUrl);

      eventSource.onopen = () => {
        console.log("[EventSource] Connection opened");
      };

      eventSource.onmessage = (event) => {
        console.log("[EventSource] Received message:", event.data);

        try {
          const data = JSON.parse(event.data);
          console.log("[PARSED] Successfully parsed data:", data);
          console.log("[UI] About to update UI with:", {
            currentCount: data.currentCount || 0,
            currentRequest: data.currentRequest || 0,
            status: data.status || "処理中...",
          });

          // UI更新を同期的に実行
          const newCount = data.currentCount || 0;
          const newRequest = data.currentRequest || 0;
          const newMessage = data.status || "処理中...";

          console.log("[UI] Setting states:", {
            newCount,
            newRequest,
            newMessage,
          });

          setCurrentCount(newCount);
          setCurrentRequest(newRequest);
          setLoadingMessage(newMessage);

          console.log("[UI] State update calls completed");

          if (data.waitTime && data.waitTime > 0) {
            setWaitTime(data.waitTime);
            setClientWaitTime(data.waitTime); // クライアントサイドのカウントダウンを開始
            setIsWaiting(true);
            console.log("[WAIT] Starting countdown with:", data.waitTime);
          } else {
            setIsWaiting(false);
            setWaitTime(0);
            setClientWaitTime(0);
          }

          if (data.type === "complete" && data.data) {
            console.log(
              "Completion received with data length:",
              data.data.length
            );
            isCompleted = true; // 完了フラグを設定
            onDataFetched(data.data);
            toaster.create({
              title: "取得完了",
              description: `✅ ${data.data.length}人のメンバーを取得しました！\n手動入力タブに自動で移動します。`,
              type: "success",
              duration: 8000,
            });

            // EventSourceを閉じる前に少し待機してUIを表示
            setTimeout(() => {
              eventSource.close();
              setIsLoading(false);
              console.log("EventSource closed and loading set to false");
            }, 3000); // 3秒間完了状態を表示
            return;
          } else if (data.type === "error") {
            console.error("[EventSource] Error type received:", data);
            isCompleted = true; // エラー時も完了フラグを設定
            eventSource.close();
            setIsLoading(false);

            toaster.create({
              title: "エラー",
              description: `❌ ${data.error || "Unknown error occurred"}`,
              type: "error",
              duration: 10000,
            });
            return;
          }
        } catch (parseError) {
          console.error(
            "Failed to parse SSE data:",
            event.data,
            "Error:",
            parseError
          );
          // パースエラーの場合は処理を続行（SSEのpingメッセージなどの可能性があるため）
        }
      };

      eventSource.onerror = (error) => {
        console.log(
          "[EventSource] Error event received, isCompleted:",
          isCompleted
        );

        // 完了後のエラーイベントは正常動作として扱う
        if (isCompleted) {
          console.log("[EventSource] Error after completion - this is normal");
          eventSource.close();
          return;
        }

        // 完了前のエラーは実際のエラーとして処理
        console.error("[EventSource] Actual error:", error);
        eventSource.close();
        setIsLoading(false);

        toaster.create({
          title: "接続エラー",
          description: "❌ サーバーとの接続が中断されました。",
          type: "error",
          duration: 8000,
        });
      };
    } catch (error: any) {
      console.error("[EventSource] Catch block error:", error);
      setIsLoading(false);
      if (error.name === "AbortError") {
        toaster.create({
          title: "タイムアウト",
          description:
            "⏰ タイムアウトしました。レート制限により処理に時間がかかっています。\n15分程度時間をおいてから再試行してください。",
          type: "warning",
          duration: 10000,
        });
      } else {
        toaster.create({
          title: "エラー",
          description: `❌ エラーが発生しました: ${error.message}`,
          type: "error",
          duration: 8000,
        });
      }
    }
    // finally ブロックを削除して、EventSource内でのみ isLoading を制御
  };

  return (
    <VStack gap={6} align="stretch" pt={4}>
      {/* Setup Instructions */}
      <Box bg="blue.50" p={6} rounded="xl" border="1px" borderColor="blue.200">
        <Heading size="md" color="blue.700" mb={4}>
          🔧 Twitter API設定手順
        </Heading>
        <VStack align="start" color="blue.600" gap={2}>
          <Text>
            1.{" "}
            <Link
              href="https://developer.twitter.com/en/portal/dashboard"
              color="blue.800"
            >
              Twitter Developer Portal
            </Link>{" "}
            にアクセス
          </Text>
          <Text>2. Bearer Tokenを取得</Text>
          <Text>3. 下記フォームに必要情報を入力</Text>
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
              リストURLの数字部分: https://x.com/i/lists/
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

      {/* Progress Section - 取得中のみ表示 */}
      {(() => {
        console.log("[UI RENDER] isLoading state:", isLoading);
        return isLoading;
      })() && (
        <Box
          bg="blue.50"
          p={6}
          rounded="xl"
          border="1px"
          borderColor="blue.200"
        >
          <VStack gap={4}>
            <Heading size="md" color="blue.700" textAlign="center">
              📊 リアルタイム進捗
            </Heading>

            {/* 現在の状況表示 */}
            <VStack gap={3} w="full">
              <Text
                color="blue.700"
                fontWeight="bold"
                fontSize="lg"
                textAlign="center"
              >
                {loadingMessage}
              </Text>

              {/* 取得済み人数 */}
              <Box bg="white" p={4} rounded="lg" w="full" textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {currentCount.toLocaleString()}人
                </Text>
                <Text fontSize="sm" color="gray.600">
                  取得済みメンバー数
                </Text>
              </Box>

              {/* リクエスト進捗 */}
              <Box bg="white" p={4} rounded="lg" w="full">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  API リクエスト進捗
                </Text>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    w="full"
                    h="4px"
                    bg="gray.200"
                    rounded="full"
                    overflow="hidden"
                  >
                    <Box
                      w={`${(currentRequest / maxRequests) * 100}%`}
                      h="full"
                      bg="blue.500"
                      rounded="full"
                      transition="width 0.3s ease"
                    />
                  </Box>
                  <Text fontSize="sm" color="blue.600" fontWeight="semibold">
                    {currentRequest}/{maxRequests}
                  </Text>
                </Box>
              </Box>

              {/* 待機時間表示 */}
              {clientWaitTime > 0 && (
                <Box
                  bg="orange.50"
                  p={4}
                  rounded="lg"
                  w="full"
                  border="1px"
                  borderColor="orange.200"
                >
                  <Text
                    fontSize="sm"
                    color="orange.700"
                    fontWeight="bold"
                    mb={1}
                  >
                    ⏰ レート制限待機中
                  </Text>
                  <Text fontSize="sm" color="orange.600">
                    残り約 {Math.ceil(clientWaitTime / 1000)} 秒
                  </Text>
                </Box>
              )}

              <Text
                color="blue.500"
                fontSize="xs"
                textAlign="center"
                fontStyle="italic"
              >
                大きなリストの場合、100人ごとに15分の待機時間が発生します
              </Text>
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Action Button */}
      <VStack gap={3}>
        <Button
          size="lg"
          colorScheme="blue"
          onClick={handleFetchWithEventSource}
          disabled={isLoading}
          loading={isLoading}
          w="full"
        >
          {isLoading ? loadingMessage : "🚀 全メンバー取得"}
        </Button>
      </VStack>
    </VStack>
  );
};
