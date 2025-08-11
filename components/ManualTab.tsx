import React from "react";

interface ManualTabProps {
  inputData: string;
  onInputChange: (data: string) => void;
}

export const ManualTab: React.FC<ManualTabProps> = ({
  inputData,
  onInputChange,
}) => {
  return (
    <div className="manual-tab">
      <div className="input-section">
        <h3>✋ メンバーデータ手動入力</h3>
        <p style={{ marginBottom: "15px", color: "#64748b" }}>
          各行に「表示名 ユーザー名 プロフィールURL」の形式で入力してください
        </p>
        <textarea
          value={inputData}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="例:&#10;あ01a @user1 https://twitter.com/user1&#10;A-23b 山田太郎 https://twitter.com/yamada&#10;aー45ab @test_user https://twitter.com/test_user"
          rows={10}
        />
      </div>
    </div>
  );
};
