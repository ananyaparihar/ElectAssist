import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Bot, User, Copy, Check } from 'lucide-react';
import { LANG_CODES, translateText, translateMultiple } from '../../services/translate';
import './Chat.css';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: string;
  typing?: boolean;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const SYSTEM_PROMPT = `You are CivicGuide, a friendly non-partisan 
election education assistant. Help citizens understand voter 
registration, primaries, Election Day, vote counting, certification, 
and inauguration. Use numbered steps for processes. Keep answers 
under 220 words. Remind users rules vary by state/country.`;

// Google Cloud Translation API integration
// Project: elated-card-494317-s9

const GREETING_DEFAULT = "Hello! I'm your Election Assistant. How can I help you today? You can ask me about registration deadlines, polling locations, or the voting process.";

const QUICK_CHIPS_DEFAULT = [
  { label: '📋 How to register', question: 'How do I register to vote?' },
  { label: '🪪 What ID to bring', question: 'What ID do I need on Election Day?' },
  { label: '🗺️ Explain Electoral College', question: 'Explain the Electoral College simply' },
  { label: '⚖️ Primary vs General', question: 'What is the difference between a primary and general election?' },
  { label: '⏱️ How long counting takes', question: 'How long does vote counting take and why?' },
];

const PLACEHOLDER_DEFAULT = 'Type your question here...';

const ELECTION_FACTS: Record<string, string[]> = {
  India: [
    "India has the world's largest voter base with over 960 million registered voters.",
    "India's first general election in 1951-52 took 4 months to complete across 68,000 polling stations.",
    "The Election Commission of India is one of the most powerful independent bodies in the country.",
    "India uses Electronic Voting Machines (EVMs) since 1982, making it a pioneer in e-voting.",
    "Over 1 million polling stations are set up across India for general elections.",
    "Indian voters get a purple ink mark on their finger to prevent double voting.",
    "NOTA (None of the Above) option has been available to Indian voters since 2013.",
    "India's 2024 general election was the largest democratic exercise in human history.",
  ],
  "United States": [
    "The United States has held presidential elections every 4 years without interruption since 1788.",
    "Only 538 Electoral College votes determine the US President, not the popular vote.",
    "Americans vote on Tuesday because in 1845 it took a day to travel to polling places by horse.",
    "The US has over 10,000 distinct election jurisdictions across the country.",
    "Mail-in voting has been used in the US since the Civil War era in the 1860s.",
    "26th Amendment lowered the US voting age from 21 to 18 in 1971.",
    "Florida's 'butterfly ballot' in 2000 may have changed the course of US history.",
    "Over 150 million Americans voted in the 2020 presidential election — a record turnout.",
  ],
  "United Kingdom": [
    "The UK uses a First Past the Post system where the candidate with most votes wins.",
    "British citizens can vote from age 16 in Scotland and Wales but 18 in England.",
    "The UK Parliament has existed in some form since 1215 with the Magna Carta.",
    "A UK general election must be held at least every 5 years by law.",
    "The House of Lords has over 800 members, none of whom are elected.",
    "UK polling stations are open from 7am to 10pm on Election Day.",
    "The Speaker of the House of Commons traditionally runs unopposed in elections.",
    "Royal Assent — the monarch's approval — is still required to pass laws in the UK.",
  ],
  Australia: [
    "Voting is compulsory in Australia — you can be fined for not voting.",
    "Australia introduced the secret ballot in 1856, which the world now calls the 'Australian Ballot'.",
    "Australia uses preferential voting — you rank candidates in order of preference.",
    "The Australian Electoral Commission enrolls voters automatically using government data.",
    "Sausage sizzles at polling stations are a beloved Australian election tradition.",
    "Australia has had over 40 federal elections since Federation in 1901.",
    "Australian Senate elections use proportional representation.",
    "Weekend voting in Australia makes it easier for working people to participate.",
  ]
};

