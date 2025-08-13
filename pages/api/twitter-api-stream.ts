import { TwitterList } from "@/lib/types";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

interface TwitterApiResponse {
  data: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  meta: {
    result_count: number;
    next_token?: string;
  };
}

interface ProgressUpdate {
  type: "progress" | "error" | "complete";
  currentCount: number;
  currentRequest: number;
  maxRequests: number;
  status: string;
  waitTime?: number;
  data?: any[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("[API] twitter-api-stream called with method:", req.method);
  console.log("[API] Request body:", req.body);
  console.log("[API] Request query:", req.query);

  if (req.method !== "POST" && req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  // POSTとGETの両方をサポート
  const {
    bearerToken,
    listId,
    maxRequests: clientMaxRequests,
  } = req.method === "POST" ? req.body : req.query;

  console.log("[API] Extracted params:", {
    bearerTokenLength: bearerToken?.length,
    listId,
    maxRequests: clientMaxRequests,
  });

  if (!bearerToken || !listId) {
    console.log("[API] Missing required parameters");
    return res.status(400).json({
      success: false,
      error: "Bearer Token と List ID が必要です",
    });
  }

  console.log("[API] Setting up SSE headers...");

  // Server-Sent Events の設定
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
    "X-Accel-Buffering": "no", // nginx buffering を無効化
  });

  // 初期接続確認のためのpingを送信
  res.write(": ping\n\n");
  // NextApiResponseはNode.jsのServerResponseをextendしているため、キャストして使用
  const nodeRes = res as any;
  if (nodeRes.flush) nodeRes.flush();

  console.log("[API] SSE headers set successfully");

  const sendProgress = (update: ProgressUpdate) => {
    const message = `data: ${JSON.stringify(update)}\n\n`;
    console.log("[SSE] Sending message:", update);
    console.log("[SSE] Raw message:", JSON.stringify(message));

    try {
      res.write(message);
      // 強制的にデータを送信
      const nodeRes = res as any;
      if (nodeRes.flush) {
        nodeRes.flush();
        console.log("[SSE] Flushed successfully");
      }
      // さらに確実にするためのsetImmediate
      setImmediate(() => {
        if (nodeRes.flushHeaders) nodeRes.flushHeaders();
      });
      console.log("[SSE] Write and flush successful");
    } catch (writeError) {
      console.error("[SSE] Write failed:", writeError);
    }
  };

