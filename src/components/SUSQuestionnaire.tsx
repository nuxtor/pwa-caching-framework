import { useState } from 'react';

/**
 * System Usability Scale (SUS) Questionnaire
 *
 * Standard 10-item questionnaire developed by John Brooke (1996)
 * Produces a score from 0-100 where:
 * - Below 50: Poor
 * - 50-67: OK
 * - 68-80: Good
 * - Above 80: Excellent
 */

interface SUSQuestionnaireProps {
  strategyName: string;
  onComplete: (results: SUSResult) => void;
  onCancel?: () => void;
}

export interface SUSResult {
  strategyTested: string;
  responses: number[];
  score: number;
  rating: 'Poor' | 'OK' | 'Good' | 'Excellent';
  timestamp: number;
}

// Standard SUS questions - odd questions are positive, even are negative
const SUS_QUESTIONS = [
  "I think that I would like to use this application frequently.",
  "I found the application unnecessarily complex.",
  "I thought the application was easy to use.",
  "I think that I would need the support of a technical person to be able to use this application.",
  "I found the various functions in this application were well integrated.",
  "I thought there was too much inconsistency in this application.",
  "I would imagine that most people would learn to use this application very quickly.",
  "I found the application very cumbersome to use.",
  "I felt very confident using the application.",
  "I needed to learn a lot of things before I could get going with this application."
];

const LIKERT_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree'
];

function calculateSUSScore(responses: number[]): number {
  // SUS scoring:
  // For odd questions (1,3,5,7,9): score = response - 1
  // For even questions (2,4,6,8,10): score = 5 - response
  // Sum all scores and multiply by 2.5 to get 0-100 scale

  let total = 0;
  for (let i = 0; i < responses.length; i++) {
    if (i % 2 === 0) {
      // Odd questions (0-indexed: 0,2,4,6,8)
      total += responses[i] - 1;
    } else {
      // Even questions (0-indexed: 1,3,5,7,9)
      total += 5 - responses[i];
    }
  }
  return total * 2.5;
}

function getSUSRating(score: number): 'Poor' | 'OK' | 'Good' | 'Excellent' {
  if (score < 50) return 'Poor';
  if (score < 68) return 'OK';
  if (score < 80) return 'Good';
  return 'Excellent';
}

export function SUSQuestionnaire({ strategyName, onComplete, onCancel }: SUSQuestionnaireProps) {
  const [responses, setResponses] = useState<number[]>(new Array(10).fill(0));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleResponse = (value: number) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = value;
    setResponses(newResponses);

    // Auto-advance to next question
    if (currentQuestion < 9) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const handleSubmit = () => {
    const score = calculateSUSScore(responses);
    const result: SUSResult = {
      strategyTested: strategyName,
      responses,
      score,
      rating: getSUSRating(score),
      timestamp: Date.now()
    };
    setShowResults(true);
    onComplete(result);
  };

  const isComplete = responses.every(r => r > 0);
  const progress = (responses.filter(r => r > 0).length / 10) * 100;

  if (showResults) {
    const score = calculateSUSScore(responses);
    const rating = getSUSRating(score);

    return (
      <div style={styles.container}>
        <h2>SUS Results</h2>
        <div style={styles.resultCard}>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreValue}>{score.toFixed(0)}</span>
            <span style={styles.scoreLabel}>/ 100</span>
          </div>
          <div style={{
            ...styles.ratingBadge,
            background: rating === 'Excellent' ? '#0cce6b' :
                       rating === 'Good' ? '#87ceeb' :
                       rating === 'OK' ? '#ffa400' : '#ff4e42'
          }}>
            {rating}
          </div>
          <p style={{ color: '#666', marginTop: '15px' }}>
            Strategy tested: <strong>{strategyName}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>System Usability Scale (SUS)</h2>
        <p style={{ color: '#666' }}>
          Testing: <strong>{strategyName}</strong>
        </p>
      </div>

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
      </div>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
        Question {currentQuestion + 1} of 10
      </p>

      {/* Question navigation */}
      <div style={styles.questionNav}>
        {SUS_QUESTIONS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentQuestion(idx)}
            style={{
              ...styles.navDot,
              background: responses[idx] > 0 ? '#0066cc' : '#ddd',
              border: currentQuestion === idx ? '2px solid #003d7a' : 'none'
            }}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Current question */}
      <div style={styles.questionCard}>
        <p style={styles.questionText}>
          {currentQuestion + 1}. {SUS_QUESTIONS[currentQuestion]}
        </p>

        <div style={styles.likertContainer}>
          {LIKERT_LABELS.map((label, idx) => (
            <button
              key={idx}
              onClick={() => handleResponse(idx + 1)}
              style={{
                ...styles.likertButton,
                background: responses[currentQuestion] === idx + 1 ? '#0066cc' : '#f5f5f5',
                color: responses[currentQuestion] === idx + 1 ? 'white' : '#333'
              }}
            >
              <span style={styles.likertNumber}>{idx + 1}</span>
              <span style={styles.likertLabel}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div style={styles.buttonRow}>
        {onCancel && (
          <button onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
        )}
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          style={{ ...styles.navButton, opacity: currentQuestion === 0 ? 0.5 : 1 }}
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentQuestion(Math.min(9, currentQuestion + 1))}
          disabled={currentQuestion === 9}
          style={{ ...styles.navButton, opacity: currentQuestion === 9 ? 0.5 : 1 }}
        >
          Next
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isComplete}
          style={{
            ...styles.submitButton,
            opacity: isComplete ? 1 : 0.5,
            cursor: isComplete ? 'pointer' : 'not-allowed'
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
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
  questionNav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px'
  },
  navDot: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: 'white',
    fontWeight: 'bold'
  },
  questionCard: {
    background: '#f9f9f9',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '20px'
  },
  questionText: {
    fontSize: '18px',
    marginBottom: '25px',
    lineHeight: '1.5'
  },
  likertContainer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  likertButton: {
    flex: '1 1 120px',
    padding: '15px 10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px'
  },
  likertNumber: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  likertLabel: {
    fontSize: '11px',
    textAlign: 'center'
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  navButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    background: 'white',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ff4e42',
    borderRadius: '5px',
    background: 'white',
    color: '#ff4e42',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '10px 25px',
    border: 'none',
    borderRadius: '5px',
    background: '#0cce6b',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  resultCard: {
    textAlign: 'center',
    padding: '40px',
    background: '#f9f9f9',
    borderRadius: '12px'
  },
  scoreCircle: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#333'
  },
  scoreLabel: {
    fontSize: '16px',
    color: '#666'
  },
  ratingBadge: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '8px 20px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px'
  }
};
