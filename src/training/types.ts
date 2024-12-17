export interface TrainingConfig {
  dataDir: string;
  personality: string;
  model: string;
  batchSize?: number;
}

export interface TrainingData {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: Date;
    category: string;
  };
}

export interface Summary {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: Date;
    category: string;
  };
  originalDocuments: string[]; // IDs des documents originaux
}

export interface ConsolidatedKnowledge {
  concepts: Record<string, string>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

export interface TrainingSession {
  basePrompt: string;
  contextWindow: {
    shortTerm: TrainingData[];
    mediumTerm: Summary[];
    longTerm: ConsolidatedKnowledge;
  };
  metadata: {
    sessionId: string;
    startTime: Date;
    category: string;
  };
} 