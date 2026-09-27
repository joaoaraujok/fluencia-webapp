import { UserRole } from './auth';
import { SchoolClass, Student } from './school';
import { EvaluationSession } from './evaluation';

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface AnalyticsOverviewResponse {
  totals: {
    schools: number;
    classes: number;
    students: number;
    evaluations: number;
  };
  averages: {
    accuracy: number;
    responseTimeMs: number;
  };
  recentEvaluations: Array<{
    id: string;
    createdAt: string | Date;
    accuracyPercentage: number;
    averageResponseTimeMs: number;
    student?: { id: string; name: string };
    class?: { id: string; name: string };
    school?: { id: string; name: string };
  }>;
}

export interface StudentReportResponse {
  student: Student;
  totalEvaluations: number;
  latestEvaluation?: EvaluationSession | null;
  history: EvaluationSession[];
  message?: string;
}

export interface ClassReportResponse {
  class: SchoolClass;
  metrics: {
    totalStudents: number;
    evaluatedCount: number;
    pendingCount: number;
    averageAccuracy: number;
    averageTimeMs: number;
  };
  students: Array<{
    id: string;
    name: string;
    registrationNumber?: string | null;
    hasEvaluation: boolean;
    latestEvaluation: {
      id: string;
      date: string | Date;
      accuracyPercentage: number;
      averageResponseTimeMs: number;
      correctCount: number;
      totalItems: number;
    } | null;
  }>;
}

export interface AudioAnalysisResponse {
  transcript: string;
  status: 'CORRETO' | 'POSSIVELMENTE_CORRETO' | 'INCORRETO' | 'SEM_RESPOSTA';
  similarity: number;
  observedError?: string;
  phonemeFindings?: string[];
  pedagogicalNote?: string;
  duration?: number;
}

export interface SessionSynthesisResponse {
  executiveSummary: string;
  recommendations: string[];
  strengths: string[];
}