interface ChatProps {
  initialQuestion?: string | null;
  clearInitialQuestion?: () => void;
  region: string;
  language: string;
}

const Chat: React.FC<ChatProps> = ({ initialQuestion, clearInitialQuestion, region, language }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [, setConversationHistory] = useState<{ role: string, content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [factIndex, setFactIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const [activeFacts, setActiveFacts] = useState<string[]>(ELECTION_FACTS[region] || ELECTION_FACTS['India']);
  const [activeChips, setActiveChips] = useState(QUICK_CHIPS_DEFAULT);
  const [activePlaceholder, setActivePlaceholder] = useState(PLACEHOLDER_DEFAULT);
  const [activeGreeting, setActiveGreeting] = useState(GREETING_DEFAULT);
  const [dykTitle, setDykTitle] = useState('Did You Know?');

  const seededRef = useRef<string | null>(null);
  const conversationHistoryRef = useRef<{ role: string, content: string }[]>([]);

  const typeMessage = useCallback((fullText: string) => {
    let index = 0;
    const botMessageId = Date.now();

    // Add empty message first
    setMessages(prev => [...prev, {
      id: botMessageId,
      text: '',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      typing: true
    }]);

    const interval = setInterval(() => {
      index++;
      setMessages(prev => prev.map(m =>
        m.id === botMessageId
          ? { ...m, text: fullText.slice(0, index) }
          : m
      ));
      if (index >= fullText.length) {
        clearInterval(interval);
        setMessages(prev => prev.map(m =>
          m.id === botMessageId ? { ...m, typing: false } : m
        ));
      }
    }, 12);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessageUI: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const userMessageApi = { role: 'user', content: text.trim() };

    const updatedHistory = [...conversationHistoryRef.current, userMessageApi];
    conversationHistoryRef.current = updatedHistory;
    setConversationHistory(updatedHistory);

    setMessages(prev => [...prev, userMessageUI]);
    setLoading(true);

    try {
      // Always prompt in English for better consistency, then translate response
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
            max_tokens: 1000,
            messages: [
              {
                role: 'system',
                content: `${SYSTEM_PROMPT}\n\nThe user is asking about elections in ${region}.`
              },
              ...updatedHistory
            ]
          })
        }
      );

      const data = await response.json();
      let reply = data.choices?.[0]?.message?.content ??
        'Sorry, I could not get a response. Please try again.';

      const languageCode = LANG_CODES[language] || 'en';
      const translatedReply = await translateText(reply, languageCode);

      const assistantMessageApi = { role: 'assistant', content: translatedReply };
      const historyWithAssistant = [...conversationHistoryRef.current, assistantMessageApi];
      conversationHistoryRef.current = historyWithAssistant;
      setConversationHistory(historyWithAssistant);

      typeMessage(translatedReply);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Connection error. Please check your internet and try again.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    setLoading(false);
  }, [language, loading, region, typeMessage]);

  const goToNext = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setFactIndex(prev => (prev + 1) % activeFacts.length);
      setFading(false);
    }, 400);
  }, [activeFacts.length]);

  const goToPrev = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setFactIndex(prev => (prev - 1 + activeFacts.length) % activeFacts.length);
      setFading(false);
    }, 400);
  }, [activeFacts.length]);

  const jumpToFact = useCallback((index: number) => {
    if (index === factIndex) return;
    setFading(true);
    setTimeout(() => {
      setFactIndex(index);
      setFading(false);
    }, 400);
  }, [factIndex]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setShowToast(true);
    setTimeout(() => {
      setCopiedId(null);
      setShowToast(false);
    }, 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  // Initialize/Update UI translations when language or region changes
  useEffect(() => {
    const translateUI = async () => {
      const languageCode = LANG_CODES[language] || 'en';
      if (languageCode === 'en') {
        setActiveGreeting(GREETING_DEFAULT);
        setActiveChips(QUICK_CHIPS_DEFAULT);
        setActivePlaceholder(PLACEHOLDER_DEFAULT);
        setActiveFacts(ELECTION_FACTS[region] || ELECTION_FACTS['India']);
        setDykTitle('Did You Know?');
        return;
      }

      // Translate static UI elements
      const [greeting, placeholder, title] = await Promise.all([
        translateText(GREETING_DEFAULT, languageCode),
        translateText(PLACEHOLDER_DEFAULT, languageCode),
        translateText('Did You Know?', languageCode)
      ]);

      setActiveGreeting(greeting);
      setActivePlaceholder(placeholder);
      setDykTitle(title);

      // Translate chips labels
      const chipLabels = QUICK_CHIPS_DEFAULT.map(c => c.label);
      const translatedLabels = await translateMultiple(chipLabels, languageCode);
      setActiveChips(QUICK_CHIPS_DEFAULT.map((c, i) => ({
        ...c,
        label: translatedLabels[i]
      })));

      // Translate facts
      const sourceFacts = ELECTION_FACTS[region] || ELECTION_FACTS['India'];
      const translatedFacts = await translateMultiple(sourceFacts, languageCode);
      setActiveFacts(translatedFacts);
    };

    translateUI().then(() => {
      conversationHistoryRef.current = [];
      setConversationHistory([]);
    });
  }, [language, region]);

  useEffect(() => {
    setTimeout(() => {
      setMessages([{
        id: Date.now(),
        text: activeGreeting,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 0);
  }, [activeGreeting]);

  // Reset fact index when country changes
  useEffect(() => {
    setTimeout(() => setFactIndex(0), 0);
  }, [region]);

  // Auto-rotate facts every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 30000);
    return () => clearInterval(timer);
  }, [goToNext]);

  useEffect(() => {
    if (initialQuestion && initialQuestion !== seededRef.current) {
      seededRef.current = initialQuestion;
      sendMessage(initialQuestion);
      if (clearInitialQuestion) {
        clearInitialQuestion();
      }
    }
  }, [initialQuestion, clearInitialQuestion, sendMessage]);

  return (
    <div className="chat-container">
      <div className="did-you-know">
        <div className="dyk-header">
          <span>💡</span>
          <span>{dykTitle}</span>
        </div>
        <p className={`dyk-text ${fading ? 'fade' : ''}`}>
          {activeFacts[factIndex]}
        </p>
        <div className="dyk-footer">
          <div className="dyk-dots">
            {activeFacts.map((_, i) => (
              <button
                key={i}
                className={`dyk-dot ${i === factIndex ? 'active' : ''}`}
                onClick={() => jumpToFact(i)}
                aria-label={`Go to fact ${i + 1}`}
              />
            ))}
          </div>
          <div className="dyk-arrows">
            <button className="dyk-arrow" onClick={goToPrev}>‹</button>
            <button className="dyk-arrow" onClick={goToNext}>›</button>
          </div>
        </div>
        <div key={`${region}-${factIndex}`} className="dyk-progress" />
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            <div className="message-avatar">
              {msg.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              <div className="message-bubble-container">
                <div className="message-bubble">
                  <p>
                    {msg.text}
                    {msg.typing && <span className="cursor">▌</span>}
                  </p>
                </div>
                {!msg.typing && msg.sender === 'bot' && (
                  <button
                    className="copy-button"
                    onClick={() => handleCopy(msg.id, msg.text)}
                    title="Copy message"
                  >
                    {copiedId === msg.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
              <span className="message-time">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-wrapper bot">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="message-bubble typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div className="copy-toast">
          Copied to clipboard!
        </div>
      )}

      <div className="chat-input-container">
        <div className="quick-questions">
          {activeChips.map((q, i) => (
            <button key={i} className="quick-question-pill" onClick={() => sendMessage(q.question)} disabled={loading}>
              {q.label}
            </button>
          ))}
        </div>
        <form className="chat-form" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder={activePlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="send-button" disabled={!inputValue.trim() || loading}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
