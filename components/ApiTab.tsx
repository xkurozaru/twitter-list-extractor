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
    <div className="api-tab">
      <div className="api-setup">
        <h4>🔧 Twitter API設定手順</h4>
        <ol>
          <li>
            <a href="https://developer.twitter.com/" target="_blank">
              Twitter Developer Portal
            </a>
            にアクセス
          </li>
          <li>開発者アカウントを作成・申請</li>
          <li>新しいアプリを作成</li>
          <li>Bearer Tokenを取得</li>
          <li>下記フォームに必要情報を入力</li>
        </ol>
      </div>

      <div className="input-section">
        <h3>🔑 API認証情報</h3>

        <div className="info">
          <strong>ℹ️ 注意:</strong>{" "}
          大きなリストの場合、全メンバーの取得に時間がかかる場合があります。
          最大5000人まで取得可能です（安全制限）。
        </div>

        <div className="warning">
          <strong>⚠️ レート制限について:</strong> Twitter
          APIには15分間で最大75回のリクエスト制限があります。
          大きなリストの場合、自動的に待機時間を設けて取得を続行します。 "Too
          Many
          Requests"エラーが発生した場合は、15分程度時間をおいてから再試行してください。
        </div>

        <div className="form-group">
          <label htmlFor="bearerToken">Bearer Token *</label>
          <input
            type="text"
            id="bearerToken"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="listId">リストID *</label>
          <input
            type="text"
            id="listId"
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            placeholder="1234567890123456789"
          />
          <small>
            リストURLの数字部分: https://twitter.com/i/lists/
            <strong>1234567890123456789</strong>
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="maxRequests">最大リクエスト数 (レート制限対策)</label>
          <select
            id="maxRequests"
            value={maxRequests}
            onChange={(e) => setMaxRequests(parseInt(e.target.value))}
            style={{
              width: "100%",
              padding: "12px 15px",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "14px",
              background: "white",
            }}
          >
            <option value="5">5回 (最大500人) - 最も安全</option>
            <option value="10">10回 (最大1000人) - 安全</option>
            <option value="15">15回 (最大1500人) - 推奨</option>
            <option value="25">25回 (最大2500人) - 中程度</option>
            <option value="50">50回 (最大5000人) - 上級者向け</option>
          </select>
          <small
            style={{ color: "#64748b", marginTop: "5px", display: "block" }}
          >
            レート制限を避けるため、少ない値から始めることをお勧めします
          </small>
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn-primary"
          onClick={handleFetch}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading">
              <div className="spinner"></div>
              {loadingMessage}
            </span>
          ) : (
            "🚀 全メンバー取得"
          )}
        </button>
      </div>
    </div>
  );
};
