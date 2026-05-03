import React, { useState } from 'react';
import { ArrowRight, RotateCcw, MessageSquare } from 'lucide-react';
import './ElectionSimulator.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const STAGES = [
  {
    id: 1,
    emoji: '📢',
    title: 'Launch Your Campaign',
    description: 'You are running for office! How do you announce your candidacy?',
    choices: [
      { id: 'a', text: 'Hold a massive public rally', effect: 12, risk: 'High energy but costly' },
      { id: 'b', text: 'Post a heartfelt video online', effect: 8, risk: 'Wide reach, low cost' },
      { id: 'c', text: 'Write an op-ed in the newspaper', effect: 4, risk: 'Reaches older voters only' },
      { id: 'd', text: 'Go door-to-door in neighborhoods', effect: 10, risk: 'Personal but slow' },
    ]
  },
  {
    id: 2,
    emoji: '💰',
    title: 'Campaign Fundraising',
    description: 'You need funds to run ads and events. How do you raise money?',
    choices: [
      { id: 'a', text: 'Small donations from thousands of citizens', effect: 15, risk: 'Slower but trusted' },
      { id: 'b', text: 'Accept large corporate donations', effect: 5, risk: 'Quick money, public suspicion' },
      { id: 'c', text: 'Self-fund from personal savings', effect: 8, risk: 'Independent but limited' },
      { id: 'd', text: 'Host celebrity fundraiser events', effect: 10, risk: 'Media attention, mixed reaction' },
    ]
  },
  {
    id: 3,
    emoji: '📺',
    title: 'The Big Debate',
    description: 'You face your opponent in a live televised debate. What is your strategy?',
    choices: [
      { id: 'a', text: 'Attack opponent\'s record aggressively', effect: 3, risk: 'Seen as negative campaigning' },
      { id: 'b', text: 'Focus on your own policy ideas', effect: 15, risk: 'Positive but less dramatic' },
      { id: 'c', text: 'Tell personal stories to connect emotionally', effect: 12, risk: 'Relatable but policy-light' },
      { id: 'd', text: 'Use humor to seem approachable', effect: 8, risk: 'Likeable but not serious' },
    ]
  },
  {
    id: 4,
    emoji: '📰',
    title: 'Media Crisis!',
    description: 'A newspaper publishes a controversial story about you. How do you respond?',
    choices: [
      { id: 'a', text: 'Hold an immediate press conference', effect: 12, risk: 'Transparent, high pressure' },
      { id: 'b', text: 'Stay silent and hope it blows over', effect: -8, risk: 'Looks guilty, dangerous' },
      { id: 'c', text: 'Post a detailed response on social media', effect: 8, risk: 'Direct but can backfire' },
      { id: 'd', text: 'Have your team issue a statement', effect: 5, risk: 'Safe but impersonal' },
    ]
  },
  {
    id: 5,
    emoji: '🤝',
    title: 'Get Out The Vote',
    description: 'Election Day is tomorrow! How do you maximize voter turnout for your supporters?',
    choices: [
      { id: 'a', text: 'Phone banking — call thousands of supporters', effect: 10, risk: 'Effective but exhausting' },
      { id: 'b', text: 'Free rides to polling stations', effect: 15, risk: 'Popular, removes barriers' },
      { id: 'c', text: 'Last-minute social media blitz', effect: 8, risk: 'Wide reach, low cost' },
      { id: 'd', text: 'Rally with a famous musician', effect: 6, risk: 'Exciting but distracts from voting' },
    ]
  },
  {
    id: 6,
    emoji: '🗳️',
    title: 'Election Night',
    description: 'Votes are being counted. A key district is too close to call. What do you do?',
    choices: [
      { id: 'a', text: 'Wait patiently and trust the process', effect: 15, risk: 'Democratic, respected' },
      { id: 'b', text: 'Demand an immediate recount', effect: 2, risk: 'Looks desperate' },
      { id: 'c', text: 'Give a calm speech to supporters', effect: 10, risk: 'Leadership moment' },
      { id: 'd', text: 'Monitor every counting center personally', effect: 5, risk: 'Shows dedication' },
    ]
  }
];

interface ElectionSimulatorProps {
  region: string;
  onNavigateToChat: (question: string) => void;
}

