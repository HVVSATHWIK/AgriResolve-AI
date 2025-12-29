
export enum AssessmentStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PERCEIVING = 'PERCEIVING',
  EVALUATING = 'EVALUATING',
  DEBATING = 'DEBATING',
  ARBITRATING = 'ARBITRATING',
  EXPLAINING = 'EXPLAINING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Re-export specific agent types for UI use if needed
export type { VisionEvidence } from './services/agents/VisionEvidenceAgent';
export type { QualityReport } from './services/agents/QualityEvaluator';
export type { HypothesisResult } from './services/agents/HealthyHypothesisAgent';
export type { ArbitrationResult, DecisionState } from './services/agents/ArbitrationAgent';

// Comprehensive Assessment Data covering all agents
export interface AssessmentData {
  imageUrl: string | null;
  // Agent Outputs
  visionEvidence: any; // Ideally typed as VisionEvidence
  quality: any;        // Ideally typed as QualityReport
  healthyResult: any;  // Ideally typed as HypothesisResult
  diseaseResult: any;  // Ideally typed as HypothesisResult
  arbitrationResult: any; // Ideally typed as ArbitrationResult
  explanation: {
    summary: string;
    guidance: string[];
  };
}
