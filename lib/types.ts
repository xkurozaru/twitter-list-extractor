export interface TwitterUser {
  displayName: string;
  username: string;
  profileUrl: string;
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
