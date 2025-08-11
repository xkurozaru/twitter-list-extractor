import { useState } from "react";
import { ApiTab } from "../components/ApiTab";
import { ManualTab } from "../components/ManualTab";
import { PatternInfo } from "../components/PatternInfo";
import { ResultsSection } from "../components/ResultsSection";
import { ScrapingTab } from "../components/ScrapingTab";
import { extractAndConvertPattern } from "../lib/patternExtractor";
import { ExtractedData, TwitterUser } from "../lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"api" | "scraping" | "manual">(
    "api"
  );
  const [inputData, setInputData] = useState("");
  const [processedData, setProcessedData] = useState<ExtractedData[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleDataFetched = (members: TwitterUser[]) => {
    const inputText = members
      .map(
        (member) =>
          `${member.displayName} ${member.username} ${member.profileUrl}`
      )
      .join("\n");

    setInputData(inputText);
    setActiveTab("manual");
  };

  const processData = () => {
    if (!inputData.trim()) {
      alert("データを入力してください");
      return;
    }

    const lines = inputData.split("\n").filter((line) => line.trim());
    const newProcessedData: ExtractedData[] = [];

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const displayName = parts[0];
        const username = parts[1];
        const profileUrl = parts.slice(2).join(" ");

        const matches = extractAndConvertPattern(displayName);

        if (matches.length > 0) {
          matches.forEach((match) => {
            newProcessedData.push({
              extracted: match.converted,
              displayName: displayName,
              profileUrl: profileUrl,
            });
          });
        }
      }
    });

    setProcessedData(newProcessedData);
    setShowResults(true);
  };

  const clearAll = () => {
    setInputData("");
    setProcessedData([]);
    setShowResults(false);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🐦 Twitter自動リスト抽出ツール</h1>
        <p>
          Twitterリストメンバーを自動取得し、特定パターンを抽出してスプレッドシート形式で出力
        </p>
      </div>

      <div className="content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "api" ? "active" : ""}`}
            onClick={() => setActiveTab("api")}
          >
            🔑 API取得
          </button>
          <button
            className={`tab ${activeTab === "scraping" ? "active" : ""}`}
            onClick={() => setActiveTab("scraping")}
          >
            🕷️ スクレイピング
          </button>
          <button
            className={`tab ${activeTab === "manual" ? "active" : ""}`}
            onClick={() => setActiveTab("manual")}
          >
            ✋ 手動入力
          </button>
        </div>

        {activeTab === "api" && <ApiTab onDataFetched={handleDataFetched} />}
        {activeTab === "scraping" && (
          <ScrapingTab onDataFetched={handleDataFetched} />
        )}
        {activeTab === "manual" && (
          <ManualTab inputData={inputData} onInputChange={setInputData} />
        )}

        <PatternInfo />

        <div className="button-group">
          <button className="btn-primary" onClick={processData}>
            🔍 パターン抽出処理
          </button>
          <button className="btn-clear" onClick={clearAll}>
            🗑️ すべてクリア
          </button>
        </div>

        {showResults && (
          <ResultsSection
            data={processedData}
            inputLineCount={
              inputData.split("\n").filter((line) => line.trim()).length
            }
          />
        )}
      </div>
    </div>
  );
}
