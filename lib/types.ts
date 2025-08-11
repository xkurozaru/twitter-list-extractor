export interface TwitterUser {
  displayName: string;
  username: string;
  profileUrl: string;
}

export interface ExtractedData {
  extracted: string;
  displayName: string;
  profileUrl: string;
}

export interface PatternMatch {
  original: string;
  converted: string;
  startIndex: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
