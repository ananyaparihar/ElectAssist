import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translateText } from '../../services/TranslationService';
import './Timeline.css';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'past' | 'current' | 'upcoming';
  icon: React.ElementType;
}

const INITIAL_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    date: 'Sep 15, 2026',
    title: 'Voter Registration Deadline',
    description: 'Last day to register to vote or update your address for the upcoming general election.',
    status: 'past',
    icon: AlertCircle
  },
  {
    id: '2',
    date: 'Oct 10, 2026',
    title: 'Mail-in Ballots Sent',
    description: 'Registered voters will begin receiving their mail-in ballots at their registered addresses.',
    status: 'current',
    icon: MapPin
  },
  {
    id: '3',
    date: 'Oct 24, 2026',
    title: 'Early Voting Begins',
    description: 'Polling places open for early in-person voting across the state.',
    status: 'upcoming',
    icon: Calendar
  },
  {
    id: '4',
    date: 'Nov 3, 2026',
    title: 'Election Day',
    description: 'General election day. Polls are open from 7:00 AM to 8:00 PM.',
    status: 'upcoming',
    icon: CheckCircle2
  }
];

interface TimelineProps {
  onEventClick?: (question: string) => void;
  language: string;
}

const Timeline: React.FC<TimelineProps> = ({ onEventClick, language }) => {
  const [events, setEvents] = React.useState<TimelineEvent[]>(INITIAL_EVENTS);
  const [headerText, setHeaderText] = React.useState({ title: '2026 General Election Timeline', sub: 'Stay on top of important dates and deadlines.' });

  React.useEffect(() => {
    const translateContent = async () => {
      if (language === 'English') {
        setEvents(INITIAL_EVENTS);
        setHeaderText({ title: '2026 General Election Timeline', sub: 'Stay on top of important dates and deadlines.' });
        return;
      }

      const translatedTitle = await translateText('2026 General Election Timeline', language);
      const translatedSub = await translateText('Stay on top of important dates and deadlines.', language);
      setHeaderText({ title: translatedTitle, sub: translatedSub });

      const translatedEvents = await Promise.all(INITIAL_EVENTS.map(async (event) => ({
        ...event,
        title: await translateText(event.title, language),
        description: await translateText(event.description, language),
      })));
      setEvents(translatedEvents);
    };

    translateContent();
  }, [language]);

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2>{headerText.title}</h2>
        <p>{headerText.sub}</p>
      </div>
      
      <div className="timeline-content">
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <motion.div 
              key={event.id}
              className={`timeline-item ${event.status}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <div className="timeline-connector">
                <div className="timeline-dot">
                  <Icon size={16} />
                </div>
                {index !== events.length - 1 && <div className="timeline-line"></div>}
              </div>
              
              <div 
                className={`timeline-card ${onEventClick ? 'clickable' : ''}`}
                onClick={() => {
                  if (onEventClick) {
                    onEventClick(`Explain the ${event.title.toLowerCase()} process and what I need to do before the ${event.date.split(',')[0]} deadline.`);
                  }
                }}
              >
                <div className="timeline-date">{event.date}</div>
                <h3 className="timeline-title">{event.title}</h3>
                <p className="timeline-desc">{event.description}</p>
                {event.status === 'current' && (
                  <span className="status-badge">Action Required</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
