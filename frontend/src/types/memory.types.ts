export interface IssueCategory {
  category: string;
  count: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface MemoryInsights {
  recurringWeaknesses: string[];
  topWeakness: string;
  frequentIssueCategories: IssueCategory[];
  improvementTrendScore: number; // 0-100
  totalReviewsAnalyzed: number;
}
