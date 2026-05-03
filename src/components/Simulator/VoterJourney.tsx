import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, MessageSquare } from 'lucide-react';
import { translateText } from '../../services/TranslationService';
import './VoterJourney.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const VOTER_JOURNEY = [
  {
    id: 1,
    emoji: '📋',
    stage: 'Step 1: Voter Registration',
    scenario: `You just turned 18 and want to vote in the upcoming election. Election Day is 45 days away. What should you do FIRST?`,
    choices: [
      {
        id: 'a',
        text: 'Wait until Election Day and register at the polling booth',
        correct: false,
        explanation: '❌ Wrong! Most states require registration 15-30 days BEFORE Election Day. Waiting means you cannot vote. Always register early!'
      },
      {
        id: 'b',
        text: 'Check your eligibility and register online immediately',
        correct: true,
        explanation: '✅ Correct! Registering online now gives you plenty of time before the deadline. Always check eligibility first — age, citizenship, and residency requirements.'
      },
      {
        id: 'c',
        text: 'Ask a friend to register on your behalf',
        correct: false,
        explanation: '❌ Wrong! Voter registration is personal and cannot be done by someone else on your behalf. You must register yourself with your own ID and information.'
      },
      {
        id: 'd',
        text: 'Skip registration — voting is optional anyway',
        correct: false,
        explanation: '❌ Wrong! While voting may be optional in some countries, registration is required to participate. In Australia it is actually compulsory!'
      },
    ]
  },
  {
    id: 2,
    emoji: '🪪',
    stage: 'Step 2: Preparing Your Documents',
    scenario: `Great — you registered successfully! Election Day is next week. You receive a Voter ID card in the mail. What documents should you bring to the polling station?`,
    choices: [
      {
        id: 'a',
        text: 'Nothing — they have my name on the voter list',
        correct: false,
        explanation: '❌ Wrong! You must bring valid ID to verify your identity. Being on the voter list alone is not enough in most places.'
      },
      {
        id: 'b',
        text: 'Only my Voter ID card',
        correct: false,
        explanation: '⚠️ Partially correct — your Voter ID is important, but carrying a backup ID (Aadhaar, passport, driving license) is always recommended in case of any issues.'
      },
      {
        id: 'c',
        text: 'Voter ID card + one backup government ID',
        correct: true,
        explanation: '✅ Correct! Bring your Voter ID as primary document plus a backup like Aadhaar card, passport, or driving license. Being prepared ensures you can vote even if there are minor issues.'
      },
      {
        id: 'd',
        text: 'My school/college ID is enough',
        correct: false,
        explanation: '❌ Wrong! School or college IDs are generally not accepted at polling stations. You need a government-issued photo ID.'
      },
    ]
  },
  {
    id: 3,
    emoji: '📍',
    stage: 'Step 3: Finding Your Polling Station',
    scenario: `Election Day is tomorrow! You need to find where to vote. Your friend says you can vote at any polling station in the city. What do you do?`,
    choices: [
      {
        id: 'a',
        text: 'Trust your friend and go to the nearest polling station',
        correct: false,
        explanation: '❌ Wrong! Your friend is incorrect. You must vote at YOUR assigned polling station based on your registered address. Going to the wrong one means you cannot vote.'
      },
      {
        id: 'b',
        text: 'Look up your assigned polling station on the official election website',
        correct: true,
        explanation: '✅ Correct! Always verify your assigned polling station on the official election commission website using your voter ID number. Never rely on word of mouth.'
      },
      {
        id: 'c',
        text: 'Call a political party office to ask where to vote',
        correct: false,
        explanation: '❌ Wrong! Political party offices are not the right source for this information and may mislead you. Always use official government election websites.'
      },
      {
        id: 'd',
        text: 'Skip voting since finding the location is too confusing',
        correct: false,
        explanation: '❌ Wrong! Finding your polling station takes 2 minutes on the official website. Your vote matters — never skip over something easily resolved!'
      },
    ]
  },
  {
    id: 4,
    emoji: '🗳️',
    stage: 'Step 4: Casting Your Vote',
    scenario: `You arrive at your polling station. After checking in, you receive your ballot. You accidentally mark the wrong candidate. What should you do?`,
    choices: [
      {
        id: 'a',
        text: 'Submit it anyway — close enough',
        correct: false,
        explanation: '❌ Wrong! A wrongly marked ballot may be counted for the wrong candidate or declared invalid. Never submit a ballot you made a mistake on.'
      },
      {
        id: 'b',
        text: 'Try to erase or correct the mark yourself',
        correct: false,
        explanation: '❌ Wrong! Erasing or correcting a ballot yourself makes it invalid. Ballots with corrections are typically rejected during counting.'
      },
      {
        id: 'c',
        text: 'Inform the poll worker and request a replacement ballot',
        correct: true,
        explanation: '✅ Correct! Immediately inform a poll worker. They will spoil your incorrect ballot and issue a fresh one. This is your legal right as a voter!'
      },
      {
        id: 'd',
        text: 'Leave the polling station without submitting',
        correct: false,
        explanation: '❌ Wrong! Leaving without voting wastes your civic opportunity. Always ask for help from poll workers — they are there to assist you.'
      },
    ]
  },
  {
    id: 5,
    emoji: '📊',
    stage: 'Step 5: After Voting — Results',
    scenario: `You voted successfully! 🎉 Results are coming in and your preferred candidate is losing. Someone online says the election was rigged and asks you to protest. What do you do?`,
    choices: [
      {
        id: 'a',
        text: 'Immediately share the rigging claims on social media',
        correct: false,
        explanation: '❌ Wrong! Sharing unverified claims spreads misinformation and damages democracy. Always verify claims through official sources before sharing.'
      },
      {
        id: 'b',
        text: 'Wait for official results and check the Election Commission website',
        correct: true,
        explanation: '✅ Correct! Always wait for official certified results from the Election Commission. Results take time to count — preliminary results are not final.'
      },
      {
        id: 'c',
        text: 'Refuse to accept any result if your candidate loses',
        correct: false,
        explanation: '❌ Wrong! Accepting election results — even unfavorable ones — is a cornerstone of democracy. Legal challenges exist through proper channels if there is genuine evidence of fraud.'
      },
      {
        id: 'd',
        text: 'Stop following elections forever out of frustration',
        correct: false,
        explanation: '❌ Wrong! One election result does not define democracy. Staying engaged, voting in future elections, and holding elected officials accountable is how citizens create change.'
      },
    ]
  },
  {
    id: 6,
    emoji: '✅',
    stage: 'Step 6: Staying Civically Active',
    scenario: `The election is over. Your candidate won! A friend says "We voted, our job is done." As an informed citizen, what do you think?`,
    choices: [
      {
        id: 'a',
        text: 'Agree — voting is the only civic duty',
        correct: false,
        explanation: '❌ Wrong! Voting is just the beginning. Citizens must also hold elected officials accountable, stay informed about policies, and participate in local governance.'
      },
      {
        id: 'b',
        text: 'Disagree — follow the elected official\'s actions and stay engaged',
        correct: true,
        explanation: '✅ Correct! Democracy does not end on Election Day. Follow what your elected officials do, attend town halls, write to representatives, and vote in local elections too.'
      },
      {
        id: 'c',
        text: 'Only care about the next big election in 5 years',
        correct: false,
        explanation: '❌ Wrong! Local elections, municipal votes, and by-elections happen regularly and have direct impact on your daily life. All elections matter!'
      },
      {
        id: 'd',
        text: 'Leave everything to politicians now',
        correct: false,
        explanation: '❌ Wrong! Politicians represent citizens — but only if citizens stay engaged and vocal. An informed and active citizenry is the backbone of a healthy democracy.'
      },
    ]
  }
];

