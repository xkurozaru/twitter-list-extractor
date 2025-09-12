import { toaster } from "@/components/ui/toaster";
import { TwitterList } from "@/lib/types";
import { Button, VStack } from "@chakra-ui/react";
import React, { useState } from "react";
import { Instructions } from "./Instractions";
import { ProgressSection } from "./ProgressSection";
import { RequestForm } from "./RequestForm";

interface ApiTabProps {
  onDataFetched: (data: TwitterList[]) => void;
}

export const ApiTab: React.FC<ApiTabProps> = ({ onDataFetched }) => {
  const [bearerToken, setBearerToken] = useState(
    process.env.NEXT_PUBLIC_TWITTER_BEARER_TOKEN || ""
  );
  const [listId, setListId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("取得中...");
  const [maxRequests, setMaxRequests] = useState(5);
  const [currentCount, setCurrentCount] = useState(0);
  const [currentRequest, setCurrentRequest] = useState(0);
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
  }, [isWaiting, clientWaitTime]); // clientWaitTime を依存配列に追加

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
            setClientWaitTime(data.waitTime); // クライアントサイドのカウントダウンを開始
            setIsWaiting(true);
            console.log("[WAIT] Starting countdown with:", data.waitTime);
          } else {
            setIsWaiting(false);
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
        } catch (parseError: unknown) {
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
    } catch (error: unknown) {
      console.error("[EventSource] Catch block error:", error);
      setIsLoading(false);
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        toaster.create({
          title: "タイムアウト",
          description:
            "⏰ タイムアウトしました。レート制限により処理に時間がかかっています。\n15分程度時間をおいてから再試行してください。",
          type: "warning",
          duration: 10000,
        });
      } else {
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "不明なエラー";
        toaster.create({
          title: "エラー",
          description: `❌ エラーが発生しました: ${errorMessage}`,
          type: "error",
          duration: 8000,
        });
      }
    }
  };

  return (
    <VStack gap={6} align="stretch" pt={4}>
      <Instructions />

      <RequestForm
        bearerToken={bearerToken}
        setBearerToken={setBearerToken}
        listId={listId}
        setListId={setListId}
        maxRequests={maxRequests}
        setMaxRequests={setMaxRequests}
      />

      {isLoading && (
        <ProgressSection
          loadingMessage={loadingMessage}
          currentCount={currentCount}
          maxRequests={maxRequests}
          currentRequest={currentRequest}
          clientWaitTime={clientWaitTime}
        />
      )}

      {/* Action Button */}
      <Button
        size="lg"
        w="full"
        colorPalette="blue"
        onClick={handleFetchWithEventSource}
        disabled={isLoading}
        loading={isLoading}
      >
        {isLoading ? loadingMessage : "🚀 全メンバー取得"}
      </Button>
    </VStack>
  );
};
