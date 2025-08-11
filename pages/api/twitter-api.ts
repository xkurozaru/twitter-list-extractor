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
    const response = await axios.get<TwitterApiResponse>(
      `https://api.twitter.com/2/lists/${listId}/members?max_results=100&user.fields=name,username,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.data && response.data.data.length > 0) {
      const members: TwitterUser[] = response.data.data.map((user) => ({
        displayName: user.name,
        username: `@${user.username}`,
        profileUrl: `https://twitter.com/${user.username}`,
      }));

      res.status(200).json({ success: true, data: members });
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