  try {
    const allMembers: TwitterList[] = [];
    let nextToken: string | undefined = undefined;
    let requestCount = 0;
    const maxRequests = clientMaxRequests || 15;

    console.log("[API] Starting processing with maxRequests:", maxRequests);

    // テスト用の処理（実際のAPI呼び出しなし）
    if (bearerToken === "test" && listId === "test") {
      console.log("[API] Running in test mode");

      // 初期メッセージ送信
      sendProgress({
        type: "progress",
        currentCount: 0,
        currentRequest: 0,
        maxRequests,
        status: "初期化中...",
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // テスト用のプログレス更新
      for (let i = 1; i <= 3; i++) {
        sendProgress({
          type: "progress",
          currentCount: i * 10,
          currentRequest: i,
          maxRequests,
          status: `テスト中... リクエスト ${i}/${maxRequests}`,
        });

        // 2回目のリクエストでレート制限をシミュレート
        if (i === 2) {
          console.log("[TEST] Simulating rate limit wait");
          const testWaitTime = 60000; // 1分の待機をシミュレート

          sendProgress({
            type: "progress",
            currentCount: i * 10,
            currentRequest: i,
            maxRequests,
            status: `テスト: レート制限待機中... (1分)`,
            waitTime: testWaitTime,
          });

          // 10秒ごとに残り時間を更新
          let remainingTime = testWaitTime;
          const updateInterval = setInterval(() => {
            remainingTime -= 10000;
            const remainingMinutes = Math.ceil(remainingTime / 60000);

            if (remainingTime > 0) {
              sendProgress({
                type: "progress",
                currentCount: i * 10,
                currentRequest: i,
                maxRequests,
                status: `テスト: レート制限待機中... (${remainingMinutes}分)`,
                waitTime: remainingTime,
              });
            } else {
              clearInterval(updateInterval);
            }
          }, 10000);

          await new Promise((resolve) => {
            setTimeout(() => {
              clearInterval(updateInterval);
              resolve(void 0);
            }, testWaitTime);
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // 完了
      sendProgress({
        type: "complete",
        currentCount: 30,
        currentRequest: 3,
        maxRequests,
        status: "テスト完了！",
        data: [
          { id: "1", name: "Test User 1", username: "test1" },
          { id: "2", name: "Test User 2", username: "test2" },
        ],
      });

      return;
    }

    // 実際のAPI処理
    sendProgress({
      type: "progress",
      currentCount: 0,
      currentRequest: 0,
      maxRequests,
      status: "初期化中...",
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("[API] Starting main processing loop");

    do {
      requestCount++;
      if (requestCount > maxRequests) {
        console.warn(
          `[API] 最大リクエスト数 (${maxRequests}) に達しました。取得を中止します。`
        );
        break;
      }

      let url = `https://api.twitter.com/2/lists/${listId}/members?max_results=100&user.fields=name,username`;
      if (nextToken) {
        url += `&pagination_token=${nextToken}`;
      }

      sendProgress({
        type: "progress",
        currentCount: allMembers.length,
        currentRequest: requestCount,
        maxRequests,
        status: `リクエスト ${requestCount}/${maxRequests} 実行中...`,
      });

      // レート制限対応の再試行ロジック
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let response: any;

      while (!success && retryCount < maxRetries) {
        try {
          response = await axios.get<TwitterApiResponse>(url, {
            headers: {
              Authorization: `Bearer ${bearerToken}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          });
          success = true;
        } catch (error: any) {
          retryCount++;

          if (error.response?.status === 429) {
            const resetTime = error.response.headers["x-rate-limit-reset"];
            console.warn(
              `[API] レート制限に達しました。x-rate-limit-reset: ${resetTime}`
            );
            const waitTime = resetTime
              ? Math.max(parseInt(resetTime) * 1000 - Date.now(), 60000)
              : Math.pow(2, retryCount) * 60000;

            const waitMinutes = Math.ceil(waitTime / 60000);

            sendProgress({
              type: "progress",
              currentCount: allMembers.length,
              currentRequest: requestCount,
              maxRequests,
              status: `レート制限のため ${waitMinutes}分待機中... (再試行 ${retryCount}/${maxRetries})`,
              waitTime: waitTime,
            });

            if (retryCount < maxRetries) {
              // 待機時間を30秒ごとに更新
              let remainingTime = waitTime;
              const startTime = Date.now();

              const updateInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                remainingTime = Math.max(0, waitTime - elapsed);
                const remainingMinutes = Math.ceil(remainingTime / 60000);

                if (remainingTime > 0) {
                  sendProgress({
                    type: "progress",
                    currentCount: allMembers.length,
                    currentRequest: requestCount,
                    maxRequests,
                    status: `レート制限のため ${remainingMinutes}分待機中... (再試行 ${retryCount}/${maxRetries})`,
                    waitTime: remainingTime,
                  });
                } else {
                  clearInterval(updateInterval);
                }
              }, 30000); // 30秒ごとに更新

              await new Promise((resolve) => {
                setTimeout(() => {
                  clearInterval(updateInterval);
                  resolve(void 0);
                }, waitTime);
              });
            } else {
              console.error("[API] Rate limit exceeded, max retries reached");
              sendProgress({
                type: "error",
                currentCount: allMembers.length,
                currentRequest: requestCount,
                maxRequests,
                status: "レート制限エラー",
                error: `レート制限により失敗しました。取得済み: ${allMembers.length}人。15分程度時間をおいてから再試行してください。`,
              });
              return; // ここで処理を終了
            }
          } else {
            if (retryCount < maxRetries) {
              const retryDelay = Math.pow(2, retryCount) * 1000;
              sendProgress({
                type: "progress",
                currentCount: allMembers.length,
                currentRequest: requestCount,
                maxRequests,
                status: `エラーが発生しました。${
                  retryDelay / 1000
                }秒後に再試行... (${retryCount}/${maxRetries})`,
              });
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            } else {
              console.error(
                "[API] Max retries reached for non-rate-limit error:",
                error
              );
              sendProgress({
                type: "error",
                currentCount: allMembers.length,
                currentRequest: requestCount,
                maxRequests,
                status: "APIエラー",
                error: `API呼び出しに失敗しました: ${
                  error.message || "不明なエラー"
                }。取得済み: ${allMembers.length}人`,
              });
              return; // ここで処理を終了
            }
          }
        }
      }

      if (response?.data?.data) {
        const newMembers: TwitterList[] = response.data.data.map(
          (user: any) => ({
            id: user.id,
            name: user.name,
            username: user.username,
          })
        );

        allMembers.push(...newMembers);
        nextToken = response.data.meta.next_token;

        sendProgress({
          type: "progress",
          currentCount: allMembers.length,
          currentRequest: requestCount,
          maxRequests,
          status: `${allMembers.length}人取得完了 (リクエスト ${requestCount}/${maxRequests})`,
        });

        // 次のリクエストまでの基本待機時間
        if (nextToken && requestCount < maxRequests) {
          sendProgress({
            type: "progress",
            currentCount: allMembers.length,
            currentRequest: requestCount,
            maxRequests,
            status: "次のリクエストまで待機中... (2秒)",
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } else {
        break;
      }
    } while (nextToken && requestCount < maxRequests);

    // 完了
    sendProgress({
      type: "complete",
      currentCount: allMembers.length,
      currentRequest: requestCount,
      maxRequests,
      status: "取得完了！",
      data: allMembers,
    });
  } catch (error: any) {
    console.error("[API] Unexpected error occurred:", error);

    // エラーの種類に応じて適切なメッセージを設定
    let errorMessage = "予期しないエラーが発生しました";

    if (error.message?.includes("レート制限")) {
      errorMessage = error.message;
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      errorMessage =
        "ネットワーク接続エラーが発生しました。インターネット接続を確認してください。";
    } else if (error.response?.status === 401) {
      errorMessage =
        "認証エラー: Bearer Tokenが無効です。正しいトークンを入力してください。";
    } else if (error.response?.status === 403) {
      errorMessage =
        "アクセス権限がありません。APIキーの権限を確認してください。";
    } else if (error.response?.status === 404) {
      errorMessage =
        "指定されたリストが見つかりません。リストIDを確認してください。";
    } else if (error.message) {
      errorMessage = error.message;
    }

    sendProgress({
      type: "error",
      currentCount: 0,
      currentRequest: 0,
      maxRequests: 0,
      status: "エラーが発生しました",
      error: errorMessage,
    });
  } finally {
    console.log("[API] Ending SSE stream");
    res.end();
  }
}
