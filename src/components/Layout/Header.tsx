import React from 'react';
import { Bell, Search } from 'lucide-react';
import './Header.css';

interface Notification {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  question: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    icon: '🗳️',
    title: 'Voter Registration Deadline',
    description: 'Sep 15, 2026 is the last day to register in most states',
    time: '2 hours ago',
    unread: true,
    question: 'What do I need to do before the voter registration deadline?'
  },
  {
    id: '2',
    icon: '📬',
    title: 'Mail-in Ballot Request Open',
    description: 'You can now request your mail-in ballot for the November election',
    time: '1 day ago',
    unread: true,
    question: 'How do I request a mail-in ballot?'
  },
  {
    id: '3',
    icon: '📍',
    title: 'Polling Location Confirmed',
    description: 'Your assigned polling location has been confirmed for Election Day',
    time: '2 days ago',
    unread: false,
    question: 'How do I find my polling location?'
  },
  {
    id: '4',
    icon: '⚠️',
    title: 'ID Requirement Reminder',
    description: 'Remember to bring a valid photo ID on Election Day',
    time: '3 days ago',
    unread: false,
    question: 'What ID do I need to bring to vote?'
  },
  {
    id: '5',
    icon: '🏛️',
    title: 'Early Voting Starts Oct 24',
    description: 'Early voting opens in 3 weeks. Find your early voting location',
    time: '5 days ago',
    unread: false,
    question: 'How does early voting work?'
  }
];

interface HeaderProps {
  title: string;
  region: string;
  setRegion: (region: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  onSearch: (query: string) => void;
}

const REGIONS = [
  { id: 'India', label: '🇮🇳 India' },
  { id: 'United States', label: '🇺🇸 United States' },
  { id: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { id: 'Australia', label: '🇦🇺 Australia' }
];

const LANGUAGES = [
  { id: 'English', label: '🇬🇧 English' },
  { id: 'Hindi', label: '🇮🇳 Hindi' },
  { id: 'Spanish', label: '🇪🇸 Spanish' },
  { id: 'French', label: '🇫🇷 French' }
];

const SEARCH_SUGGESTIONS = [
  "How to register to vote",
  "Voter ID requirements",
  "Election Day polling hours",
  "How are votes counted",
  "What is the Electoral College",
  "Primary vs general election",
  "Mail-in ballot process",
  "How to check registration status",
  "What happens after election day",
  "Inauguration process"
];

const Header: React.FC<HeaderProps> = ({ title, region, setRegion, language, setLanguage, onSearch }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const bellRef = React.useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  React.useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault();
    const query = explicitQuery || searchQuery;
    if (!query.trim()) return;
    
    onSearch(query);
    setSearchQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read if it wasn't
    if (notif.unread) {
      setNotifications(prev => prev.map(n => 
        n.id === notif.id ? { ...n, unread: false } : n
      ));
    }
    
    setIsDropdownOpen(false);
    onSearch(notif.question);
  };

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(s => 
    s.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 4);

  return (
    <header className="header">
      <div className="header-left">
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-right">
        <div className="region-selector-container">
          <select 
            className="region-selector" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ marginRight: '8px' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>

          <select 
            className="region-selector" 
            value={region} 
            onChange={(e) => setRegion(e.target.value)}
          >
            {REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        
        <div className="search-container">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <Search size={18} className="search-icon" onClick={() => handleSearchSubmit()} style={{ cursor: 'pointer' }} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search election info... (/)" 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
          </form>
          
          {showSuggestions && searchQuery && filteredSuggestions.length > 0 && (
            <div className="search-suggestions">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSearchSubmit(undefined, suggestion)}
                >
                  <Search size={14} className="suggestion-icon" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            ref={bellRef}
            className={`icon-button notification-btn ${isDropdownOpen ? 'active' : ''}`}
            onClick={toggleDropdown}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="notification-dropdown" ref={dropdownRef}>
              <div className="notification-panel-header">
                <h3>Notifications</h3>
                <button className="mark-all-read-btn" onClick={markAllAsRead}>
                  Mark all read
                </button>
              </div>

              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.unread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notification-icon">{notif.icon}</div>
                      <div className="notification-content">
                        <div className="notification-title-row">
                          <span className="notification-title">{notif.title}</span>
                          <button 
                            className="dismiss-btn" 
                            onClick={(e) => dismissNotification(e, notif.id)}
                            title="Dismiss"
                          >
                            ×
                          </button>
                        </div>
                        <span className="notification-desc">{notif.description}</span>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-notifications">
                    <Bell size={40} className="bell-icon" />
                    <p>You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
