import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowRight, AlertTriangle } from 'lucide-react';
import './HowToVote.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

interface HowToVoteProps {
  region: string;
  onNavigateToChat: (question: string) => void;
}

const HowToVote: React.FC<HowToVoteProps> = ({ region, onNavigateToChat }) => {
  const [electionSteps, setElectionSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchElectionSteps = async (country: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 800,
            messages: [
              {
                role: 'system',
                content: `You are an election education expert. 
                Always respond in valid JSON only. 
                No extra text, no markdown, just raw JSON.`
              },
              {
                role: 'user',
                content: `Give me exactly 5 steps a citizen 
                must follow to vote in ${country}.
                
                Respond ONLY with this JSON format, no markdown:
                [
                  {
                    "step": 1,
                    "emoji": "📋",
                    "title": "Short title max 3 words",
                    "description": "One clear sentence explaining this step for a first-time voter in ${country}.",
                    "tip": "One practical tip specific to ${country}'s voting system"
                  }
                ]`
              }
            ],
            response_format: { type: "json_object" }
          })
        }
      );
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '[]';

      // Clean up markdown if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      let steps = JSON.parse(cleanedText);
      if (!Array.isArray(steps) && steps.steps) {
        steps = steps.steps;
      } else if (!Array.isArray(steps) && typeof steps === 'object') {
        const arrayProp = Object.values(steps).find(val => Array.isArray(val));
        if (arrayProp) steps = arrayProp;
      }

      setElectionSteps(Array.isArray(steps) ? steps : []);
    } catch (error) {
      console.error('Steps fetch failed:', error);
      setElectionSteps([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchElectionSteps(region);
  }, [region]);

  const getDisclaimerLink = () => {
    switch (region) {
      case 'India':
        return { text: 'Visit eci.gov.in for official information', url: 'https://eci.gov.in' };
      case 'United States':
        return { text: 'Visit usa.gov/absentee-voting', url: 'https://usa.gov/absentee-voting' };
      case 'United Kingdom':
        return { text: 'Visit gov.uk/register-to-vote', url: 'https://gov.uk/register-to-vote' };
      case 'Australia':
        return { text: 'Visit aec.gov.au', url: 'https://aec.gov.au' };
      default:
        return null;
    }
  };

  const disclaimerLink = getDisclaimerLink();

  return (
    <div className="htv-page">
      <div className="htv-header">
        <div className="htv-header-info">
          <h1 className="htv-title">📖 How to Vote</h1>
          <p className="htv-subtitle">Step-by-step voting guide for {region}</p>
        </div>
        <button className="htv-refresh-btn" onClick={() => fetchElectionSteps(region)} disabled={loading}>
          <RotateCcw size={14} />
          Regenerate for {region}
        </button>
      </div>

      <div className="htv-content">
        {loading ? (
          <div className="htv-skeletons" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => <div key={i} className="htv-skeleton" />)}
          </div>
        ) : (
          <div className="htv-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {electionSteps.map((step, idx) => (
              <div key={idx} className="htv-card">
                <div className="htv-card-top">
                  <div className="htv-step-num">{step.step}</div>
                  <span className="htv-step-emoji">{step.emoji}</span>
                  <h3 className="htv-step-title">{step.title}</h3>
                </div>
                <p className="htv-step-desc">{step.description}</p>
                <div className="htv-card-footer">
                  <div className="htv-tip">
                    <span>💡</span>
                    {step.tip}
                  </div>
                  <button
                    className="htv-ask-btn"
                    onClick={() => onNavigateToChat(`Tell me more about: ${step.title} for voting in ${region}`)}
                  >
                    Ask
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="htv-disclaimer">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
          <div>
            Election rules and procedures vary by state and change over time. Always verify the latest information at your official Election Commission website.
            {disclaimerLink && (
              <div style={{ marginTop: '4px' }}>
                <a href={disclaimerLink.url} target="_blank" rel="noopener noreferrer">
                  {disclaimerLink.text}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToVote;
