import { daysOfWeek, EventId } from "./constants";
import { PatternMatch } from "./types";

// コミケ配置場所のパターンマッチングと変換
export function extractAndConvertPattern(
  text: string,
  event: EventId
): PatternMatch[] {
  const resolvedEvent = event;
  const matches: PatternMatch[] = [];

  // 複数のパターンを試行
  const patterns = [
    // パターン1: ブロック記号 + 数字 + ab (例: "こ"-28a)
    /["'“”\s『]*([あ-んア-ンｱ-ﾝA-ZＡ-Ｚa-zａ-ｚ厶])["'“”\s』]*(?:ブロック)?\s*[-ｰ_ー－‐＿]?\s*([0-9０-９]{1,2})\s*[-ｰ_ー－‐＿]?\s*([abａｂ]+)/gi,
  ];
  for (const pattern of patterns) {
    pattern.lastIndex = 0; // リセット
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      let converted = "";

      const block = match[1]; // ブロック記号
      const number = match[2].padStart(2, "0"); // 数字を2桁に
      const ab = match[3]; // ab
      converted = normalizeString(`${block}${number}${ab}`);

      // 重複チェック
      const isDuplicate = matches.some(
        (m) =>
          m.converted === converted &&
          match &&
          Math.abs(m.startIndex - match.index) < 10
      );

      if (!isDuplicate && converted && match) {
        matches.push({
          original: match[0],
          converted: converted,
          startIndex: match.index,
          // 日程は後段で「出現順」ベースで割り当てる
          day: "",
        });
      }
    }
  }

  // 日程トークンと配置トークンを出現順に走査して割り当てる
  applyDaysByOrder(text, matches, resolvedEvent);

  // マッチしなかった場合は空の結果を返す
  if (matches.length === 0) {
    // 全体から日程情報を抽出
    const day = extractDay(text, resolvedEvent);
    return [
      {
        original: "",
        converted: "",
        startIndex: -1,
        day: day,
      },
    ];
  }

  return matches;
}

function applyDaysByOrder(
  text: string,
  matches: PatternMatch[],
  event: EventId
) {
  if (matches.length === 0) return;

  const dayTokens = extractDayTokens(text, event);

  // 欠席が明示されている場合は全て欠席
  if (dayTokens.some((t) => t.day === "欠席")) {
    for (const m of matches) m.day = "欠席";
    return;
  }

  type Token =
    | { kind: "day"; index: number; day: string }
    | { kind: "match"; index: number; match: PatternMatch };

  const tokens: Token[] = [
    ...dayTokens.map((t) => ({
      kind: "day" as const,
      index: t.index,
      day: t.day,
    })),
    ...matches.map((m) => ({
      kind: "match" as const,
      index: m.startIndex,
      match: m,
    })),
  ].sort((a, b) => a.index - b.index);

  const pending: PatternMatch[] = [];
  let currentDay = "";

  for (const token of tokens) {
    if (token.kind === "day") {
      if (pending.length > 0) {
        // 直前に出てきた未割当の配置に、この日程を割り当てる
        const target = pending.shift();
        if (target) target.day = token.day;
        // 「配置→日程」の並びで消費した日程は、その配置専用として扱う
        // （次の配置へは引き継がない）
        continue;
      }
      currentDay = token.day;
      continue;
    }

    // match
    if (token.match.day) continue;
    if (currentDay) {
      token.match.day = currentDay;
    } else {
      // 直後に日程が来るケースのため保留
      pending.push(token.match);
    }
  }

  // まだ未割当があれば、全体から日程を抽出してフォールバック
  if (pending.length > 0) {
    const fallback = extractDay(text, event);
    if (fallback) {
      for (const m of pending) m.day = fallback;
      pending.length = 0;
    }
  }
}

