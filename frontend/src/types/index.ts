export interface Case {
  id: string;
  source: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'closed' | 'pending';
  type: string;
  timestamp: string;
  riskScore: number;
  flaggedKeywords: string[];
  summary: string;
  script: string;
  duration: string;
  related_entities: string[];
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high';
  type: string;
  timestamp: string;
  status: 'new' | 'reviewed' | 'resolved';
  details: string;
}

export interface WatchlistEntry {
  id: string;
  name: string;
  phoneNumber: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastMentioned: string;
}

export interface DashboardMetrics {
  newAlerts: number;
  activeCases: number;
  weeklyResolutionRate: number;
  blockedNumbers: number;
  lastBlockedTimestamp: string;
}