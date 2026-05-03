import React, { useState, useEffect } from 'react';
import { Send, Bot, User, Copy, Check } from 'lucide-react';
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

const GREETINGS: Record<string, string> = {
  English: "Hello! I'm your Election Assistant. How can I help you today? You can ask me about registration deadlines, polling locations, or the voting process.",
  Hindi: "नमस्ते! मैं आपका चुनाव सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? आप मुझसे पंजीकरण की समय-सीमा, मतदान केंद्र या मतदान प्रक्रिया के बारे में पूछ सकते हैं।",
  Spanish: "¡Hola! Soy tu Asistente Electoral. ¿Cómo puedo ayudarte hoy? Puedes preguntarme sobre plazos de registro, lugares de votación o el proceso electoral.",
  French: "Bonjour! Je suis votre Assistant Électoral. Comment puis-je vous aider aujourd'hui? Vous pouvez me poser des questions sur les délais d'inscription, les bureaux de vote ou le processus électoral."
};

const QUICK_CHIPS: Record<string, { label: string, question: string }[]> = {
  English: [
    { label: '📋 How to register', question: 'How do I register to vote?' },
    { label: '🪪 What ID to bring', question: 'What ID do I need on Election Day?' },
    { label: '🗺️ Explain Electoral College', question: 'Explain the Electoral College simply' },
    { label: '⚖️ Primary vs General', question: 'What is the difference between a primary and general election?' },
    { label: '⏱️ How long counting takes', question: 'How long does vote counting take and why?' },
  ],
  Hindi: [
    { label: '📋 पंजीकरण कैसे करें', question: 'मतदाता पंजीकरण कैसे करें?' },
    { label: '🪪 कौन सा ID लाएं', question: 'चुनाव के दिन कौन सा पहचान पत्र लाना होगा?' },
    { label: '🗺️ इलेक्टोरल कॉलेज', question: 'इलेक्टोरल कॉलेज को सरल भाषा में समझाएं' },
    { label: '⚖️ प्राथमिक vs सामान्य', question: 'प्राथमिक और सामान्य चुनाव में क्या अंतर है?' },
    { label: '⏱️ मतगणना में कितना समय', question: 'मतगणना में कितना समय लगता है और क्यों?' },
  ],
  Spanish: [
    { label: '📋 Cómo registrarse', question: '¿Cómo me registro para votar?' },
    { label: '🪪 Qué ID traer', question: '¿Qué identificación necesito el día de elecciones?' },
    { label: '🗺️ Colegio Electoral', question: 'Explica el Colegio Electoral de forma simple' },
    { label: '⚖️ Primaria vs General', question: '¿Cuál es la diferencia entre elección primaria y general?' },
    { label: '⏱️ Tiempo de conteo', question: '¿Cuánto tarda el conteo de votos y por qué?' },
  ],
  French: [
    { label: '📋 Comment s\'inscrire', question: 'Comment s\'inscrire pour voter?' },
    { label: '🪪 Quel ID apporter', question: 'Quel document d\'identité apporter le jour du vote?' },
    { label: '🗺️ Collège électoral', question: 'Expliquez le Collège électoral simplement' },
    { label: '⚖️ Primaire vs Générale', question: 'Quelle est la différence entre élection primaire et générale?' },
    { label: '⏱️ Durée du dépouillement', question: 'Combien de temps dure le dépouillement et pourquoi?' },
  ]
};

const PLACEHOLDERS: Record<string, string> = {
  English: 'Type your question here...',
  Hindi: 'अपना सवाल यहाँ लिखें...',
  Spanish: 'Escribe tu pregunta aquí...',
  French: 'Tapez votre question ici...'
};

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
  const [conversationHistory, setConversationHistory] = useState<{ role: string, content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [factIndex, setFactIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const facts = ELECTION_FACTS[region] || ELECTION_FACTS['India'];


  // Initialize/Update greeting and reset history when language changes
  useEffect(() => {
    setMessages([{
      id: Date.now(),
      text: GREETINGS[language] || GREETINGS['English'],
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setConversationHistory([]);
  }, [language]);

  // Reset fact index when country changes
  useEffect(() => {
    setFactIndex(0);
  }, [region]);

  // Auto-rotate facts every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, 30000);
    return () => clearInterval(timer);
  }, [factIndex, region]);

  const goToNext = () => {
    setFading(true);
    setTimeout(() => {
      setFactIndex(prev => (prev + 1) % facts.length);
      setFading(false);
    }, 400);
  };

  const goToPrev = () => {
    setFading(true);
    setTimeout(() => {
      setFactIndex(prev => (prev - 1 + facts.length) % facts.length);
      setFading(false);
    }, 400);
  };

  const jumpToFact = (index: number) => {
    if (index === factIndex) return;
    setFading(true);
    setTimeout(() => {
      setFactIndex(index);
      setFading(false);
    }, 400);
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setShowToast(true);
    setTimeout(() => {
      setCopiedId(null);
      setShowToast(false);
    }, 2000);
  };

  const seededRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (initialQuestion && initialQuestion !== seededRef.current) {
      seededRef.current = initialQuestion;
      sendMessage(initialQuestion);
      if (clearInitialQuestion) {
        clearInitialQuestion();
      }
    }
  }, [initialQuestion]);

  const typeMessage = (fullText: string) => {
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
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessageUI: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const userMessageApi = { role: 'user', content: text.trim() };
    const updatedHistory = [...conversationHistory, userMessageApi];

    setConversationHistory(updatedHistory);
    setMessages(prev => [...prev, userMessageUI]);
    setLoading(true);

    try {
      const languageInstruction = `Always respond in ${language}. All explanations, steps, and answers must be in ${language}.`;

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
                content: `${languageInstruction}\n\n${SYSTEM_PROMPT}\n\nThe user is asking about elections in ${region}. Answer with that country's specific rules and processes.`
              },
              ...updatedHistory
            ]
          })
        }
      );

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ??
        'Sorry, I could not get a response. Please try again.';

      const assistantMessageApi = { role: 'assistant', content: reply };
      setConversationHistory(prev => [...prev, assistantMessageApi]);

      typeMessage(reply);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Connection error. Please check your internet and try again.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    setLoading(false);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const chips = QUICK_CHIPS[language] || QUICK_CHIPS['English'];

  return (
    <div className="chat-container">
      <div className="did-you-know">
        <div className="dyk-header">
          <span>💡</span>
          <span>Did You Know?</span>
        </div>
        <p className={`dyk-text ${fading ? 'fade' : ''}`}>
          {facts[factIndex]}
        </p>
        <div className="dyk-footer">
          <div className="dyk-dots">
            {facts.map((_, i) => (
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
          {chips.map((q, i) => (
            <button key={i} className="quick-question-pill" onClick={() => sendMessage(q.question)} disabled={loading}>
              {q.label}
            </button>
          ))}
        </div>
        <form className="chat-form" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder={PLACEHOLDERS[language] || PLACEHOLDERS['English']}
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