function extractDayTokens(
  text: string,
  event: EventId
): Array<{ day: string; index: number }> {
  const normalized = normalizeString(text);
  const tokens: Array<{ day: string; index: number }> = [];

  // 欠席
  {
    const re = /(欠席|不参加)/gi;
    let m;
    while ((m = re.exec(normalized)) !== null) {
      tokens.push({ day: "欠席", index: m.index });
    }
  }

  // 明示的な日程
  {
    const day1 = /[1１一]日目/gi;
    const day2 = /[2２二]日目/gi;
    let m;
    while ((m = day1.exec(normalized)) !== null)
      tokens.push({ day: "1日目", index: m.index });
    while ((m = day2.exec(normalized)) !== null)
      tokens.push({ day: "2日目", index: m.index });
  }

  // 曜日（開催会に依存）
  const mapping = daysOfWeek[event];
  const d1Full = mapping[1];
  const d2Full = mapping[2];
  const d1Short = d1Full.replace("曜日", "曜");
  const d2Short = d2Full.replace("曜日", "曜");
  const d1Kanji = d1Full[0];
  const d2Kanji = d2Full[0];

  const pushAll = (re: RegExp, day: string) => {
    let m;
    while ((m = re.exec(normalized)) !== null)
      tokens.push({ day, index: m.index });
  };

  pushAll(new RegExp(d1Full, "gi"), "1日目");
  pushAll(new RegExp(d2Full, "gi"), "2日目");
  pushAll(new RegExp(d1Short, "gi"), "1日目");
  pushAll(new RegExp(d2Short, "gi"), "2日目");

  // (火) のような表記
  pushAll(new RegExp(`[（(]${d1Kanji}[)）]`, "g"), "1日目");
  pushAll(new RegExp(`[（(]${d2Kanji}[)）]`, "g"), "2日目");

  // 火東... / 土西... のように、曜日漢字 + 方角 の表記
  // NOTE: C106 の「日」は「土曜日」にも含まれるため、直前が「曜」の場合は除外する
  const pushSingleWithDirection = (kanji: string, day: string) => {
    const re = new RegExp(`(^|[^曜])${kanji}(?=[東西南北])`, "g");
    let m;
    while ((m = re.exec(normalized)) !== null) {
      // 先頭 (^ の場合) は補正不要、[^曜] が入った場合はその1文字分進める
      const offset = m[1] ? m[1].length : 0;
      tokens.push({ day, index: m.index + offset });
    }
  };

  pushSingleWithDirection(d1Kanji, "1日目");
  pushSingleWithDirection(d2Kanji, "2日目");

  return tokens.sort((a, b) => a.index - b.index);
}

// 日程情報を抽出・正規化（複数日程に対応）
export function extractDay(text: string, event: EventId): string {
  const resolvedEvent = event;
  const normalized = normalizeString(text);
  const days: string[] = [];

  // 開催会に基づく曜日マッピング
  const mapping = daysOfWeek[resolvedEvent];
  const day1Full = mapping[1]; // 例: 火曜日
  const day2Full = mapping[2]; // 例: 水曜日
  const day1Short = day1Full.replace("曜日", "曜");
  const day2Short = day2Full.replace("曜日", "曜");
  const day1Kanji = day1Full[0];
  const day2Kanji = day2Full[0];

  // より具体的なパターンを先に評価する

  // 欠席
  if (/欠席|不参加/i.test(normalized)) {
    return "欠席";
  }

  // 開催会に対応した曜日（フル/短縮）を日程に変換
  if (
    new RegExp(`${day1Full}`, "i").test(normalized) ||
    new RegExp(`${day1Short}`, "i").test(normalized)
  ) {
    days.push("1日目");
  }

  if (
    new RegExp(`${day2Full}`, "i").test(normalized) ||
    new RegExp(`${day2Short}`, "i").test(normalized)
  ) {
    days.push("2日目");
  }

  // 明示的な1日目・2日目表記
  if (/[1１一]日目/i.test(normalized)) {
    days.push("1日目");
  }

  if (/[2２二]日目/i.test(normalized)) {
    days.push("2日目");
  }

  // 単独の曜日漢字（ただし曜日以外のコンテキスト）
  // 前後に文字がない、または「曜」に囲まれていない場合のみ
  const singleDay1Pattern = new RegExp(
    `(?:^|[^曜])${day1Kanji}(?:[^曜]|$)`,
    "i"
  );
  const singleDay2Pattern = new RegExp(
    `(?:^|[^曜])${day2Kanji}(?:[^曜]|$)`,
    "i"
  );
  if (singleDay1Pattern.test(normalized)) {
    days.push("1日目");
  }

  if (singleDay2Pattern.test(normalized)) {
    days.push("2日目");
  }

  // 重複を除去してソート
  const uniqueDays = [...new Set(days)].sort();

  if (uniqueDays.length === 0) {
    return ""; // 不明
  } else {
    // 最初に見つかった日程を返す
    return uniqueDays[0];
  }
}

export function normalizeString(str: string): string {
  function toHalfWidth(str: string): string {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    });
  }
  function toFullWidth(str: string): string {
    return str.replace(/[\uFF66-\uFF9D][\uFF9E\uFF9F]?/g, (s) =>
      s.normalize("NFKC")
    );
  }
  function toCommon(str: string): string {
    return str.replace(/厶/g, "ム");
  }

  return toCommon(toFullWidth(toHalfWidth(str)));
}
