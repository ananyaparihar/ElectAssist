import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Chat from './components/ChatInterface/Chat';
import Timeline from './components/ElectionTimeline/Timeline';
import VoterJourney from './components/Simulator/VoterJourney';
import HowToVote from './components/HowToVote/HowToVote';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [region, setRegion] = useState(() => localStorage.getItem('region') || 'India');
  const [language, setLanguage] = useState(() => localStorage.getItem('civic-language') || 'English');

  useEffect(() => {
    localStorage.setItem('region', region);
  }, [region]);

  useEffect(() => {
    localStorage.setItem('civic-language', language);
  }, [language]);

  const navigateToChatWithQuestion = (question: string) => {
    setPendingQuestion(question);
    setActiveTab('chat');
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'chat': return 'Voter Assistant';
      case 'timeline': return 'Election Timeline';
      case 'simulator': return 'My Voter Journey';
      case 'how-to-vote': return 'How to Vote';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <Chat 
            initialQuestion={pendingQuestion} 
            clearInitialQuestion={() => setPendingQuestion(null)} 
            region={region} 
            language={language}
          />
        );
      case 'timeline':
        return <Timeline language={language} onEventClick={navigateToChatWithQuestion} />;
      case 'simulator':
        return (
          <VoterJourney 
            region={region} 
            language={language}
            onNavigateToChat={navigateToChatWithQuestion}
          />
        );
      case 'how-to-vote':
        return (
          <HowToVote 
            region={region} 
            language={language}
            onNavigateToChat={navigateToChatWithQuestion}
          />
        );
      default:
        return <Chat region={region} language={language} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <Header 
          title={getTitle()} 
          region={region} 
          setRegion={setRegion} 
          language={language}
          setLanguage={setLanguage}
          onSearch={navigateToChatWithQuestion}
        />

        <div className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="content-wrapper"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
