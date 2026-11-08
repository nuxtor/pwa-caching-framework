import { useState } from 'react';
import { SUSQuestionnaire, SUSResult } from './SUSQuestionnaire';
import { PWAExperienceQuestionnaire, PWAExperienceResult } from './PWAExperienceQuestionnaire';
import { surveyService } from '../services/surveyService';
import { CachingStrategy } from '../types';

interface SurveyPanelProps {
  currentStrategy: CachingStrategy;
  onClose?: () => void;
}

type SurveyStep = 'intro' | 'sus' | 'experience' | 'complete';

const STRATEGY_LABELS: Record<CachingStrategy, string> = {
  'cache-first': 'Cache First',
  'network-first': 'Network First',
  'stale-while-revalidate': 'Stale While Revalidate',
  'network-only': 'Network Only',
  'cache-only': 'Cache Only'
};

export function SurveyPanel({ currentStrategy, onClose }: SurveyPanelProps) {
  const [step, setStep] = useState<SurveyStep>('intro');
  const [participantId, setParticipantId] = useState('');
  const [susResult, setSusResult] = useState<SUSResult | null>(null);
  const [expResult, setExpResult] = useState<PWAExperienceResult | null>(null);

  const strategyLabel = STRATEGY_LABELS[currentStrategy];

  const handleStart = () => {
    surveyService.startSession(participantId || undefined);
    setStep('sus');
  };

  const handleSUSComplete = (result: SUSResult) => {
    setSusResult(result);
    surveyService.addSUSResult(result);
    // Small delay before moving to next questionnaire
    setTimeout(() => setStep('experience'), 1500);
  };

  const handleExperienceComplete = (result: PWAExperienceResult) => {
    setExpResult(result);
    surveyService.addExperienceResult(result);
    surveyService.endSession();
    setStep('complete');
  };

  const handleExportData = () => {
    surveyService.downloadExport();
  };

  const handleExportCSV = () => {
    surveyService.downloadCSV();
  };

  const sessionCount = surveyService.getSessionCount();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>×</button>

        {step === 'intro' && (
          <div style={styles.content}>
            <h2>User Experience Survey</h2>
            <div style={styles.infoBox}>
              <p>You are about to evaluate the <strong>{strategyLabel}</strong> caching strategy.</p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                This survey consists of two parts:
              </p>
              <ol style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
                <li>System Usability Scale (SUS) - 10 questions</li>
                <li>PWA Experience Questionnaire - 15 questions</li>
              </ol>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Estimated time: 5-7 minutes
              </p>
            </div>

            <div style={styles.inputGroup}>
              <label>Participant ID:</label>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="e.g., P001 (optional)"
                style={styles.input}
              />
            </div>

            <div style={styles.instructions}>
              <h4>Instructions:</h4>
              <ul>
                <li>Please ensure you have tested the application with the current strategy before starting</li>
                <li>Answer based on your actual experience using the application</li>
                <li>There are no right or wrong answers</li>
                <li>Your responses will be anonymized</li>
              </ul>
            </div>

            <div style={styles.buttonGroup}>
              <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleStart} style={styles.startBtn}>Start Survey</button>
            </div>

            {sessionCount > 0 && (
              <div style={styles.dataInfo}>
                <p>{sessionCount} session(s) recorded</p>
                <button onClick={handleExportData} style={styles.exportBtn}>Export JSON</button>
                <button onClick={handleExportCSV} style={styles.exportBtn}>Export CSV</button>
              </div>
            )}
          </div>
        )}

        {step === 'sus' && (
          <SUSQuestionnaire
            strategyName={strategyLabel}
            onComplete={handleSUSComplete}
            onCancel={() => setStep('intro')}
          />
        )}

        {step === 'experience' && (
          <PWAExperienceQuestionnaire
            strategyName={strategyLabel}
            onComplete={handleExperienceComplete}
            onCancel={() => setStep('intro')}
          />
        )}

        {step === 'complete' && (
          <div style={styles.content}>
            <div style={styles.completeIcon}>✓</div>
            <h2>Thank You!</h2>
            <p>Your responses have been recorded.</p>

            <div style={styles.summaryBox}>
              <h4>Summary</h4>
              <table style={styles.summaryTable}>
                <tbody>
                  <tr>
                    <td>Strategy Tested:</td>
                    <td><strong>{strategyLabel}</strong></td>
                  </tr>
                  {susResult && (
                    <tr>
                      <td>SUS Score:</td>
                      <td><strong>{susResult.score.toFixed(0)}</strong> ({susResult.rating})</td>
                    </tr>
                  )}
                  {expResult && (
                    <tr>
                      <td>Experience Score:</td>
                      <td><strong>{expResult.percentageScore.toFixed(0)}%</strong></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.nextSteps}>
              <p>Would you like to test another strategy?</p>
              <button onClick={() => setStep('intro')} style={styles.anotherBtn}>
                Start Another Survey
              </button>
              <button onClick={onClose} style={styles.doneBtn}>Done</button>
            </div>

            <div style={styles.dataInfo}>
              <button onClick={handleExportData} style={styles.exportBtn}>Export All Data (JSON)</button>
              <button onClick={handleExportCSV} style={styles.exportBtn}>Export All Data (CSV)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    overflow: 'auto'
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    zIndex: 10
  },
  content: {
    padding: '40px'
  },
  infoBox: {
    background: '#f0f7ff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '25px',
    borderLeft: '4px solid #0066cc'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  input: {
    marginLeft: '10px',
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    width: '200px'
  },
  instructions: {
    background: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '25px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center'
  },
  cancelBtn: {
    padding: '12px 30px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px'
  },
  startBtn: {
    padding: '12px 40px',
    border: 'none',
    borderRadius: '5px',
    background: '#0066cc',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  dataInfo: {
    marginTop: '30px',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px',
    textAlign: 'center'
  },
  exportBtn: {
    margin: '5px',
    padding: '8px 15px',
    border: '1px solid #0066cc',
    borderRadius: '5px',
    background: 'white',
    color: '#0066cc',
    cursor: 'pointer',
    fontSize: '13px'
  },
  completeIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#0cce6b',
    color: 'white',
    fontSize: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  summaryBox: {
    background: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '25px 0'
  },
  summaryTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  nextSteps: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  anotherBtn: {
    margin: '10px',
    padding: '12px 25px',
    border: '1px solid #0066cc',
    borderRadius: '5px',
    background: 'white',
    color: '#0066cc',
    cursor: 'pointer',
    fontSize: '14px'
  },
  doneBtn: {
    margin: '10px',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '5px',
    background: '#0cce6b',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};
