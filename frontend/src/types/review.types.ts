export interface ReviewRequest {
  code: string;
  language: string;
  fileName?: string;
}

export interface ReviewIssue {
  id: string;
  type: 'security' | 'performance' | 'style' | 'logic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  message: string;
  suggestion: string;
}

export interface ReviewResponse {
  id: string;
  score: number;
  summary: string;
  language: string;
  issues: ReviewIssue[];
  suggestions: string[];
  createdAt: string;
}
