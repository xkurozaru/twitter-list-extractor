// テスト用スクリプト
function toHalfWidth(str) {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
}

function extractDay(displayName) {
  const normalizedName = toHalfWidth(displayName);
  const days = [];

  // より具体的なパターンを先に評価する

  // 土曜日・土曜を1日目に変換
  if (/土曜日/i.test(normalizedName) || /土曜/i.test(normalizedName)) {
    days.push("1日目");
  }

  // 日曜日・日曜を2日目に変換
  if (/日曜日/i.test(normalizedName) || /日曜/i.test(normalizedName)) {
    days.push("2日目");
  }

  // 明示的な1日目・2日目表記
  if (/[1１一]日目/i.test(normalizedName)) {
    days.push("1日目");
  }

  if (/[2２二]日目/i.test(normalizedName)) {
    days.push("2日目");
  }

  // 単独の「土」「日」（ただし曜日以外のコンテキスト）
  // 前後に文字がない、または記号に囲まれている場合のみ
  if (/(?:^|[^曜])土(?:[^曜]|$)/i.test(normalizedName)) {
    days.push("1日目");
  }

  if (/(?:^|[^曜])日(?:[^曜目]|$)/i.test(normalizedName)) {
    days.push("2日目");
  }

  // 重複を除去してソート
  const uniqueDays = [...new Set(days)].sort();

  if (uniqueDays.length === 0) {
    return ""; // 不明
  } else if (uniqueDays.length === 1) {
    return uniqueDays[0];
  } else {
    // 複数日程の場合は「両日」として返す
    return "両日";
  }
}

// テストケース
const testCases = [
  "ろりちゃーはん2杯目🔞C106土曜 西2す-16a",
  "ｶﾄﾚ~ｾﾞ＠C106(土曜)西つ-18a",
  "長月院 / 土曜日め-28ab",
  "生はむエ駄肉🥩🥜日モ-12ab",
  "racer@C106日曜東R-46b",
  "白麹シヲ🧂日曜日Ｑ-17b",
  "あや@c106日曜二日目東7Ｒ45b",
  "六作＠1日目 東4ア-75ab",
  "shift@C106 ２日目 東7 Q-05b",
  "ときば 2日目東G31b",
  "ガチ盲腸@C106 一日目 西け28b 二日目 東Ｑ24b",
  "柚子れもん・漏不湯(モレズユ)🔞", // 日程情報なし
  "ホトケノザ🔞@土曜日西2さ41", // 土曜日
  "ぢう@一日目 土-西さ45a", // 一日目
];

console.log("日程抽出テスト:");
testCases.forEach((testCase) => {
  const result = extractDay(testCase);
  console.log(`"${testCase}" => "${result}"`);
});
