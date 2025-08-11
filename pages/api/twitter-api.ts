import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { ApiResponse, TwitterUser } from "../../lib/types";

interface TwitterApiResponse {
  data: Array<{
    id: string;
    name: string;
    username: string;
    public_metrics?: any;
  }>;
  meta: {
    result_count: number;
    next_token?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<TwitterUser[]>>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const { bearerToken, listId, maxRequests: clientMaxRequests } = req.body;

  if (!bearerToken || !listId) {
    return res.status(400).json({
      success: false,
      error: "Bearer Token と List ID が必要です",
    });
  }

  try {
    const allMembers: TwitterUser[] = [];
    let nextToken: string | undefined = undefined;
    let requestCount = 0;
    const maxRequests = clientMaxRequests || 15; // デフォルトは15回（1500人）に制限
    const baseDelay = 2000; // 基本待機時間を2秒に増加

    do {
      requestCount++;
      if (requestCount > maxRequests) {
        console.warn(
          `最大リクエスト数 (${maxRequests}) に達しました。取得を中止します。`
        );
        break;
      }

      let url = `https://api.twitter.com/2/lists/${listId}/members?max_results=100&user.fields=name,username,public_metrics`;
      if (nextToken) {
        url += `&pagination_token=${nextToken}`;
      }

      console.log(`リクエスト ${requestCount}: ${allMembers.length}人取得済み`);

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
            timeout: 30000, // 30秒タイムアウト
          });
          success = true;
        } catch (error: any) {
          retryCount++;

          if (error.response?.status === 429) {
            // レート制限エラーの場合
            const resetTime = error.response.headers["x-rate-limit-reset"];
            const waitTime = resetTime
              ? Math.max(parseInt(resetTime) * 1000 - Date.now(), 60000) // 最低1分待機
              : Math.pow(2, retryCount) * 60000; // 指数バックオフ（分単位）

            console.log(
              `レート制限に達しました。${Math.ceil(
                waitTime / 1000
              )}秒後に再試行... (${retryCount}/${maxRetries})`
            );

            if (retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            } else {
              throw new Error(
                `レート制限により失敗しました。しばらく時間をおいてから再試行してください。取得済み: ${allMembers.length}人`
              );
            }
          } else {
            // その他のエラーの場合
            if (retryCount < maxRetries) {
              const waitTime = Math.pow(2, retryCount) * 1000; // 指数バックオフ（秒単位）
              console.log(
                `エラーが発生しました。${
                  waitTime / 1000
                }秒後に再試行... (${retryCount}/${maxRetries})`
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            } else {
              throw error;
            }
          }
        }
      }

      if (response.data.data && response.data.data.length > 0) {
        const members: TwitterUser[] = response.data.data.map((user: any) => ({
          displayName: user.name,
          username: `@${user.username}`,
          profileUrl: `https://twitter.com/${user.username}`,
        }));

        allMembers.push(...members);
      }

      nextToken = response.data.meta.next_token;

      // 次のリクエスト前の待機（レート制限対策）
      if (nextToken && requestCount < maxRequests) {
        const delay = baseDelay + requestCount * 100; // 徐々に間隔を広げる
        console.log(`${delay}ms待機中...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } while (nextToken && requestCount < maxRequests);

    if (allMembers.length > 0) {
      console.log(
        `取得完了: 総計 ${allMembers.length}人のメンバーを取得しました`
      );
      res.status(200).json({ success: true, data: allMembers });
    } else {
      res.status(404).json({
        success: false,
        error: "メンバーが見つかりませんでした",
      });
    }
  } catch (error: any) {
    console.error("Twitter API Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: `API Error: ${error.response?.status || "Unknown"} - ${
        error.response?.data?.detail || error.message
      }`,
    });
  }
}
