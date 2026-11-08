/**
 * Survey Service
 *
 * Manages user survey data collection, storage, and export
 * for the PWA caching strategy research study.
 */

import { SUSResult } from '../components/SUSQuestionnaire';
import { PWAExperienceResult } from '../components/PWAExperienceQuestionnaire';

export interface ParticipantSession {
  sessionId: string;
  participantId: string;
  startTime: number;
  endTime?: number;
  strategiesTested: string[];
  susResults: SUSResult[];
  experienceResults: PWAExperienceResult[];
  demographics?: DemographicData;
}

export interface DemographicData {
  ageGroup: string;
  techProficiency: 'low' | 'medium' | 'high';
  deviceUsageHours: number;
  primaryDevice: 'mobile' | 'tablet' | 'desktop';
  browserPreference: string;
}

export interface StudyExport {
  exportDate: string;
  totalParticipants: number;
  totalSessions: number;
  sessions: ParticipantSession[];
  aggregateStats: AggregateStats;
}

export interface AggregateStats {
  susScoresByStrategy: Record<string, { mean: number; stdDev: number; count: number }>;
  experienceScoresByStrategy: Record<string, {
    perceivedSpeed: number;
    dataFreshness: number;
    offlineExperience: number;
    overallSatisfaction: number;
    count: number;
  }>;
}

const STORAGE_KEY = 'pwa_research_survey_data';

