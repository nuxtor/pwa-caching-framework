import { useState } from 'react';

/**
 * Custom PWA Experience Questionnaire
 *
 * Measures user perception across four dimensions:
 * - Perceived loading speed (5 items)
 * - Data freshness confidence (3 items)
 * - Offline experience quality (4 items)
 * - Overall satisfaction (3 items)
 *
 * Uses 7-point Likert scale as specified in methodology
 */

interface PWAExperienceProps {
  strategyName: string;
  onComplete: (results: PWAExperienceResult) => void;
  onCancel?: () => void;
}

export interface PWAExperienceResult {
  strategyTested: string;
  participantId: string;
  dimensions: {
    perceivedSpeed: DimensionScore;
    dataFreshness: DimensionScore;
    offlineExperience: DimensionScore;
    overallSatisfaction: DimensionScore;
  };
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  timestamp: number;
  comments?: string;
}

interface DimensionScore {
  responses: number[];
  average: number;
  sum: number;
}

interface QuestionGroup {
  dimension: string;
  questions: string[];
}

const QUESTION_GROUPS: QuestionGroup[] = [
  {
    dimension: 'perceivedSpeed',
    questions: [
      "The application loaded quickly when I first opened it.",
      "Pages and content appeared without noticeable delay.",
      "The application felt responsive when I interacted with it.",
      "Loading times met my expectations for a modern web application.",
      "I did not experience frustrating waits while using the application."
    ]
  },
  {
    dimension: 'dataFreshness',
    questions: [
      "I trust that the data shown was up-to-date and accurate.",
      "I was confident the application was showing me the latest information.",
      "I did not worry about seeing outdated content."
    ]
  },
  {
    dimension: 'offlineExperience',
    questions: [
      "The application would work well if I lost internet connection.",
      "I believe this application could function offline if needed.",
      "The application handled network issues gracefully.",
      "I feel confident using this application in areas with poor connectivity."
    ]
  },
  {
    dimension: 'overallSatisfaction',
    questions: [
      "Overall, I am satisfied with this application's performance.",
      "I would recommend this application to others.",
      "This application provides a good user experience."
    ]
  }
];

const LIKERT_7_LABELS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Somewhat Disagree' },
  { value: 4, label: 'Neutral' },
  { value: 5, label: 'Somewhat Agree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly Agree' }
];

const ALL_QUESTIONS = QUESTION_GROUPS.flatMap(g => g.questions);
const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

