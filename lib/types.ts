export interface TwitterList {
  id: string | number;
  name: string;
  username: string;
}

export interface ExtractedData {
  extracted: string;
  displayName: string;
  profileUrl: string;
  day: string; // 1日目, 2日目
}

export interface PatternMatch {
  original: string;
  converted: string;
  startIndex: number;
  day: string; // 1日目, 2日目
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Map機能用の型定義
export interface MapSpace {
  location: string; // 例: "西1-a-01a"
  area: string; // 西, 東, など
  hall: string; // 1, 2, 3, など
  block: string; // a, b, c, など
  spaceNumber: string; // 01, 02, など
  position: "a" | "b" | "ab"; // スペース内の位置
}

export interface MapCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapConfiguration {
  pdfPath: string;
  day: string; // 1日目, 2日目, 3日目
  mapType: "summer" | "winter"; // s (summer) or w (winter)
}