class SurveyService {
  private sessions: ParticipantSession[] = [];
  private currentSession: ParticipantSession | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = data.sessions || [];
      }
    } catch (e) {
      console.warn('Failed to load survey data from storage:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessions: this.sessions,
        lastUpdated: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to save survey data to storage:', e);
    }
  }

  startSession(participantId?: string): ParticipantSession {
    const session: ParticipantSession = {
      sessionId: `S${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participantId: participantId || `P${Date.now()}`,
      startTime: Date.now(),
      strategiesTested: [],
      susResults: [],
      experienceResults: []
    };

    this.currentSession = session;
    return session;
  }

  getCurrentSession(): ParticipantSession | null {
    return this.currentSession;
  }

  setDemographics(demographics: DemographicData): void {
    if (this.currentSession) {
      this.currentSession.demographics = demographics;
    }
  }

  addSUSResult(result: SUSResult): void {
    if (this.currentSession) {
      this.currentSession.susResults.push(result);
      if (!this.currentSession.strategiesTested.includes(result.strategyTested)) {
        this.currentSession.strategiesTested.push(result.strategyTested);
      }
    }
  }

  addExperienceResult(result: PWAExperienceResult): void {
    if (this.currentSession) {
      this.currentSession.experienceResults.push(result);
      if (!this.currentSession.strategiesTested.includes(result.strategyTested)) {
        this.currentSession.strategiesTested.push(result.strategyTested);
      }
    }
  }

  endSession(): ParticipantSession | null {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.sessions.push(this.currentSession);
      this.saveToStorage();

      const completedSession = this.currentSession;
      this.currentSession = null;
      return completedSession;
    }
    return null;
  }

  getAllSessions(): ParticipantSession[] {
    return [...this.sessions];
  }

  getSessionCount(): number {
    return this.sessions.length;
  }

  calculateAggregateStats(): AggregateStats {
    const susScores: Record<string, number[]> = {};
    const expScores: Record<string, PWAExperienceResult['dimensions'][]> = {};

    for (const session of this.sessions) {
      for (const sus of session.susResults) {
        if (!susScores[sus.strategyTested]) {
          susScores[sus.strategyTested] = [];
        }
        susScores[sus.strategyTested].push(sus.score);
      }

      for (const exp of session.experienceResults) {
        if (!expScores[exp.strategyTested]) {
          expScores[exp.strategyTested] = [];
        }
        expScores[exp.strategyTested].push(exp.dimensions);
      }
    }

    const susScoresByStrategy: AggregateStats['susScoresByStrategy'] = {};
    for (const [strategy, scores] of Object.entries(susScores)) {
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
      susScoresByStrategy[strategy] = {
        mean,
        stdDev: Math.sqrt(variance),
        count: scores.length
      };
    }

    const experienceScoresByStrategy: AggregateStats['experienceScoresByStrategy'] = {};
    for (const [strategy, dimensions] of Object.entries(expScores)) {
      const avgDims = {
        perceivedSpeed: 0,
        dataFreshness: 0,
        offlineExperience: 0,
        overallSatisfaction: 0
      };

      for (const dim of dimensions) {
        avgDims.perceivedSpeed += dim.perceivedSpeed.average;
        avgDims.dataFreshness += dim.dataFreshness.average;
        avgDims.offlineExperience += dim.offlineExperience.average;
        avgDims.overallSatisfaction += dim.overallSatisfaction.average;
      }

      const count = dimensions.length;
      experienceScoresByStrategy[strategy] = {
        perceivedSpeed: avgDims.perceivedSpeed / count,
        dataFreshness: avgDims.dataFreshness / count,
        offlineExperience: avgDims.offlineExperience / count,
        overallSatisfaction: avgDims.overallSatisfaction / count,
        count
      };
    }

    return { susScoresByStrategy, experienceScoresByStrategy };
  }

  exportData(): StudyExport {
    const uniqueParticipants = new Set(this.sessions.map(s => s.participantId));

    return {
      exportDate: new Date().toISOString(),
      totalParticipants: uniqueParticipants.size,
      totalSessions: this.sessions.length,
      sessions: this.sessions,
      aggregateStats: this.calculateAggregateStats()
    };
  }

  downloadExport(filename?: string): void {
    const data = this.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `survey-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadCSV(): void {
    // Export SUS results as CSV
    let susCSV = 'SessionID,ParticipantID,Strategy,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10,Score,Rating,Timestamp\n';

    for (const session of this.sessions) {
      for (const sus of session.susResults) {
        susCSV += [
          session.sessionId,
          session.participantId,
          sus.strategyTested,
          ...sus.responses,
          sus.score.toFixed(2),
          sus.rating,
          new Date(sus.timestamp).toISOString()
        ].join(',') + '\n';
      }
    }

    const susBlob = new Blob([susCSV], { type: 'text/csv' });
    const susUrl = URL.createObjectURL(susBlob);
    const susLink = document.createElement('a');
    susLink.href = susUrl;
    susLink.download = `sus-results-${Date.now()}.csv`;
    susLink.click();

    // Export Experience results as CSV
    let expCSV = 'SessionID,ParticipantID,Strategy,PerceivedSpeedAvg,DataFreshnessAvg,OfflineExpAvg,SatisfactionAvg,TotalScore,PercentageScore,Timestamp\n';

    for (const session of this.sessions) {
      for (const exp of session.experienceResults) {
        expCSV += [
          session.sessionId,
          exp.participantId,
          exp.strategyTested,
          exp.dimensions.perceivedSpeed.average.toFixed(2),
          exp.dimensions.dataFreshness.average.toFixed(2),
          exp.dimensions.offlineExperience.average.toFixed(2),
          exp.dimensions.overallSatisfaction.average.toFixed(2),
          exp.totalScore,
          exp.percentageScore.toFixed(2),
          new Date(exp.timestamp).toISOString()
        ].join(',') + '\n';
      }
    }

    const expBlob = new Blob([expCSV], { type: 'text/csv' });
    const expUrl = URL.createObjectURL(expBlob);
    const expLink = document.createElement('a');
    expLink.href = expUrl;
    expLink.download = `experience-results-${Date.now()}.csv`;
    expLink.click();
  }

  clearAllData(): void {
    if (confirm('This will delete all survey data. Are you sure?')) {
      this.sessions = [];
      this.currentSession = null;
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const surveyService = new SurveyService();
