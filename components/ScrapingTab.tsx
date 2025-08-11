import React, { useState } from "react";
import { TwitterUser } from "../lib/types";

interface ScrapingTabProps {
  onDataFetched: (data: TwitterUser[]) => void;
}

export const ScrapingTab: React.FC<ScrapingTabProps> = ({ onDataFetched }) => {
  const [listUrl, setListUrl] = useState("");
  const [maxMembers, setMaxMembers] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetch = async () => {
    if (!listUrl.trim()) {
      alert("リストURLを入力してください");
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
    <div className="scraping-tab">
      <div className="warning">
        <strong>⚠️ 注意:</strong>{" "}
        スクレイピング機能はTwitterの利用規約に注意して使用してください。
        レート制限やアクセス制限にかかる可能性があります。
      </div>

      <div className="input-section">
        <h3>🕷️ スクレイピング設定</h3>

        <div className="form-group">
          <label htmlFor="listUrl">リストURL *</label>
          <input
            type="url"
            id="listUrl"
            value={listUrl}
            onChange={(e) => setListUrl(e.target.value)}
            placeholder="https://twitter.com/username/lists/listname"
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxMembers">最大取得数</label>
          <input
            type="number"
            id="maxMembers"
            value={maxMembers}
            onChange={(e) => setMaxMembers(parseInt(e.target.value) || 100)}
            min="1"
            max="1000"
            placeholder="100"
          />
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
            "🔍 スクレイピングで取得"
          )}
        </button>
      </div>
    </div>
  );
};
