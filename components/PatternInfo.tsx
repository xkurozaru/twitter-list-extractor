import React from "react";

export const PatternInfo: React.FC = () => {
  return (
    <div className="pattern-info">
      <h4>🎯 抽出パターン</h4>
      <div className="pattern-examples">
        {`コミケ配置場所から以下のパターンを抽出します:

抽出例:
• 西2す-16a → す16a
• 東モ23b → モ23b
• 南"ｓ"05a → ｓ05a
• 7Q-05b → Q05b
• R45b → R45b

日程変換:
• 土曜、土曜日 → 1日目
• 日曜、日曜日 → 2日目
• 1日目、一日目 → 1日目
• 2日目、二日目 → 2日目
• 両方含む場合 → 両日

マッチしない場合は空欄で出力されます。`}
      </div>
    </div>
  );
};
