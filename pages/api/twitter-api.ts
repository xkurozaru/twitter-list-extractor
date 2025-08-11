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

  const { bearerToken, listId } = req.body;

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
    const maxRequests = 50; // 安全のため最大50回のリクエストに制限（5000人まで）

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

      const response = await axios.get<TwitterApiResponse>(url, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.data && response.data.data.length > 0) {
        const members: TwitterUser[] = response.data.data.map((user) => ({
          displayName: user.name,
          username: `@${user.username}`,
          profileUrl: `https://twitter.com/${user.username}`,
        }));

        allMembers.push(...members);
      }

      nextToken = response.data.meta.next_token;

      // レート制限対策: 少し待機
      if (nextToken && requestCount < maxRequests) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms待機
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