interface VoterJourneyProps {
  region: string;
  language: string;
  onNavigateToChat: (question: string) => void;
}

const VoterJourney: React.FC<VoterJourneyProps> = ({ region, language, onNavigateToChat }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalDebrief, setFinalDebrief] = useState<string | null>(null);
  const [activeJourney, setActiveJourney] = useState(VOTER_JOURNEY);
  const [headerText, setHeaderText] = useState({ title: 'My Voter Journey', subtitle: 'Experience the voting process as a first-time citizen voter' });

  useEffect(() => {
    const translateJourney = async () => {
      if (language === 'English') {
        setActiveJourney(VOTER_JOURNEY);
        setHeaderText({ title: 'My Voter Journey', subtitle: 'Experience the voting process as a first-time citizen voter' });
        return;
      }

      const [title, sub] = await Promise.all([
        translateText('My Voter Journey', language),
        translateText('Experience the voting process as a first-time citizen voter', language)
      ]);
      setHeaderText({ title: `🚶 ${title}`, subtitle: sub });

      const translatedJourney = await Promise.all(VOTER_JOURNEY.map(async (stage) => {
        const [translatedStage, translatedScenario] = await Promise.all([
          translateText(stage.stage, language),
          translateText(stage.scenario, language)
        ]);

        const translatedChoices = await Promise.all(stage.choices.map(async (choice) => {
          const [translatedTextContent, translatedExplanation] = await Promise.all([
            translateText(choice.text, language),
            translateText(choice.explanation, language)
          ]);
          return { ...choice, text: translatedTextContent, explanation: translatedExplanation };
        }));

        return { ...stage, stage: translatedStage, scenario: translatedScenario, choices: translatedChoices };
      }));

      setActiveJourney(translatedJourney);
    };

    translateJourney();
  }, [language]);

  const stage = activeJourney[currentStageIndex];

  const handleChoice = async (choice: { id: string; text: string; correct: boolean; explanation: string }) => {
    if (selectedChoiceId || isLoading) return;

    setSelectedChoiceId(choice.id);
    if (choice.correct) {
      setScore(prev => prev + 1);
    }
    setIsLoading(true);

    try {
      const prompt = `
        A citizen is learning about the voting process in ${region}.
        They just answered a question about: ${stage.stage}
        They chose: "${choice.text}"
        That was ${choice.correct ? 'correct' : 'incorrect'}.
        
        In exactly 2 sentences, give an encouraging 
        civic education tip related to this topic.
        Be warm, supportive, and educational.
        Never be discouraging even for wrong answers.
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        })
      });

      const data = await response.json();
      let tip = data.choices[0].message.content;
      
      if (language !== 'English') {
        tip = await translateText(tip, language);
      }
      setAiTip(tip);
    } catch {
      setAiTip("Every step you take in understanding the election process makes you a more powerful citizen. Remember, your voice is your greatest tool for change!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStageIndex < VOTER_JOURNEY.length - 1) {
      setCurrentStageIndex(prev => prev + 1);
      setSelectedChoiceId(null);
      setAiTip(null);
    } else {
      finishJourney();
    }
  };

  const finishJourney = async () => {
    setIsFinished(true);
    setIsLoading(true);

    try {
      const prompt = `
        A citizen just completed a voter education quiz in ${region}. 
        Score: ${score}/6
        
        Give them a warm 3-sentence summary of 
        what they learned and encourage them to 
        use their vote. Reference real civic values.
        Keep it under 80 words.
      `;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        })
      });

      const data = await response.json();
      let debrief = data.choices[0].message.content;
      
      if (language !== 'English') {
        debrief = await translateText(debrief, language);
      }
      setFinalDebrief(debrief);
    } catch {
      setFinalDebrief("Congratulations on completing your Voter Journey! You've gained essential knowledge about registration, voting rights, and staying active in your community. Democracy thrives when informed citizens like you participate and make their voices heard.");
    } finally {
      setIsLoading(false);
    }
  };

  const getResultLabel = () => {
    if (score === 6) return { label: "🏆 Perfect Voter!", color: '#22c55e' };
    if (score >= 4) return { label: "⭐ Great Job!", color: '#4ade80' };
    if (score >= 2) return { label: "📚 Keep Learning!", color: '#f59e0b' };
    return { label: "🌱 Just Starting!", color: '#ef4444' };
  };

  const resetJourney = () => {
    setCurrentStageIndex(0);
    setScore(0);
    setSelectedChoiceId(null);
    setAiTip(null);
    setIsFinished(false);
    setFinalDebrief(null);
  };

  if (isFinished) {
    const result = getResultLabel();
    return (
      <div className="journey-container">
        <div className="journey-card journey-results">
          <div className="final-score-display">
            <span className="score-number">{score}/6</span>
            <span className="score-label" style={{ color: result.color }}>{result.label}</span>
          </div>

          <div className="results-summary">
            <span className="tip-label">🎙️ Post-Journey Summary</span>
            <div className="analysis-text">
              {isLoading ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : finalDebrief}
            </div>
          </div>

          <div className="results-actions">
            <button className="journey-next-btn" onClick={resetJourney}>
              <RotateCcw size={18} />
              Try Again
            </button>
            <button className="action-btn-outline" style={{ marginLeft: '12px' }} onClick={() => onNavigateToChat('I want to learn more about my voting rights')}>
              <MessageSquare size={18} />
              Ask CivicGuide
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedChoice = stage.choices.find(c => c.id === selectedChoiceId);

  return (
    <div className="journey-container">
      <div className="journey-header">
        <h1 className="journey-title">{headerText.title}</h1>
        <p className="journey-subtitle">{headerText.subtitle}</p>
        <div className="journey-stats">
          <div className="progress-dots">
            {activeJourney.map((_, i) => (
              <div
                key={i}
                className={`progress-dot ${i === currentStageIndex ? 'active' : ''} ${i < currentStageIndex ? 'completed' : ''}`}
              />
            ))}
          </div>
          <div className="score-tracker">
            ✅ {score} correct so far
          </div>
        </div>
      </div>

      <div className="journey-card">
        <div className="stage-badge">{stage.stage}</div>
        <span className="journey-emoji">{stage.emoji}</span>
        <p className="journey-scenario">{stage.scenario}</p>

        <div className="choices-list">
          {stage.choices.map((choice) => (
            <button
              key={choice.id}
              className={`journey-choice ${selectedChoiceId === choice.id ? (choice.correct ? 'correct' : 'wrong') : ''} ${selectedChoiceId && selectedChoiceId !== choice.id ? 'disabled' : ''}`}
              onClick={() => handleChoice(choice)}
              disabled={!!selectedChoiceId}
            >
              {choice.text}
            </button>
          ))}
        </div>

        {selectedChoice && (
          <div className="feedback-section">
            <div className={`explanation-box ${selectedChoice.correct ? 'correct' : 'wrong'}`}>
              {selectedChoice.explanation}
            </div>
            {aiTip && (
              <div className="civic-tip-box">
                <span className="tip-label">💡 CivicGuide Tip</span>
                <p className="tip-text">{aiTip}</p>
              </div>
            )}
          </div>
        )}

        <div className="next-action">
          <button
            className="journey-next-btn"
            onClick={handleNext}
            disabled={!selectedChoiceId || isLoading}
          >
            {currentStageIndex === VOTER_JOURNEY.length - 1 ? 'See Results' : 'Next Step'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoterJourney;