export function PWAExperienceQuestionnaire({ strategyName, onComplete, onCancel }: PWAExperienceProps) {
  const [responses, setResponses] = useState<number[]>(new Array(TOTAL_QUESTIONS).fill(0));
  const [participantId, setParticipantId] = useState('');
  const [comments, setComments] = useState('');
  const [currentSection, setCurrentSection] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<PWAExperienceResult | null>(null);

  const getQuestionIndex = (sectionIdx: number, questionIdx: number): number => {
    let idx = 0;
    for (let i = 0; i < sectionIdx; i++) {
      idx += QUESTION_GROUPS[i].questions.length;
    }
    return idx + questionIdx;
  };

  const handleResponse = (sectionIdx: number, questionIdx: number, value: number) => {
    const newResponses = [...responses];
    newResponses[getQuestionIndex(sectionIdx, questionIdx)] = value;
    setResponses(newResponses);
  };

  const calculateResults = (): PWAExperienceResult => {
    let responseIdx = 0;
    const dimensions: PWAExperienceResult['dimensions'] = {
      perceivedSpeed: { responses: [], average: 0, sum: 0 },
      dataFreshness: { responses: [], average: 0, sum: 0 },
      offlineExperience: { responses: [], average: 0, sum: 0 },
      overallSatisfaction: { responses: [], average: 0, sum: 0 }
    };

    for (const group of QUESTION_GROUPS) {
      const dimKey = group.dimension as keyof typeof dimensions;
      const dimResponses: number[] = [];

      for (let i = 0; i < group.questions.length; i++) {
        dimResponses.push(responses[responseIdx]);
        responseIdx++;
      }

      const sum = dimResponses.reduce((a, b) => a + b, 0);
      dimensions[dimKey] = {
        responses: dimResponses,
        sum,
        average: sum / dimResponses.length
      };
    }

    const totalScore = responses.reduce((a, b) => a + b, 0);
    const maxPossible = TOTAL_QUESTIONS * 7;

    return {
      strategyTested: strategyName,
      participantId: participantId || `P${Date.now()}`,
      dimensions,
      totalScore,
      maxPossibleScore: maxPossible,
      percentageScore: (totalScore / maxPossible) * 100,
      timestamp: Date.now(),
      comments: comments || undefined
    };
  };

  const handleSubmit = () => {
    const result = calculateResults();
    setResults(result);
    setShowResults(true);
    onComplete(result);
  };

  const isComplete = responses.every(r => r > 0);
  const answeredCount = responses.filter(r => r > 0).length;
  const progress = (answeredCount / TOTAL_QUESTIONS) * 100;

  const currentGroup = QUESTION_GROUPS[currentSection];
  const sectionStartIdx = QUESTION_GROUPS.slice(0, currentSection)
    .reduce((sum, g) => sum + g.questions.length, 0);

  if (showResults && results) {
    return (
      <div style={styles.container}>
        <h2>Survey Complete</h2>
        <div style={styles.resultsGrid}>
          {Object.entries(results.dimensions).map(([key, dim]) => (
            <div key={key} style={styles.dimensionCard}>
              <h4 style={styles.dimensionTitle}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </h4>
              <div style={styles.dimensionScore}>
                {dim.average.toFixed(1)} <span style={{ fontSize: '14px', color: '#666' }}>/ 7</span>
              </div>
              <div style={styles.dimensionBar}>
                <div style={{ ...styles.dimensionFill, width: `${(dim.average / 7) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div style={styles.totalScore}>
          Overall Score: <strong>{results.percentageScore.toFixed(1)}%</strong>
        </div>
        <p style={{ textAlign: 'center', color: '#666' }}>
          Strategy tested: <strong>{strategyName}</strong>
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>PWA Experience Survey</h2>
        <p style={{ color: '#666' }}>
          Testing: <strong>{strategyName}</strong>
        </p>
      </div>

      {/* Participant ID */}
      {currentSection === 0 && (
        <div style={styles.participantInput}>
          <label>Participant ID (optional):</label>
          <input
            type="text"
            value={participantId}
            onChange={(e) => setParticipantId(e.target.value)}
            placeholder="e.g., P001"
            style={styles.input}
          />
        </div>
      )}

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
      </div>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
        {answeredCount} of {TOTAL_QUESTIONS} questions answered
      </p>

      {/* Section tabs */}
      <div style={styles.sectionTabs}>
        {QUESTION_GROUPS.map((group, idx) => {
          const sectionStart = QUESTION_GROUPS.slice(0, idx).reduce((s, g) => s + g.questions.length, 0);
          const sectionEnd = sectionStart + group.questions.length;
          const sectionAnswered = responses.slice(sectionStart, sectionEnd).filter(r => r > 0).length;
          const sectionComplete = sectionAnswered === group.questions.length;

          return (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              style={{
                ...styles.sectionTab,
                background: currentSection === idx ? '#0066cc' : sectionComplete ? '#e8f5e9' : '#f5f5f5',
                color: currentSection === idx ? 'white' : '#333',
                borderColor: sectionComplete ? '#0cce6b' : '#ddd'
              }}
            >
              {group.dimension.replace(/([A-Z])/g, ' $1').trim()}
              {sectionComplete && ' ✓'}
            </button>
          );
        })}
      </div>

      {/* Current section questions */}
      <div style={styles.sectionCard}>
        <h3 style={styles.sectionTitle}>
          {currentGroup.dimension.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
        </h3>

        {currentGroup.questions.map((question, qIdx) => {
          const globalIdx = sectionStartIdx + qIdx;
          return (
            <div key={qIdx} style={styles.questionBlock}>
              <p style={styles.questionText}>
                {globalIdx + 1}. {question}
              </p>
              <div style={styles.likertRow}>
                {LIKERT_7_LABELS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleResponse(currentSection, qIdx, value)}
                    title={label}
                    style={{
                      ...styles.likertCircle,
                      background: responses[globalIdx] === value ? '#0066cc' : '#f0f0f0',
                      color: responses[globalIdx] === value ? 'white' : '#333',
                      transform: responses[globalIdx] === value ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div style={styles.likertLabels}>
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments (on last section) */}
      {currentSection === QUESTION_GROUPS.length - 1 && (
        <div style={styles.commentsSection}>
          <label>Additional comments (optional):</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Any additional feedback about your experience..."
            style={styles.textarea}
          />
        </div>
      )}

      {/* Navigation */}
      <div style={styles.buttonRow}>
        {onCancel && (
          <button onClick={onCancel} style={styles.cancelButton}>Cancel</button>
        )}
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          style={{ ...styles.navButton, opacity: currentSection === 0 ? 0.5 : 1 }}
        >
          Previous Section
        </button>
        {currentSection < QUESTION_GROUPS.length - 1 ? (
          <button
            onClick={() => setCurrentSection(currentSection + 1)}
            style={styles.navButton}
          >
            Next Section
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            style={{
              ...styles.submitButton,
              opacity: isComplete ? 1 : 0.5,
              cursor: isComplete ? 'pointer' : 'not-allowed'
            }}
          >
            Submit Survey
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  participantInput: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  input: {
    marginLeft: '10px',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  progressContainer: {
    height: '8px',
    background: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressBar: {
    height: '100%',
    background: '#0066cc',
    transition: 'width 0.3s ease'
  },
  sectionTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  sectionTab: {
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s'
  },
  sectionCard: {
    background: '#f9f9f9',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px'
  },
  sectionTitle: {
    marginBottom: '25px',
    paddingBottom: '15px',
    borderBottom: '1px solid #ddd'
  },
  questionBlock: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  questionText: {
    fontSize: '16px',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  likertRow: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '400px',
    margin: '0 auto'
  },
  likertCircle: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  likertLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: '400px',
    margin: '10px auto 0',
    fontSize: '12px',
    color: '#666'
  },
  commentsSection: {
    marginBottom: '20px'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginTop: '10px',
    resize: 'vertical'
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  navButton: {
    padding: '12px 25px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelButton: {
    padding: '12px 25px',
    border: '1px solid #ff4e42',
    borderRadius: '5px',
    background: 'white',
    color: '#ff4e42',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '12px 30px',
    border: 'none',
    borderRadius: '5px',
    background: '#0cce6b',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px'
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  dimensionCard: {
    background: '#f9f9f9',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center'
  },
  dimensionTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px'
  },
  dimensionScore: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  dimensionBar: {
    height: '8px',
    background: '#eee',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  dimensionFill: {
    height: '100%',
    background: '#0066cc',
    transition: 'width 0.3s'
  },
  totalScore: {
    textAlign: 'center',
    fontSize: '20px',
    padding: '15px',
    background: '#e6f0ff',
    borderRadius: '8px',
    marginBottom: '15px'
  }
};