const ElectionSimulator: React.FC<ElectionSimulatorProps> = ({ region, onNavigateToChat }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [approvalRating, setApprovalRating] = useState(45);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [aiReaction, setAiReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [debrief, setDebrief] = useState<string | null>(null);

  const stage = STAGES[currentStageIndex];

  const handleChoice = async (choice: any) => {
    if (selectedChoiceId || isLoading) return;

    setSelectedChoiceId(choice.id);
    setApprovalRating(prev => Math.min(100, Math.max(0, prev + choice.effect)));
    setIsLoading(true);

    try {
      const prompt = `
        The user is playing an election simulator.
        They are a candidate running for office in ${region}.
        Current stage: "${stage.title}"
        They chose: "${choice.text}"
        Their current approval rating: ${approvalRating + choice.effect}%
        
        React to this decision in 2-3 sentences as a 
        political commentator. Be dramatic and engaging.
        Tell them what effect this had on voters.
        End with a teaser for the next challenge.
        Keep it under 60 words.
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
      setAiReaction(data.choices[0].message.content);
    } catch (error) {
      setAiReaction("The pundits are buzzing about your move! It's a bold play that has everyone talking.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStageIndex < STAGES.length - 1) {
      setCurrentStageIndex(prev => prev + 1);
      setSelectedChoiceId(null);
      setAiReaction(null);
    } else {
      finishSimulation();
    }
  };

  const finishSimulation = async () => {
    setIsFinished(true);
    setIsLoading(true);

    const result = getResultData();

    try {
      const prompt = `
        The user just finished an election simulator in ${region}.
        Final approval rating: ${approvalRating}%
        Result: ${result.label}
        
        Give them a personalized 3-sentence debrief as 
        a political analyst. Mention what they did well 
        and what they should improve. Be encouraging.
        Reference real election concepts like voter 
        turnout, media strategy, and public trust.
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
      setDebrief(data.choices[0].message.content);
    } catch (error) {
      setDebrief("An incredible campaign run! You showed great instinct throughout. Your strategy on public trust was particularly notable. Keep studying the political landscape and you'll be even stronger next time!");
    } finally {
      setIsLoading(false);
    }
  };

  const getResultData = () => {
    if (approvalRating >= 70) return { label: 'YOU WON THE ELECTION!', desc: 'Congratulations! The people have spoken and chosen you as their leader.', color: '#22c55e', emoji: '🏆' };
    if (approvalRating >= 50) return { label: 'NARROW VICTORY!', desc: 'You won but just barely. Your campaign had some strong moments and some missteps.', color: '#f59e0b', emoji: '😅' };
    if (approvalRating >= 35) return { label: 'YOU LOST — Close Race', desc: 'Your opponent edged you out. A few better decisions could have changed everything.', color: '#94a3b8', emoji: '😔' };
    return { label: 'HEAVY DEFEAT', desc: "The voters weren't convinced this time. Study the issues and try again!", color: '#ef4444', emoji: '💔' };
  };

  const resetGame = () => {
    setCurrentStageIndex(0);
    setApprovalRating(45);
    setSelectedChoiceId(null);
    setAiReaction(null);
    setIsFinished(false);
    setDebrief(null);
  };

  const getMeterColor = () => {
    if (approvalRating < 40) return '#ef4444';
    if (approvalRating < 70) return '#f59e0b';
    return '#22c55e';
  };

  if (isFinished) {
    const result = getResultData();
    return (
      <div className="simulator-container">
        <div className="simulator-card results-screen">
          <span className="result-badge">{result.emoji}</span>
          <h2 className="result-title" style={{ color: result.color }}>{result.label}</h2>
          <p className="result-desc">{result.desc}</p>

          <div className="post-election-analysis">
            <span className="analysis-label">🎙️ Post-Election Analysis</span>
            <div className="analysis-text">
              {isLoading ? (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              ) : debrief}
            </div>
          </div>

          <div className="results-actions">
            <button className="next-btn" onClick={resetGame}>
              <RotateCcw size={18} />
              Play Again
            </button>
            <button className="action-btn-outline" onClick={() => onNavigateToChat('Explain some key political campaign strategies')}>
              <MessageSquare size={18} />
              Discuss with CivicGuide
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="simulator-container">
      <div className="simulator-top-bar">
        <div className="stage-progress-info">
          <span className="stage-count">Stage {currentStageIndex + 1} of {STAGES.length}</span>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentStageIndex + (selectedChoiceId ? 1 : 0)) / STAGES.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="approval-meter">
          <span className="approval-label">Approval Rating 📊</span>
          <span className="approval-value">{approvalRating}%</span>
          <div className="approval-bar-outer">
            <div
              className="approval-bar-inner"
              style={{
                width: `${approvalRating}%`,
                backgroundColor: getMeterColor()
              }}
            />
          </div>
        </div>
      </div>

      <div className="simulator-card">
        <span className="stage-emoji">{stage.emoji}</span>
        <h2 className="stage-title">{stage.title}</h2>
        <p className="stage-description">{stage.description}</p>

        <div className="choices-grid">
          {stage.choices.map((choice) => (
            <button
              key={choice.id}
              className={`choice-button ${selectedChoiceId === choice.id ? 'selected' : ''} ${selectedChoiceId && selectedChoiceId !== choice.id ? 'disabled' : ''}`}
              onClick={() => handleChoice(choice)}
              disabled={!!selectedChoiceId}
            >
              <span className="choice-text">{choice.text}</span>
              <span className="choice-risk">{choice.risk}</span>
              <div className={`effect-badge ${choice.effect >= 0 ? 'positive' : 'negative'}`}>
                {choice.effect >= 0 ? `+${choice.effect}` : choice.effect} {choice.effect >= 0 ? '✅' : '❌'}
              </div>
            </button>
          ))}
        </div>

        {aiReaction && (
          <div className="ai-commentary-box">
            <span className="commentary-label">📺 Political Commentator</span>
            <p className="commentary-text">"{aiReaction}"</p>
          </div>
        )}

        <div className="next-action-row">
          <button
            className="next-btn"
            onClick={handleNext}
            disabled={!aiReaction || isLoading}
          >
            {currentStageIndex === STAGES.length - 1 ? 'See Results' : 'Next Stage'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElectionSimulator;
