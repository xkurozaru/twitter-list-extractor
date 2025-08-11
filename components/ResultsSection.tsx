import React from "react";
import { ExtractedData } from "../lib/types";

interface ResultsSectionProps {
  data: ExtractedData[];
  inputLineCount: number;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  data,
  inputLineCount,
}) => {
  const matchCount = data.length;
  const matchRate =
    inputLineCount > 0 ? Math.round((matchCount / inputLineCount) * 100) : 0;

  const generateCSVContent = () => {
    let csvContent = "抽出文字,ユーザー表示名,ユーザーのリンクurl\n";
    data.forEach((item) => {
      csvContent += `"${item.extracted}","${item.displayName}","${item.profileUrl}"\n`;
    });
    return csvContent;
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      alert("まずデータを処理してください");
      return;
    }

    const csvContent = "\ufeff" + generateCSVContent(); // BOM付きでUTF-8エンコーディング
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `twitter_list_extracted_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-section">
      <h3>📊 処理結果</h3>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-number">{inputLineCount}</span>
          <span className="stat-label">総データ数</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{matchCount}</span>
          <span className="stat-label">マッチ数</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{matchRate}%</span>
          <span className="stat-label">マッチ率</span>
        </div>
      </div>

      <div className="button-group">
        <button
          className="btn-secondary"
          onClick={downloadCSV}
          disabled={matchCount === 0}
        >
          📥 CSV ダウンロード
        </button>
      </div>

      <div className="csv-output">{generateCSVContent()}</div>
    </div>
  );
};
