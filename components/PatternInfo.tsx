import React from "react";

export const PatternInfo: React.FC = () => {
  return (
    <div className="pattern-info">
      <h4>🎯 抽出パターン</h4>
      <div className="pattern-examples">
        {`パターン: [あ-んA-Za-z][-ー]?[0-9][0-9][ab]+

変換ルール:
• ハイフン・長音符 (-ー) は削除
• 全角英字は半角に変換
• あ01a → あ01a
• A-23b → A23b
• aー45ab → a45ab`}
      </div>
    </div>
  );
};
