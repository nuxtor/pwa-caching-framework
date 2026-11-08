export type CachingStrategy =
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

export interface CacheMetric {
  url: string;
  strategy: CachingStrategy;
  duration: number;
  fromCache: boolean;
  timestamp: number;
}

export interface PerformanceReport {
  strategy: CachingStrategy;
  metrics: {
    avgLoadTime: number;
    cacheHitRate: number;
    totalRequests: number;
    p95LoadTime: number;
  };
  networkCondition: string;
  timestamp: number;
}

export interface UserSurveyResponse {
  participantId: string;
  strategy: CachingStrategy;
  perceivedSpeed: number; // 1-5
  dataFreshness: number; // 1-5
  offlineExperience: number; // 1-5
  overallSatisfaction: number; // 1-5
  comments?: string;
}
