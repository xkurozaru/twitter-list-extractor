export const daysOfWeek = {
  C106: { 1: "土曜日", 2: "日曜日" },
  C107: { 1: "火曜日", 2: "水曜日" },
} as const satisfies DaysOfWeek;

export type EventId = keyof typeof daysOfWeek;
export type DayIndex = 1 | 2;
export type DaysOfWeek = Readonly<
  Record<string, Readonly<Record<DayIndex, string>>>
>;
