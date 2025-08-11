import React, { useState } from "react";
import { TwitterUser } from "../lib/types";

interface ApiTabProps {
  onDataFetched: (data: TwitterUser[]) => void;
}

export const ApiTab: React.FC<ApiTabProps> = ({ onDataFetched }) => {
  const [bearerToken, setBearerToken] = useState("");
  const [listId, setListId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    if (!bearerToken.trim() || !listId.trim()) {
      alert("Bearer Token と リストIDを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/twitter-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bearerToken: bearerToken.trim(),
          listId: listId.trim(),
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onDataFetched(result.data);
        alert(`${result.data.length}人のメンバーを取得しました！`);
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error: any) {
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsLoading(false);
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
              取得中...
            </span>
          ) : (
            "🚀 APIでメンバー取得"
          )}
        </button>
      </div>
    </div>
  );
};
