import React from 'react';
import { MessageSquare, Clock, Settings, HelpCircle, User } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const CHECKLIST_ITEMS = [
  { id: 'reg', label: 'Check registration' },
  { id: 'poll', label: 'Find polling location' },
  { id: 'id', label: 'Know your ID' },
  { id: 'ballot', label: 'Understand ballot' }
];

const navItems = [
  { id: 'chat', label: 'Assistant', shortLabel: 'Assistant', icon: MessageSquare },
  { id: 'timeline', label: 'Election Timeline', shortLabel: 'Timeline', icon: Clock },
  { id: 'simulator', label: 'My Voter Journey', shortLabel: 'Journey', icon: () => <span style={{ fontSize: '18px' }}>🚶</span> },
  { id: 'how-to-vote', label: 'How to Vote', shortLabel: 'How to Vote', icon: () => <span style={{ fontSize: '18px' }}>📖</span> },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('civicGuideSidebarChecklist');
    return saved ? JSON.parse(saved) : {};
  });

  React.useEffect(() => {
    localStorage.setItem('civicGuideSidebarChecklist', JSON.stringify(checklist));
  }, [checklist]);

  const allChecked = CHECKLIST_ITEMS.every(item => checklist[item.id]);

  const toggleCheck = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">🗳️</div>
          <h1 className="logo-text">ElectAssist</h1>
        </div>
      </div>

      <div className="sidebar-content">
        <nav className="nav-menu">
          <div className="nav-section-title">MAIN</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{item.label}</span>
                <span className="nav-label-short">{item.shortLabel}</span>
                {activeTab === item.id && (
                  <span className="active-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-checklist-section">
          <div className="nav-section-title">YOUR CHECKLIST</div>
          <div className="sidebar-checklist-items">
            {CHECKLIST_ITEMS.map((item) => (
              <label key={item.id} className="sidebar-checklist-item">
                <input 
                  type="checkbox" 
                  checked={!!checklist[item.id]} 
                  onChange={() => toggleCheck(item.id)}
                />
                <span className="sidebar-checkbox-custom"></span>
                <span className="sidebar-checklist-label">{item.label}</span>
              </label>
            ))}
          </div>
          {allChecked && (
            <div className="sidebar-checklist-celebration">
              You're ready! 🎉
            </div>
          )}
        </div>

        <div className="sidebar-divider" />

        <nav className="nav-menu bottom-menu">
          <div className="nav-section-title">PREFERENCES</div>
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className="nav-item" title={item.label} aria-label={item.label}>
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-name">Voter Profile</span>
            <span className="user-status">Verified</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
