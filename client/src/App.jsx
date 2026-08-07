import React, { useState, useEffect, useRef } from 'react';

// Auto-detect backend API base url
const API_BASE = window.location.origin.includes('localhost:5173') 
  ? 'http://localhost:3000' 
  : '';

// SVG Icons
const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>,
  Attendance: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  Vacancies: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75H4.5a.75.75 0 0 1-.75-.75V14.15M20.25 14.15a3.024 3.024 0 0 0-2.227-2.932 21.847 21.847 0 0 0-12.046 0 3.023 3.023 0 0 0-2.227 2.932m16.5 0V8.286c0-.545-.224-1.064-.618-1.436L15.347 4.14A2.24 2.24 0 0 0 13.785 3.5H10.21c-.593 0-1.16.235-1.578.65L5.75 6.85a2.24 2.24 0 0 0-.618 1.435v5.865" /></svg>,
  Candidates: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0 1 12.75 21.5h-1.5a2.25 2.25 0 0 1-2.25-2.263V19.13m4.5-.002v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128A3.375 3.375 0 0 0 15 12.03m-6.75 7.098c-.415.18-.865.282-1.34.282A4.125 4.125 0 0 1 2.25 15.5a4.125 4.125 0 0 1 5.373-3.957M10.5 15.75c-.868 0-1.688-.224-2.406-.618M10.5 15.75a3 3 0 0 0-3-3M10.5 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6.75 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>,
  Vendors: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.5a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>,
  Tasks: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m2.21-10.084-.24.24a2.25 2.25 0 0 0-.659 1.59v5.005a2.25 2.25 0 0 0 .659 1.59l.24.24a2.25 2.25 0 0 0 3.182 0l2.9-2.9a2.25 2.25 0 0 0 0-3.182l-2.9-2.9a2.25 2.25 0 0 0-3.182 0ZM9 7.5h1.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75V8.25A.75.75 0 0 1 9 7.5Z" /></svg>,
  Reports: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H3.75A1.125 1.125 0 0 0 2.625 3.375v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-3M7.5 14.25h9m-9-3h9m-9-3h3.375" /></svg>,
  Logs: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375 0 1 1-.75 0 .375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375 0 1 1-.75 0 .375 0 0 1 .75 0Zm-3.75 5.25h.007v.008H3.75v-.008Zm.375 0a.375 0 1 1-.75 0 .375 0 0 1 .75 0Z" /></svg>,
  Teams: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.75-2.906m-.173-4.056a10.025 10.025 0 0 0-3.325-2.222M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 0v-4.5m0 4.5h.008v-.008H12V15Zm-6.75 3.72a9.333 9.333 0 0 1-3.741-.479 3 3 0 0 1 4.682-2.72m-.94 3.198.002.031c0 .225.012.447.037.666A11.944 11.944 0 0 0 12 21c2.17 0 4.207-.576 5.963-1.584A6.06 6.06 0 0 0 18 18.722m-12 0a5.97 5.97 0 0 1 .75-2.906m-.173-4.056a10.025 10.025 0 0 1 3.325-2.222" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" /></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('tg_token') || '');
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Inactivity tracking
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    if (token) {
      localStorage.setItem('tg_token', token);
      fetchProfile();
      fetchNotifications();
    } else {
      localStorage.removeItem('tg_token');
      setUser(null);
    }
  }, [token]);

  // Handle Session Inactivity (30 min timeout)
  useEffect(() => {
    if (!token) return;

    const checkInterval = setInterval(() => {
      const inactiveMs = Date.now() - lastActiveRef.current;
      const thirtyMinutes = 30 * 60 * 1000;
      if (inactiveMs > thirtyMinutes) {
        handleLogout();
        setShowTimeoutWarning(true);
      }
    }, 30000);

    const updateActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
      setShowSearchModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
  };

  if (!token) {
    return (
      <LoginScreen 
        setToken={setToken} 
        showTimeoutWarning={showTimeoutWarning} 
        setShowTimeoutWarning={setShowTimeoutWarning} 
      />
    );
  }

  if (!user) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading user data...</div>;
  }

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">TG</div>
          <div className="logo-text">TalentGrade <span>ATS</span></div>
          <button className="sidebar-mobile-close" onClick={() => setMobileMenuOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <div className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}>
            <Icons.Dashboard /> Dashboard
          </div>
          <div className={`nav-item ${currentTab === 'attendance' ? 'active' : ''}`} onClick={() => { setCurrentTab('attendance'); setMobileMenuOpen(false); }}>
            <Icons.Attendance /> Attendance
          </div>
          <div className={`nav-item ${currentTab === 'vacancies' ? 'active' : ''}`} onClick={() => { setCurrentTab('vacancies'); setMobileMenuOpen(false); }}>
            <Icons.Vacancies /> Vacancies
          </div>
          <div className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`} onClick={() => { setCurrentTab('tasks'); setMobileMenuOpen(false); }}>
            <Icons.Tasks /> Task Board
          </div>
          <div className={`nav-item ${currentTab === 'candidates' ? 'active' : ''}`} onClick={() => { setCurrentTab('candidates'); setMobileMenuOpen(false); }}>
            <Icons.Candidates /> Candidates
          </div>
          <div className={`nav-item ${currentTab === 'vendors' ? 'active' : ''}`} onClick={() => { setCurrentTab('vendors'); setMobileMenuOpen(false); }}>
            <Icons.Vendors /> B2B Partners
          </div>
          <div className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`} onClick={() => { setCurrentTab('reports'); setMobileMenuOpen(false); }}>
            <Icons.Reports /> Reports
          </div>
          {user.role === 'Super Admin' && (
            <div className={`nav-item ${currentTab === 'teams' ? 'active' : ''}`} onClick={() => { setCurrentTab('teams'); setMobileMenuOpen(false); }}>
              <Icons.Teams /> Teams
            </div>
          )}
          {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
            <div className={`nav-item ${currentTab === 'logs' ? 'active' : ''}`} onClick={() => { setCurrentTab('logs'); setMobileMenuOpen(false); }}>
              <Icons.Logs /> Activity Logs
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <img 
            src={user.avatar_url ? `${API_BASE}${user.avatar_url}` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
            className="user-avatar" 
            alt="avatar"
            onClick={() => { setCurrentTab('profile'); setMobileMenuOpen(false); }}
            style={{ cursor: 'pointer' }}
          />
          <div className="user-info">
            <div className="user-name" onClick={() => { setCurrentTab('profile'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>{user.full_name}</div>
            <div className="user-role">{user.role} ({user.employee_id})</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <Icons.Logout />
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="main-wrapper">
        {/* HEADER BAR */}
        <header className="app-header">
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <form className="header-search" onSubmit={handleGlobalSearch}>
            <Icons.Search />
            <input 
              type="text" 
              placeholder="Search candidates, vacancies, vendors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="header-btn" onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown) markAllNotificationsRead();
              }}>
                <Icons.Bell />
                {notifications.some(n => !n.is_read) && <span className="notification-badge"></span>}
              </button>

              {showNotifDropdown && (
                <div className="notification-dropdown">
                  <div className="notif-header">
                    <span>Notifications</span>
                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => setShowNotifDropdown(false)}>Close</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-message">{n.message}</div>
                        <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CURRENT ACTIVE SCREEN */}
        <main className="screen-container">
          {currentTab === 'dashboard' && <DashboardView user={user} token={token} setCurrentTab={setCurrentTab} />}
          {currentTab === 'attendance' && <AttendanceView user={user} token={token} />}
          {currentTab === 'vacancies' && <VacanciesView user={user} token={token} />}
          {currentTab === 'tasks' && <TasksView user={user} token={token} />}
          {currentTab === 'candidates' && <CandidatesView user={user} token={token} />}
          {currentTab === 'vendors' && <VendorsView user={user} token={token} />}
          {currentTab === 'reports' && <ReportsView user={user} token={token} />}
          {currentTab === 'teams' && user.role === 'Super Admin' && <TeamsView user={user} token={token} />}
          {currentTab === 'logs' && (user.role === 'Super Admin' || user.role === 'Team Leader') && <LogsView user={user} token={token} />}
          {currentTab === 'profile' && <ProfileView user={user} token={token} fetchProfile={fetchProfile} />}
        </main>
      </div>

      {/* GLOBAL SEARCH RESULTS MODAL */}
      {showSearchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="card-title">Search Results for "{searchQuery}"</h3>
              <button className="modal-close" onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}><Icons.Close /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {searchResults && Object.values(searchResults).every(arr => arr.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No matches found.</div>
              ) : (
                searchResults && (
                  <>
                    {searchResults.candidates.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Candidates</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {searchResults.candidates.map(c => (
                            <div 
                              key={c.id} 
                              style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyBetween: 'center', justifyContent: 'space-between' }}
                              onClick={() => { setShowSearchModal(false); setCurrentTab('candidates'); }}
                            >
                              <div>
                                <div style={{ fontWeight: '500' }}>{c.name} ({c.email})</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Skills: {c.skills || 'None'}</div>
                              </div>
                              <span className={`badge badge-pipeline-${c.status.toLowerCase()}`}>{c.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.vacancies.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Vacancies</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {searchResults.vacancies.map(v => (
                            <div 
                              key={v.id} 
                              style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                              onClick={() => { setShowSearchModal(false); setCurrentTab('vacancies'); }}
                            >
                              <div style={{ fontWeight: '500' }}>{v.name}</div>
                              <span className="badge badge-info">{v.status} - {v.priority} Priority</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.vendors.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>B2B Partners</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {searchResults.vendors.map(vd => (
                            <div 
                              key={vd.id} 
                              style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => { setShowSearchModal(false); setCurrentTab('vendors'); }}
                            >
                              <div style={{ fontWeight: '500' }}>{vd.name} (POC: {vd.poc_name})</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email: {vd.email}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {searchResults.recruiters.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Recruiters</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {searchResults.recruiters.map(r => (
                            <div key={r.id} style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                              <div style={{ fontWeight: '500' }}>{r.name} ({r.employee_id})</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email: {r.email}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// LOGIN COMPONENT
// ==========================================
function LoginScreen({ setToken, showTimeoutWarning, setShowTimeoutWarning }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Login steps: 'punch', 'selfie', or 'login'
  const [loginStep, setLoginStep] = useState('punch');
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (loginStep === 'selfie') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [loginStep]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera failed:', err);
      setCameraError('Webcam not accessible. A virtual verified photo will be auto-generated.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handlePunchInNext = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Employee ID or Email address is required.');
      return;
    }

    // Call punch-in without selfie first to check if already punched in (idempotent path)
    try {
      const res = await fetch(`${API_BASE}/api/auth/punch-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (res.ok && data.alreadyPunchedIn) {
        // Skip camera and go straight to password!
        setLoginStep('login');
      } else if (res.status === 404) {
        setError(data.error);
      } else {
        // Go to selfie verification step
        setLoginStep('selfie');
      }
    } catch (err) {
      setError('Cannot connect to TalentGrade ATS services');
    }
  };

  const handleCaptureAndPunch = async () => {
    setError('');
    let capturedPhoto = null;

    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 300;
        
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
        capturedPhoto = canvas.toDataURL('image/jpeg');
      } catch (err) {
        console.warn('Webcam capture error:', err);
      }
    }

    if (!capturedPhoto) {
      // Fallback placeholder canvas draw
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = 'var(--primary)';
      ctx.beginPath();
      ctx.arc(150, 120, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(150, 260, 90, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '14px Outfit';
      ctx.fillText('Punch-In Verified', 100, 180);
      capturedPhoto = canvas.toDataURL('image/jpeg');
    }

    // Capture location coords
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await submitPunchIn(position.coords.latitude, position.coords.longitude, capturedPhoto);
      },
      async (err) => {
        console.warn('Geolocation blocked or unavailable:', err);
        alert('Please allow location sharing. It is required to log in.');
        await submitPunchIn(null, null, capturedPhoto);
      }
    );
  };

  const submitPunchIn = async (latitude, longitude, photo) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/punch-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, latitude, longitude, selfie: photo })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to register punch-in');
      } else {
        if (data.isLate) {
          alert('You are late today! Shift timing starts at 9:30 AM IST (12 mins grace allowed).');
        } else {
          alert('Punch-in registered successfully with live photo!');
        }
        setLoginStep('login');
      }
    } catch (err) {
      setError('Cannot connect to TalentGrade ATS services for punch-in');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      setError('Cannot connect to TalentGrade ATS services');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setForgotMsg(data.message || data.error);
    } catch (err) {
      setForgotMsg('Error requesting reset');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">TG</div>
          <h2>TalentGrade ATS</h2>
          <p>Internal Recruitment Operations Platform</p>
        </div>

        {showTimeoutWarning && (
          <div style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)', padding: '10px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--warning)' }}>
            Your session expired due to inactivity. Please log in again.
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '10px', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        {loginStep === 'punch' ? (
          <form onSubmit={handlePunchInNext} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Employee ID / Email</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g., TG1001 or admin@tgats.com" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '10px' }}>Punch In & Continue</button>
          </form>
        ) : loginStep === 'selfie' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>Selfie Attendance Verification</div>
            
            {cameraError ? (
              <div style={{ fontSize: '11.5px', color: 'var(--danger)', textAlign: 'center', backgroundColor: 'var(--danger-light)', padding: '10px', borderRadius: '4px', border: '1px solid var(--danger)' }}>
                {cameraError}
              </div>
            ) : (
              <video ref={videoRef} autoPlay playsInline style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '50%', border: '3px solid var(--primary)' }}></video>
            )}

            <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '10px', marginTop: '8px' }} onClick={handleCaptureAndPunch}>Capture Photo & Punch In</button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '6px' }} onClick={() => setLoginStep('punch')}>Back</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '10px', borderRadius: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Punched in: <strong>{identifier}</strong></span>
              <button type="button" className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', minWidth: 'auto' }} onClick={() => setLoginStep('punch')}>Edit</button>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> Remember Me
              </label>
              <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }} onClick={() => setShowForgotModal(true)}>Forgot Password?</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>Log In</button>
          </form>
        )}

        <div style={{ fontSize: '11px', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          Default Admin: admin@tgats.com / admin@123
        </div>
      </div>

      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Forgot Password</h3>
              <button className="modal-close" onClick={() => { setShowForgotModal(false); setForgotMsg(''); }}><Icons.Close /></button>
            </div>
            <form onSubmit={handleForgotPassword}>
              <div className="modal-body">
                {forgotMsg && <div style={{ backgroundColor: 'var(--info-light)', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>{forgotMsg}</div>}
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" placeholder="admin@tgats.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForgotModal(false); setForgotMsg(''); }}>Close</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DASHBOARD COMPONENT
// ==========================================
function DashboardView({ user, token, setCurrentTab }) {
  const [metrics, setMetrics] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  useEffect(() => {
    fetchMetrics();
    if (user.role === 'Super Admin' || user.role === 'Team Leader') {
      fetchPendingApprovals();
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/screenings/pending-reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPendingApprovals(data.pending || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveScreening = async (screeningId) => {
    if (!confirm('Are you sure you want to approve this candidate submission to the client?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/screenings/${screeningId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Candidate approved and submitted to client successfully.');
        fetchPendingApprovals();
      }
    } catch (err) {
      alert('Error approving screening');
    }
  };

  if (!metrics) {
    return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading dashboard statistics...</div>;
  }

  if (metrics.error || !metrics.candidatePipelineFunnel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Unable to load dashboard metrics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{metrics.error || 'The backend returned an unexpected metrics format.'}</p>
        <button className="btn btn-primary" onClick={fetchMetrics}>Retry Loading Statistics</button>
      </div>
    );
  }

  // Custom SVG sourcing funnel builder
  const funnelStages = [
    { key: 'New', color: '#3b82f6' },
    { key: 'Screening', color: '#8b5cf6' },
    { key: 'Submitted', color: '#f97316' },
    { key: 'Interview', color: '#6366f1' },
    { key: 'Offer', color: '#10b981' },
    { key: 'Joined', color: '#14b8a6' }
  ];

  const maxVal = Math.max(...funnelStages.map(s => metrics.candidatePipelineFunnel[s.key] || 0), 1);

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Recruitment Operations Center</h2>
          <div className="page-subtitle">Welcome back, {user.full_name}. Here is today's overview.</div>
        </div>
      </div>

      {/* PENDING TL APPROVALS ALERT/GRID */}
      {(user.role === 'Super Admin' || user.role === 'Team Leader') && pendingApprovals.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', border: '1px solid rgba(217, 37, 37, 0.2)' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--primary-light)', borderBottom: '1px solid rgba(217, 37, 37, 0.1)' }}>
            <span className="card-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Action Required: Pending Candidate Submissions ({pendingApprovals.length})
            </span>
          </div>
          <div className="table-container">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied Vacancy</th>
                  <th>Recruiter notes / recommendation</th>
                  <th>AI Score Match</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(p => {
                  const scores = p.ai_match_scores ? (typeof p.ai_match_scores === 'string' ? JSON.parse(p.ai_match_scores) : p.ai_match_scores) : null;
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.candidate_name}</strong><br/><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sourced by: {p.recruiter_name}</span></td>
                      <td>{p.vacancy_title}</td>
                      <td>
                        <span className={`badge ${p.recruiter_recommendation === 'Recommended' ? 'badge-success' : p.recruiter_recommendation === 'Maybe' ? 'badge-warning' : 'badge-danger'}`}>
                          {p.recruiter_recommendation}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Notes: {p.recruiter_notes || 'None'}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>
                          {scores ? `${scores.Overall}%` : '-'}
                        </strong>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Skill: {scores ? `${scores.Skill}%` : '-'} | Exp: {scores ? `${scores.Experience}%` : '-'}</div>
                      </td>
                      <td>
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleApproveScreening(p.id)}>
                          Approve Submission
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid-cols-4">
        <div className="stat-card">
          <div className="stat-icon primary"><Icons.Vacancies /></div>
          <div className="stat-data">
            <span className="stat-label">Active Vacancies</span>
            <span className="stat-value">{metrics.openVacancies} / {metrics.totalVacancies}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><Icons.Candidates /></div>
          <div className="stat-data">
            <span className="stat-label">Sourced Profiles</span>
            <span className="stat-value">{metrics.totalCandidates}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info"><Icons.Tasks /></div>
          <div className="stat-data">
            <span className="stat-label">Completed Tasks</span>
            <span className="stat-value">{metrics.taskStats.completed} / {metrics.taskStats.total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><Icons.Attendance /></div>
          <div className="stat-data">
            <span className="stat-label">Offers / Joinings</span>
            <span className="stat-value">{metrics.offersCount} / {metrics.joiningsCount}</span>
          </div>
        </div>
      </div>

      <div className="grid-2-1" style={{ marginTop: '24px' }}>
        {/* PIPELINE FUNNEL CHART */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Talent Sourcing Funnel</span>
          </div>
          <div className="card-body">
            <div className="funnel-container">
              {funnelStages.map(stage => {
                const count = metrics.candidatePipelineFunnel[stage.key] || 0;
                const pct = (count / maxVal) * 100;
                return (
                  <div key={stage.key} className="funnel-row">
                    <div className="funnel-label">{stage.key}</div>
                    <div className="funnel-bar-wrapper">
                      <div 
                        className="funnel-bar" 
                        style={{ width: `${pct}%`, backgroundColor: stage.color }}
                      ></div>
                    </div>
                    <div className="funnel-value">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PENDING TASKS CARD */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tasks Status</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              {/* Simple inline SVG donut chart */}
              <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
                <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="3"></circle>
                {metrics.taskStats.total > 0 && (
                  <circle 
                    className="donut-segment" 
                    cx="21" 
                    cy="21" 
                    r="15.91549430918954" 
                    fill="transparent" 
                    stroke="var(--primary)" 
                    strokeWidth="3" 
                    strokeDasharray={`${(metrics.taskStats.completed / metrics.taskStats.total) * 100} ${100 - (metrics.taskStats.completed / metrics.taskStats.total) * 100}`} 
                    strokeDashoffset="25"
                  ></circle>
                )}
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                  {metrics.taskStats.total > 0 
                    ? Math.round((metrics.taskStats.completed / metrics.taskStats.total) * 100) 
                    : 0}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Done</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
              <div><span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>●</span> Completed: {metrics.taskStats.completed}</div>
              <div><span style={{ color: '#64748b', fontWeight: 'bold' }}>●</span> Pending: {metrics.taskStats.pending}</div>
            </div>
          </div>
        </div>
      </div>

      {/* RECRUITER RANKING TABLE (ADMIN/TL ONLY) */}
      {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <span className="card-title">Recruiter Sourcing Leaderboard</span>
          </div>
          <div className="table-container">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Recruiter Name</th>
                  <th>Employee ID</th>
                  <th>Total Sourced</th>
                  <th>Offers Generated</th>
                  <th>Candidates Joined</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recruiterRanking.map((rec, index) => (
                  <tr key={rec.id}>
                    <td><strong>#{index + 1}</strong></td>
                    <td>{rec.full_name}</td>
                    <td>{rec.employee_id}</td>
                    <td>{rec.total_sourced}</td>
                    <td>{rec.offered_count}</td>
                    <td><span className="badge badge-success">{rec.joined_count} Joined</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}// ==========================================
// ATTENDANCE COMPONENT
// ==========================================
function AttendanceView({ user, token }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [selfieSrc, setSelfieSrc] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [punching, setPunching] = useState(false);
  const [activeDashboardRecords, setActiveDashboardRecords] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    fetchTodayRecord();
    fetchHistory();
    if (user.role === 'Super Admin' || user.role === 'Team Leader') {
      fetchDashboardData();
    }
  }, []);

  const fetchTodayRecord = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTodayRecord(data.record);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setActiveDashboardRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setSelfieSrc('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError('Webcam not accessible. Using simulated punch-in picture.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 300;
      canvas.height = 300;
      
      // Draw cropped square from center of video frame
      const size = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      ctx.translate(300, 0);
      ctx.scale(-1, 1); // Flip horizontally for selfie mirroring
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Restore

      const base64 = canvas.toDataURL('image/jpeg');
      setSelfieSrc(base64);
      stopCamera();
    }
  };

  const handlePunchInSubmit = async () => {
    let finalSelfie = selfieSrc;

    // Fallback: If camera is missing, draw a mockup placeholder on canvas
    if (!finalSelfie) {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = 'var(--primary)';
      ctx.beginPath();
      ctx.arc(150, 120, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(150, 260, 90, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(user.full_name, 110, 200);
      finalSelfie = canvas.toDataURL('image/jpeg');
    }

    setPunching(true);
    try {
      const res = await fetch(`${API_BASE}/api/attendance/punch-in`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ selfie: finalSelfie })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        setShowWebcamModal(false);
        setSelfieSrc('');
        fetchTodayRecord();
        fetchHistory();
        if (user.role === 'Super Admin' || user.role === 'Team Leader') fetchDashboardData();
      }
    } catch (err) {
      alert('Error during punch-in');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    // Check if early punch-out (before 6:30 PM IST)
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + (3600000 * 5.5)); // IST UTC+5.5
    const hour = ist.getHours();
    const minutes = ist.getMinutes();
    const isEarly = (hour < 18) || (hour === 18 && minutes < 30);

    const message = isEarly 
      ? 'You are punching out early today! Timing is from 9:30 AM to 6:30 PM IST. Are you sure you want to Punch Out?'
      : 'Are you sure you want to Punch Out?';

    if (!confirm(message)) return;

    // Capture location on punch-out
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await performPunchOut(position.coords.latitude, position.coords.longitude);
      },
      async (err) => {
        console.warn('Geolocation blocked or failed on punch-out:', err);
        await performPunchOut(null, null);
      }
    );
  };

  const performPunchOut = async (latitude, longitude) => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/punch-out`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ latitude, longitude })
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        alert(data.message || 'Punched out successfully');
        fetchTodayRecord();
        fetchHistory();
        if (user.role === 'Super Admin' || user.role === 'Team Leader') fetchDashboardData();
      }
    } catch (err) {
      alert('Error during punch-out');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance Management</h2>
          <div className="page-subtitle">Track your shifts, register logins, and check logs.</div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* SHIFT CONTROL PANEL */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Shift Console</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-muted)' }}>
              Current Date: <strong>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>

            {todayRecord ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="badge badge-success" style={{ fontSize: '13px', padding: '6px 16px', borderRadius: '20px' }}>Active Shift</span>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
                  <div>Punch-In Time: <strong>{new Date(todayRecord.punch_in_time).toLocaleTimeString()}</strong></div>
                  {todayRecord.punch_out_time ? (
                    <div>Punch-Out Time: <strong>{new Date(todayRecord.punch_out_time).toLocaleTimeString()}</strong></div>
                  ) : (
                    <div>Punch-Out Time: <span style={{ color: 'var(--text-muted)' }}>Pending</span></div>
                  )}
                  {todayRecord.working_hours > 0 && <div>Working Hours: <strong>{todayRecord.working_hours} hours</strong></div>}
                </div>
                {!todayRecord.punch_out_time && (
                  <button className="btn btn-danger" onClick={handlePunchOut} style={{ width: '180px', padding: '10px' }}>Punch Out</button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You have not punched in for today's shift.</div>
                <button className="btn btn-primary" onClick={() => { setShowWebcamModal(true); startCamera(); }} style={{ width: '180px', padding: '10px' }}>Punch In</button>
              </div>
            )}
          </div>
        </div>

        {/* STAT OVERVIEWS */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Shift Performance Overview</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Lateness Rate (Last 30 Days)</span>
              <strong>{history.length > 0 ? Math.round((history.filter(h => h.is_late).length / history.length) * 100) : 0}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Average Hours/Day</span>
              <strong>{history.length > 0 ? (history.reduce((acc, h) => acc + (h.working_hours || 0), 0) / history.length).toFixed(1) : 0} hrs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Accumulated Overtime</span>
              <strong>{history.reduce((acc, h) => acc + (h.overtime_hours || 0), 0).toFixed(1)} hrs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* OWN ATTENDANCE HISTORY LIST */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">My Attendance History</span>
        </div>
        <div className="table-container">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Working Hours</th>
                <th>Selfie Preview</th>
                <th>Device Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(row => (
                <tr key={row.id}>
                  <td>{row.attendance_date ? row.attendance_date.split('T')[0] : '-'}</td>
                  <td>{new Date(row.punch_in_time).toLocaleTimeString()}</td>
                  <td>{row.punch_out_time ? new Date(row.punch_out_time).toLocaleTimeString() : '-'}</td>
                  <td>{row.working_hours ? `${row.working_hours} hrs` : '-'}</td>
                  <td>
                    <img 
                      src={`${API_BASE}${row.punch_in_selfie_path}`} 
                      style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }}
                      alt="selfie" 
                      onClick={() => window.open(`${API_BASE}${row.punch_in_selfie_path}`, '_blank')}
                    />
                  </td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div>IP: {row.punch_ip || 'Captured'}</div>
                    <div>{row.punch_in_browser} ({row.punch_in_device})</div>
                  </td>
                  <td>
                    {row.is_late === 1 ? (
                      <span className="badge badge-danger">Late</span>
                    ) : (
                      <span className="badge badge-success">On-Time</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCOPED ATTENDANCE OVERVIEW (FOR ADMINS / TEAM LEADERS) */}
      {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {user.role === 'Super Admin' ? 'Company Attendance Dashboard' : 'Team Attendance Console'}
            </span>
          </div>

          {/* Stats widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f9fafb' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Punches</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginTop: '4px' }}>{activeDashboardRecords.length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>On Time Arrivals</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>{activeDashboardRecords.filter(r => r.is_late !== 1).length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Late Arrivals</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>{activeDashboardRecords.filter(r => r.is_late === 1).length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Shifts</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>{activeDashboardRecords.filter(r => !r.punch_out_time).length}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Late arrival rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
                {activeDashboardRecords.length > 0 
                  ? `${Math.round((activeDashboardRecords.filter(r => r.is_late === 1).length / activeDashboardRecords.length) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours Worked</th>
                  <th>Selfie</th>
                  <th>Log Details</th>
                  <th>Location Map</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeDashboardRecords.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{row.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.user_role} • {row.employee_id}</div>
                    </td>
                    <td>{row.attendance_date ? row.attendance_date.split('T')[0] : '-'}</td>
                    <td>{new Date(row.punch_in_time).toLocaleTimeString()}</td>
                    <td>{row.punch_out_time ? new Date(row.punch_out_time).toLocaleTimeString() : 'Active'}</td>
                    <td>{row.working_hours ? `${row.working_hours} hrs` : '-'}</td>
                    <td>
                      {row.punch_in_selfie_path && row.punch_in_selfie_path !== 'Selfie Not Shared' && !row.punch_in_selfie_path.startsWith('Selfie Not') ? (
                        <img 
                          src={`${API_BASE}${row.punch_in_selfie_path}`} 
                          style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }}
                          alt="selfie" 
                          onClick={() => window.open(`${API_BASE}${row.punch_in_selfie_path}`, '_blank')}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Photo</span>
                      )}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <div>IP: {row.punch_in_ip}</div>
                      <div>{row.punch_in_browser} ({row.punch_in_device})</div>
                    </td>
                    <td>
                      <div>
                        In: {row.punch_in_location && row.punch_in_location !== 'Not Shared' ? (
                          <a href={`https://www.google.com/maps?q=${row.punch_in_location}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '11px' }}>📍 Map View</a>
                        ) : 'Not Shared'}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        Out: {row.punch_out_location && row.punch_out_location !== 'Not Shared' && row.punch_out_location !== 'Pending' ? (
                          <a href={`https://www.google.com/maps?q=${row.punch_out_location}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '11px' }}>📍 Map View</a>
                        ) : '-'}
                      </div>
                    </td>
                    <td>
                      {row.is_late === 1 ? (
                        <span className="badge badge-danger">Late</span>
                      ) : (
                        <span className="badge badge-success">On-Time</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WEBCAM CAMERA MODAL */}
      {showWebcamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Punch In - Camera Verification</h3>
              <button className="modal-close" onClick={() => { stopCamera(); setShowWebcamModal(false); }}><Icons.Close /></button>
            </div>
            <div className="modal-body webcam-container">
              {cameraError ? (
                <div style={{ color: 'var(--danger)', textAlign: 'center', fontSize: '13px' }}>
                  {cameraError}
                  <div style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '11px' }}>Proceeding will create a template photo verify log.</div>
                </div>
              ) : (
                <>
                  {!selfieSrc ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="webcam-preview"></video>
                      <button className="btn btn-secondary" onClick={capturePhoto}>Capture Photo</button>
                    </>
                  ) : (
                    <>
                      <img src={selfieSrc} style={{ width: '300px', height: '300px', borderRadius: '8px', objectFit: 'cover' }} alt="selfie preview" />
                      <button className="btn btn-secondary" onClick={() => { setSelfieSrc(''); startCamera(); }}>Retake Photo</button>
                    </>
                  )}
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { stopCamera(); setShowWebcamModal(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePunchInSubmit} disabled={punching}>
                {punching ? 'Registering...' : 'Complete Punch-In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// VACANCIES COMPONENT
// ==========================================
function VacanciesView({ user, token }) {
  const [vacancies, setVacancies] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState(null);

  // Assignment states
  const [recruiters, setRecruiters] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [targetCount, setTargetCount] = useState(5);

  // Form states
  const [formData, setFormData] = useState({
    title: '', description: '', target_profiles: '', priority: 'Medium', deadline: '', remarks: ''
  });

  // JD states
  const [jdFile, setJdFile] = useState(null);
  const [jdRawText, setJdRawText] = useState('');
  const [detailTab, setDetailTab] = useState('info');

  // Team assignment states
  const [teams, setTeams] = useState([]);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [teamQuota, setTeamQuota] = useState(5);

  useEffect(() => {
    fetchVacancies();
    if (user.role === 'Super Admin' || user.role === 'Team Leader') {
      fetchRecruiters();
    }
    if (user.role === 'Super Admin') {
      fetchTeams();
    }
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVacancies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vacancies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setVacancies(data.vacancies || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecruiters = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams/recruiters/unassigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      // Keep only Recruiters
      setRecruiters(data.users ? data.users.filter(u => u.role === 'Recruiter') : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('target_profiles', formData.target_profiles);
    uploadData.append('priority', formData.priority);
    uploadData.append('deadline', formData.deadline);
    uploadData.append('remarks', formData.remarks);
    if (jdRawText) {
      uploadData.append('jd_raw_text', jdRawText);
    }
    if (jdFile) {
      uploadData.append('jd_file', jdFile);
    }

    try {
      const res = await fetch(`${API_BASE}/api/vacancies`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', target_profiles: '', priority: 'Medium', deadline: '', remarks: '' });
        setJdRawText('');
        setJdFile(null);
        fetchVacancies();
      }
    } catch (err) {
      alert('Error creating vacancy');
    }
  };

  const viewDetails = async (vacId) => {
    try {
      const res = await fetch(`${API_BASE}/api/vacancies/${vacId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedVacancy(data);
      setDetailTab('info'); // Reset tab
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assigneeId) return;
    try {
      const res = await fetch(`${API_BASE}/api/vacancies/${selectedVacancy.vacancy.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: assigneeId, targetSourcingCount: targetCount })
      });
      if (res.ok) {
        setAssigneeId('');
        setTargetCount(5);
        viewDetails(selectedVacancy.vacancy.id);
        fetchVacancies();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      alert('Failed to assign vacancy');
    }
  };

  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!assignTeamId) return;
    try {
      const res = await fetch(`${API_BASE}/api/vacancies/${selectedVacancy.vacancy.id}/assign-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamId: parseInt(assignTeamId), targetSubmissionsCount: teamQuota })
      });
      if (res.ok) {
        setAssignTeamId('');
        setTeamQuota(5);
        alert('Vacancy assigned to team successfully!');
        viewDetails(selectedVacancy.vacancy.id);
        fetchVacancies();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to assign team');
      }
    } catch (err) {
      alert('Failed to assign team');
    }
  };

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`${API_BASE}/api/vacancies/${selectedVacancy.vacancy.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        viewDetails(selectedVacancy.vacancy.id);
        fetchVacancies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Vacancy Database</h2>
          <div className="page-subtitle">Track job assignments, target profiles and sourcing timelines.</div>
        </div>
        {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Icons.Plus /> Create Vacancy
          </button>
        )}
      </div>

      {/* VACANCY LIST */}
      <div className="card">
        <div className="table-container">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Target Profiles</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Submits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vacancies.map(vac => (
                <tr key={vac.id}>
                  <td style={{ fontWeight: '600' }}>{vac.title}</td>
                  <td>{vac.target_profiles || 'General'}</td>
                  <td>
                    <span className={`badge ${vac.priority === 'High' ? 'badge-danger' : vac.priority === 'Medium' ? 'badge-warning' : 'badge-info'}`}>
                      {vac.priority}
                    </span>
                  </td>
                  <td>{new Date(vac.deadline).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${vac.status === 'Open' ? 'badge-success' : vac.status === 'Hold' ? 'badge-warning' : 'badge-neutral'}`}>
                      {vac.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {user.role === 'Recruiter' ? 'Assigned' : `${vac.assignees_count || 0} recruiters`}
                  </td>
                  <td><strong>{vac.candidate_count || 0}</strong></td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => viewDetails(vac.id)}>Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Create Vacancy Requirement</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><Icons.Close /></button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Vacancy Title</label>
                  <input type="text" className="form-control" placeholder="e.g. Senior Node.js Developer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Job Description</label>
                  <textarea rows="4" className="form-control" placeholder="Roles, responsibilities and key qualifiers..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required></textarea>
                </div>
                <div className="form-group">
                  <label>Target Profiles / Keywords</label>
                  <input type="text" className="form-control" placeholder="e.g. AWS, Express, SQLite, 5+ yrs exp" value={formData.target_profiles} onChange={(e) => setFormData({ ...formData, target_profiles: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Submission Deadline</label>
                    <input type="date" className="form-control" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Internal Remarks / Notes</label>
                  <input type="text" className="form-control" placeholder="Budget, special client notes..." value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--primary)' }}>AI Vacancy Intelligence JD Parser Setup</h4>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Upload JD Document (PDF, TXT)</label>
                    <input type="file" className="form-control" accept=".pdf,.txt" onChange={(e) => setJdFile(e.target.files[0])} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Parser extracts 24 fields, generates verification questions and eligibility checklists.</span>
                  </div>
                  <div className="form-group">
                    <label>Or Paste Job Description text manually</label>
                    <textarea rows="3" className="form-control" placeholder="Paste full JD text here to run heuristic keyword parse..." value={jdRawText} onChange={(e) => setJdRawText(e.target.value)}></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedVacancy && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="card-title">Job Details: {selectedVacancy.vacancy.title}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><Icons.Close /></button>
            </div>
            
            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', backgroundColor: 'var(--bg-surface)' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '10px 16px', borderRadius: 0, borderBottom: detailTab === 'info' ? '2px solid var(--primary)' : 'none', color: detailTab === 'info' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}
                onClick={() => setDetailTab('info')}
              >
                Job Description & Assigns
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '10px 16px', borderRadius: 0, borderBottom: detailTab === 'ai' ? '2px solid var(--primary)' : 'none', color: detailTab === 'ai' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}
                onClick={() => setDetailTab('ai')}
              >
                AI Vacancy Intelligence
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              {detailTab === 'info' ? (
                <>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span className={`badge ${selectedVacancy.vacancy.priority === 'High' ? 'badge-danger' : 'badge-warning'}`}>{selectedVacancy.vacancy.priority} Priority</span>
                      <span className={`badge ${selectedVacancy.vacancy.status === 'Open' ? 'badge-success' : 'badge-neutral'}`}>{selectedVacancy.vacancy.status}</span>
                    </div>
                    <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-surface)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <strong>Description:</strong><br />
                      {selectedVacancy.vacancy.description}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div>Target profile parameters: <strong>{selectedVacancy.vacancy.target_profiles || 'General Sourcing'}</strong></div>
                    <div>Deadline: <strong>{new Date(selectedVacancy.vacancy.deadline).toLocaleDateString()}</strong></div>
                    {selectedVacancy.vacancy.remarks && <div>Internal Remarks: <strong>{selectedVacancy.vacancy.remarks}</strong></div>}
                    {selectedVacancy.vacancy.jd_file_path && (
                      <div>Job Document: <a href={`${API_BASE}${selectedVacancy.vacancy.jd_file_path}`} target="_blank" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Download JD File</a></div>
                    )}
                    <div>Owner/Creator: <strong>{selectedVacancy.vacancy.creator_name}</strong></div>
                  </div>

                  {/* Status Update Options */}
                  {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>Change Job State:</span>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => updateStatus('Open')}>Open</button>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => updateStatus('Hold')}>Hold</button>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => updateStatus('Closed')}>Close</button>
                    </div>
                  )}

                  {/* Assign Job form */}
                  {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Assign Recruiter & Create Target Task</h4>
                      <form onSubmit={handleAssign} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: '1', marginBottom: 0 }}>
                          <label style={{ fontSize: '11px' }}>Recruiter</label>
                          <select className="form-control" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                            <option value="">Select Recruiter...</option>
                            {recruiters.map(r => (
                              <option key={r.id} value={r.id}>{r.full_name} ({r.employee_id})</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                          <label style={{ fontSize: '11px' }}>Target Profiles</label>
                          <input type="number" className="form-control" min="1" max="100" value={targetCount} onChange={(e) => setTargetCount(parseInt(e.target.value))} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Assign</button>
                      </form>
                    </div>
                  )}

                  {user.role === 'Super Admin' && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Assign Team Sourcing Quota</h4>
                      <form onSubmit={handleAssignTeam} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: '1', marginBottom: 0 }}>
                          <label style={{ fontSize: '11px' }}>Team</label>
                          <select className="form-control" value={assignTeamId} onChange={(e) => setAssignTeamId(e.target.value)} required>
                            <option value="">Select Team...</option>
                            {teams.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                          <label style={{ fontSize: '11px' }}>Submission Quota</label>
                          <input type="number" className="form-control" min="1" max="100" value={teamQuota} onChange={(e) => setTeamQuota(parseInt(e.target.value))} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Assign Team</button>
                      </form>
                    </div>
                  )}

                  {/* Assignees Table */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Current Assignees ({selectedVacancy.assignments.length})</h4>
                    {selectedVacancy.assignments.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recruiters assigned yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedVacancy.assignments.map(asg => (
                          <span key={asg.id} className="badge badge-neutral" style={{ padding: '6px 10px' }}>
                            {asg.full_name} ({asg.employee_id})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Candidate table */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Sourced Candidates ({selectedVacancy.candidates.length})</h4>
                    {selectedVacancy.candidates.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No candidate profiles submitted yet.</div>
                    ) : (
                      <div className="table-container">
                        <table className="tg-table" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Status</th>
                              <th>Uploaded</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedVacancy.candidates.map(c => (
                              <tr key={c.id}>
                                <td>{c.name}</td>
                                <td>
                                  <span className={`badge badge-pipeline-${c.pipeline_status.toLowerCase()}`}>{c.pipeline_status}</span>
                                </td>
                                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const jdAnalysis = selectedVacancy.vacancy.jd_analysis 
                      ? (typeof selectedVacancy.vacancy.jd_analysis === 'string' ? JSON.parse(selectedVacancy.vacancy.jd_analysis) : selectedVacancy.vacancy.jd_analysis)
                      : null;
                    
                    if (!jdAnalysis) {
                      return (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          No Job Description parameters have been parsed for this vacancy. Add/re-create the vacancy with a JD file or raw text to activate AI Vacancy Intelligence.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(217, 37, 37, 0.1)', fontSize: '13px' }}>
                          <strong>Parsed Title:</strong> {jdAnalysis.title} | <strong>Client:</strong> {jdAnalysis.company || 'TalentGrade client'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div>Department: <strong>{jdAnalysis.department || '-'}</strong></div>
                          <div>Employment Type: <strong>{jdAnalysis.employmentType || '-'}</strong></div>
                          <div>Location: <strong>{jdAnalysis.location || '-'}, {jdAnalysis.country || '-'}</strong></div>
                          <div>Experience Required: <strong>{jdAnalysis.experienceRequired || '-'}</strong></div>
                          <div>Education Target: <strong>{jdAnalysis.educationRequired || '-'}</strong></div>
                          <div>Languages: <strong>{jdAnalysis.languagesRequired || '-'}</strong></div>
                          <div>Mandatory Skills: <strong style={{ color: 'var(--primary)' }}>{jdAnalysis.mandatorySkills || '-'}</strong></div>
                          <div>Preferred Skills: <strong>{jdAnalysis.preferredSkills || '-'}</strong></div>
                          <div>Priority Keywords: <strong>{jdAnalysis.keywords || '-'}</strong></div>
                          <div>Soft Skills: <strong>{jdAnalysis.softSkills || '-'}</strong></div>
                          <div>Target Licenses: <strong style={{ color: 'var(--primary)' }}>{jdAnalysis.licenseRequirements || 'None'}</strong></div>
                          <div>Salary Budget Max: <strong>{jdAnalysis.salaryRange || 'Not specified'}</strong></div>
                          <div>Visa/Sponsorship: <strong>{jdAnalysis.visaRequirements || '-'}</strong></div>
                          <div>Required Certs: <strong>{jdAnalysis.certifications || 'None'}</strong></div>
                          <div>Benefits / Perks: <strong>{jdAnalysis.benefits || '-'}</strong></div>
                          <div>Joining Period: <strong>{jdAnalysis.joiningTimeline || '-'}</strong></div>
                          <div>Interview Flow steps: <strong>{jdAnalysis.interviewProcess || '-'}</strong></div>
                          <div>Gender Preference: <strong>{jdAnalysis.genderPreference || 'None'}</strong></div>
                          <div>Nationality Preference: <strong>{jdAnalysis.nationalityPreference || 'Any'}</strong></div>
                          <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '6px' }}>
                            <strong style={{ fontSize: '13px' }}>Extracted Key Responsibilities:</strong>
                            <p style={{ marginTop: '4px', fontSize: '12px', color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                              {jdAnalysis.jobResponsibilities}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// TASKS COMPONENT
// ==========================================
function TasksView({ user, token }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Splitting Quota States
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitTask, setSplitTask] = useState(null);
  const [recruitersList, setRecruitersList] = useState([]);
  const [splitAssignments, setSplitAssignments] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openSplitModal = async (task) => {
    setSplitTask(task);
    setShowSplitModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/teams/recruiters/unassigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      // Keep only Recruiters on the same team as the Team Leader (or all if Super Admin)
      const filtered = data.users.filter(u => u.role === 'Recruiter' && (user.role === 'Super Admin' || u.team_id === user.team_id));
      setRecruitersList(filtered);

      // Populate current assignments if any
      const initial = {};
      filtered.forEach(r => {
        const existingChild = task.child_tasks ? task.child_tasks.find(c => c.assigned_to === r.id) : null;
        initial[r.id] = {
          sourcing: existingChild ? existingChild.target_sourcing_count : 5,
          submissions: existingChild ? existingChild.target_submissions_count : 1
        };
      });
      setSplitAssignments(initial);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSplitSubmit = async (e) => {
    e.preventDefault();
    const payload = Object.entries(splitAssignments).map(([recruiterId, vals]) => ({
      recruiterId: parseInt(recruiterId),
      targetSourcingCount: parseInt(vals.sourcing),
      targetSubmissionsCount: parseInt(vals.submissions)
    })).filter(a => a.targetSourcingCount > 0 || a.targetSubmissionsCount > 0);

    try {
      const res = await fetch(`${API_BASE}/api/tasks/${splitTask.id}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignments: payload })
      });
      if (res.ok) {
        alert('Sourcing targets split successfully!');
        setShowSplitModal(false);
        setSplitTask(null);
        fetchTasks();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to split tasks');
      }
    } catch (err) {
      alert('Failed to split tasks');
    }
  };

  const viewTaskComments = async (task) => {
    setSelectedTask(task);
    setNewComment('');
    setFileAttachment(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${task.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && !fileAttachment) return;

    const formData = new FormData();
    formData.append('comment', newComment);
    if (fileAttachment) {
      formData.append('attachment', fileAttachment);
    }

    try {
      const res = await fetch(`${API_BASE}/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setNewComment('');
        setFileAttachment(null);
        viewTaskComments(selectedTask);
      } else {
        alert('Failed to post comment');
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Recruiter Task Board</h2>
          <div className="page-subtitle">Manage sourcing targets and report vacancies status.</div>
        </div>
      </div>

      <div className="grid-2-1">
        {/* TASK MATRIX */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Assigned Tasks ({tasks.length})</span>
          </div>
          <div className="table-container">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Task Title / Job</th>
                  <th>Target Count</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isTeamTask = task.team_id && !task.parent_task_id;
                  return (
                    <React.Fragment key={task.id}>
                      <tr style={{ cursor: 'pointer', backgroundColor: isTeamTask ? 'rgba(217, 37, 37, 0.01)' : '' }} onClick={() => viewTaskComments(task)}>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {isTeamTask ? (
                              <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>Team Target</span>
                            ) : (
                              <span className="badge badge-neutral" style={{ fontSize: '9px', padding: '2px 6px' }}>Recruiter Target</span>
                            )}
                            <span style={{ fontWeight: '600' }}>{task.title}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Vacancy: {task.vacancy_title} | {isTeamTask ? `Team: ${task.team_name || 'Unassigned'}` : `Assignee: ${task.recruiter_name}`}
                          </div>
                        </td>
                        <td>
                          {isTeamTask ? (
                            <div>
                              <div style={{ fontWeight: '600' }}>{task.target_submissions_count} submissions</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Progress: {task.submissions_progress} approved</div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: '600' }}>{task.target_sourcing_count} source / {task.target_submissions_count} submit</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Progress: {task.sourced_progress} Sourced | {task.submissions_progress} Submitted</div>
                            </div>
                          )}
                        </td>
                        <td>{new Date(task.deadline).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            task.status === 'Completed' ? 'badge-success' : 
                            task.status === 'In Progress' ? 'badge-info' : 
                            task.status === 'Overdue' ? 'badge-danger' : 
                            task.status === 'Submitted' ? 'badge-warning' : 'badge-neutral'
                          }`}>{task.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                            <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => viewTaskComments(task)}>Feed</button>
                            {isTeamTask && (user.role === 'Team Leader' || user.role === 'Super Admin') && (
                              <button className="btn btn-primary" style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: 'var(--primary)', color: '#fff' }} onClick={() => openSplitModal(task)}>Split Targets</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* If team task is selected, show recruiters child progress details row */}
                      {isTeamTask && task.child_tasks && task.child_tasks.length > 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '8px 24px', backgroundColor: '#f9fafb' }}>
                            <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Team Sourcing Split:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                              {task.child_tasks.map(child => (
                                <div key={child.id} style={{ backgroundColor: '#fff', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '4px' }}>
                                  <div style={{ fontWeight: '700', fontSize: '12px' }}>{child.recruiter_name}</div>
                                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span>Source: {child.sourced_progress} / {child.target_sourcing_count}</span>
                                    <span>Submit: {child.submissions_progress} / {child.target_submissions_count}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* FEED / DETAIL VIEWER */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Task Feed & Status Controls</span>
          </div>
          <div className="card-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{selectedTask.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedTask.description}</p>
                </div>

                {/* Progress bars for individual recruiter tasks */}
                {!selectedTask.team_id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600' }}>
                      <span>Sourcing Target</span>
                      <span>{selectedTask.sourced_progress} / {selectedTask.target_sourcing_count} ({Math.min(100, Math.round((selectedTask.sourced_progress / selectedTask.target_sourcing_count) * 100)) || 0}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (selectedTask.sourced_progress / selectedTask.target_sourcing_count) * 100)}%`, backgroundColor: '#3b82f6', borderRadius: '3px' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>
                      <span>Submission Target</span>
                      <span>{selectedTask.submissions_progress} / {selectedTask.target_submissions_count} ({Math.min(100, Math.round((selectedTask.submissions_progress / selectedTask.target_submissions_count) * 100)) || 0}%)</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (selectedTask.submissions_progress / selectedTask.target_submissions_count) * 100)}%`, backgroundColor: '#10b981', borderRadius: '3px' }}></div>
                    </div>
                  </div>
                )}

                {/* Status Toggle buttons */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleStatusChange(selectedTask.id, 'In Progress')} disabled={updatingStatus}>Start Work</button>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleStatusChange(selectedTask.id, 'Submitted')} disabled={updatingStatus}>Submit Sourcing</button>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleStatusChange(selectedTask.id, 'Completed')} disabled={updatingStatus}>Mark Completed</button>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleStatusChange(selectedTask.id, 'Cancelled')} disabled={updatingStatus}>Cancel</button>
                </div>

                {/* Comment Feed list */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', minHeight: '150px' }}>
                  {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>No comments or feedback posted yet.</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>
                          {c.full_name[0]}
                        </div>
                        <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontWeight: '600', fontSize: '11px' }}>{c.full_name} ({c.role})</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleTimeString()}</span>
                          </div>
                          <div style={{ fontSize: '12px' }}>{c.comment}</div>
                          {c.attachment_path && (
                            <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                              <a href={`${API_BASE}${c.attachment_path}`} target="_blank" style={{ fontSize: '11px', color: 'var(--primary)', textDecoration: 'underline' }}>
                                View Attachment File
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Posting interface */}
                <form onSubmit={handleCommentSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div className="form-group" style={{ marginBottom: '8px' }}>
                    <input type="text" className="form-control" placeholder="Type comments or task update feedback..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input type="file" style={{ fontSize: '11px' }} onChange={(e) => setFileAttachment(e.target.files[0])} />
                    <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Send Feed</button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: '1', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Select a task to view comments, status controls and attachments.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SPLIT QUOTAS MODAL */}
      {showSplitModal && splitTask && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="card-title">Split Targets: {splitTask.title}</h3>
              <button className="close-btn" onClick={() => { setShowSplitModal(false); setSplitTask(null); }}><Icons.Close /></button>
            </div>
            <form onSubmit={handleSplitSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '4px' }}>
                <strong>Requested Team Target:</strong> {splitTask.target_submissions_count} profiles. Allocate sourcing and submission quotas to your team's recruiters below.
              </div>

              {recruitersList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  No active recruiters found in your team. Map team users first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recruitersList.map(rec => (
                    <div key={rec.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ fontWeight: '600', fontSize: '12px' }}>{rec.full_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {rec.employee_id}</div>
                      </div>
                      <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                        <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Sourcing</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          min="0" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={splitAssignments[rec.id]?.sourcing || 0}
                          onChange={(e) => {
                            const updated = { ...splitAssignments };
                            updated[rec.id] = { ...updated[rec.id], sourcing: parseInt(e.target.value) || 0 };
                            setSplitAssignments(updated);
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                        <label style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Submissions</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          min="0" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={splitAssignments[rec.id]?.submissions || 0}
                          onChange={(e) => {
                            const updated = { ...splitAssignments };
                            updated[rec.id] = { ...updated[rec.id], submissions: parseInt(e.target.value) || 0 };
                            setSplitAssignments(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Aggregated details check */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <span>Allocated submissions:</span>
                <span style={{ color: Object.values(splitAssignments).reduce((a, b) => a + (b.submissions || 0), 0) >= splitTask.target_submissions_count ? 'var(--success)' : 'var(--primary)' }}>
                  {Object.values(splitAssignments).reduce((a, b) => a + (b.submissions || 0), 0)} / {splitTask.target_submissions_count} profiles
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: '1' }} onClick={() => { setShowSplitModal(false); setSplitTask(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: '1' }} disabled={recruitersList.length === 0}>Save Allocations</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// CANDIDATES & PIPELINE KANBAN COMPONENT
// ==========================================
function CandidatesView({ user, token }) {
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [activeBoardMode, setActiveBoardMode] = useState(true); // Pipeline vs list
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Sourcing filters
  const [search, setSearch] = useState('');
  const [selectedVacancyFilter, setSelectedVacancyFilter] = useState('');
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiterFilter, setSelectedRecruiterFilter] = useState('');

  // Resume uploading parsing states
  const [resumeFile, setResumeFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [savingCandidate, setSavingCandidate] = useState(false);

  // Detail viewer states
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // AI Screening Assistant States
  const [candTab, setCandTab] = useState('profile');
  const [screeningData, setScreeningData] = useState(null);
  const [checklistAnswers, setChecklistAnswers] = useState({});
  const [qAnswers, setQAnswers] = useState({});
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [aiMatchScoreData, setAiMatchScoreData] = useState(null);
  const [followUpQs, setFollowUpQs] = useState([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [savingScreening, setSavingScreening] = useState(false);
  const [selectedVacancyInt, setSelectedVacancyInt] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleCardDragStart = (e, candidateId) => {
    e.dataTransfer.setData('text/plain', candidateId.toString());
  };

  const handleFileDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);

    // 1. Check if it's a card drop (text/plain)
    const cardIdStr = e.dataTransfer.getData('text/plain');
    if (cardIdStr) {
      const candidateId = parseInt(cardIdStr);
      if (!isNaN(candidateId)) {
        await handlePipelineStatusChange(candidateId, targetStatus);
        return;
      }
    }

    // 2. Check if it's a file drop
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setResumeFile(file);
      setParsing(true);
      setDuplicateWarning('');
      setParsedData(null);
      setShowUploadModal(true); // Open modal

      const formData = new FormData();
      formData.append('resume', file);

      try {
        const res = await fetch(`${API_BASE}/api/candidates/parse-resume`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) alert(data.error || 'Failed to parse resume');
        else {
          setParsedData({
            ...data,
            nationality: '',
            current_salary: '',
            expected_salary: '',
            current_position: '',
            vacancy_id: selectedVacancyFilter || '',
            pipeline_status: targetStatus // Drop sets the status!
          });

          // Run duplicate detection check
          if (data.email || data.phone) {
            const dupCheck = await fetch(`${API_BASE}/api/candidates/check-duplicate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ email: data.email, phone: data.phone })
            });
            const dupData = await dupCheck.json();
            if (dupData.isDuplicate) {
              setDuplicateWarning(dupData.reason);
            }
          }
        }
      } catch (err) {
        alert('Network error parsing resume');
      } finally {
        setParsing(false);
      }
    }
  };

  useEffect(() => {
    if (user.role === 'Super Admin' || user.role === 'Team Leader') {
      fetchRecruiters();
    }
  }, []);

  const fetchRecruiters = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRecruiters(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchVacancies();
  }, [selectedVacancyFilter, selectedRecruiterFilter, search]);

  const fetchCandidates = async () => {
    try {
      const baseUrl = API_BASE || window.location.origin;
      const url = new URL('/api/candidates', baseUrl);
      if (search) url.searchParams.append('search', search);
      if (selectedVacancyFilter) url.searchParams.append('vacancy_id', selectedVacancyFilter);
      if (selectedRecruiterFilter) url.searchParams.append('recruiter_id', selectedRecruiterFilter);
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVacancies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vacancies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setVacancies(data.vacancies || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    setParsing(true);
    setDuplicateWarning('');
    setParsedData(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      // Parse file
      const res = await fetch(`${API_BASE}/api/candidates/parse-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || 'Failed to parse resume');
      else {
        setParsedData({
          ...data,
          nationality: '',
          current_salary: '',
          expected_salary: '',
          current_position: '',
          vacancy_id: selectedVacancyFilter || '',
          pipeline_status: 'New'
        });

        // Run duplicate detection check
        if (data.email || data.phone) {
          const dupCheck = await fetch(`${API_BASE}/api/candidates/check-duplicate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: data.email, phone: data.phone })
          });
          const dupData = await dupCheck.json();
          if (dupData.isDuplicate) {
            setDuplicateWarning(dupData.reason);
          }
        }
      }
    } catch (err) {
      alert('Network error parsing resume');
    } finally {
      setParsing(false);
    }
  };

  const handleCandidateSave = async (e) => {
    e.preventDefault();
    setSavingCandidate(true);
    try {
      const res = await fetch(`${API_BASE}/api/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(parsedData)
      });
      if (res.ok) {
        setShowUploadModal(false);
        setParsedData(null);
        setResumeFile(null);
        fetchCandidates();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      alert('Failed to register candidate');
    } finally {
      setSavingCandidate(false);
    }
  };

  const viewCandidateDetails = async (candidateId) => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates/${candidateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedCandidate(data);
      setCandTab('profile'); // reset tab
      setScreeningData(null); // reset screening data
      setChecklistAnswers({}); // reset checklist answers
      setQAnswers({}); // reset questionnaire answers
      setRecruiterNotes('');
      setRecommendation('');
      setAiMatchScoreData(null);
      setFollowUpQs([]);
      setSelectedVacancyInt(null);
      setShowDetailModal(true);

      // Fetch vacancy intelligence
      const vIntRes = await fetch(`${API_BASE}/api/vacancies/${data.candidate.vacancy_id}/intelligence`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vIntData = await vIntRes.json();
      setSelectedVacancyInt(vIntData);

      // Fetch screening data
      const sRes = await fetch(`${API_BASE}/api/screenings/candidate/${candidateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sData = await sRes.json();
      if (sData.screening) {
        setScreeningData(sData.screening);
        setChecklistAnswers(sData.screening.answers || {});
        setQAnswers(sData.screening.answers ? (sData.screening.answers.questions || {}) : {});
        setRecruiterNotes(sData.screening.recruiter_notes || '');
        setRecommendation(sData.screening.recruiter_recommendation || '');
        
        let scoresObj = sData.screening.ai_match_scores;
        if (typeof scoresObj === 'string') {
          try { scoresObj = JSON.parse(scoresObj); } catch(e){}
        }
        setAiMatchScoreData({
          scores: scoresObj,
          aiRecommendation: sData.screening.recruiter_recommendation,
          aiReasoning: sData.screening.ai_reasoning,
          missingInfo: sData.screening.missing_info ? (typeof sData.screening.missing_info === 'string' ? JSON.parse(sData.screening.missing_info) : sData.screening.missing_info) : []
        });
        setFollowUpQs(sData.screening.follow_up_questions || []);
      } else {
        // Run match calculations
        const mRes = await fetch(`${API_BASE}/api/candidates/${candidateId}/match`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ vacancyId: data.candidate.vacancy_id })
        });
        const mData = await mRes.json();
        setAiMatchScoreData(mData.matchResult);
        setFollowUpQs(mData.followUps || []);
      }
    } catch (err) {
      console.error('Error fetching details', err);
    }
  };

  const handleRecalculateMatch = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates/${selectedCandidate.candidate.id}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          vacancyId: selectedCandidate.candidate.vacancy_id,
          answers: { ...checklistAnswers, questions: qAnswers }
        })
      });
      const data = await res.json();
      setAiMatchScoreData(data.matchResult);
      setFollowUpQs(data.followUps || []);
      alert('AI score recalculated successfully based on screening replies!');
    } catch (err) {
      console.error(err);
      alert('Error recalculating scores');
    }
  };

  const handleSaveScreening = async (e) => {
    e.preventDefault();
    if (!recommendation) {
      alert('Please select a screening recommendation');
      return;
    }
    setSavingScreening(true);
    try {
      const res = await fetch(`${API_BASE}/api/screenings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateId: selectedCandidate.candidate.id,
          vacancyId: selectedCandidate.candidate.vacancy_id,
          answers: { ...checklistAnswers, questions: qAnswers },
          followUpQuestions: followUpQs,
          aiMatchScores: aiMatchScoreData.scores,
          missingInfo: aiMatchScoreData.missingInfo,
          recruiterNotes: recruiterNotes,
          recruiterRecommendation: recommendation,
          aiReasoning: aiMatchScoreData.aiReasoning
        })
      });
      if (res.ok) {
        alert('Screening results saved successfully');
        viewCandidateDetails(selectedCandidate.candidate.id);
      } else {
        alert('Error saving screening');
      }
    } catch (err) {
      alert('Failed to save screening');
    } finally {
      setSavingScreening(false);
    }
  };

  const handlePipelineStatusChange = async (candidateId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pipeline_status: newStatus })
      });
      if (res.ok) {
        fetchCandidates();
        if (selectedCandidate && selectedCandidate.candidate.id === candidateId) {
          viewCandidateDetails(candidateId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Groups candidates for Pipeline Kanban view
  const pipelineColumns = ['New', 'Screening', 'Submitted', 'Interview', 'Offer', 'Joined', 'Rejected', 'Dropped'];

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Candidate Pipelines & Sourcing</h2>
          <div className="page-subtitle">Upload profiles, run duplicate check, and move steps.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveBoardMode(!activeBoardMode)}>
            {activeBoardMode ? 'Show List View' : 'Show Pipeline Board'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Icons.Plus /> Upload Resume Profile
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by candidate name, skills, location keywords..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '240px' }}>
            <select className="form-control" value={selectedVacancyFilter} onChange={(e) => setSelectedVacancyFilter(e.target.value)}>
              <option value="">All Vacancies</option>
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
          </div>
          {(user.role === 'Super Admin' || user.role === 'Team Leader') && (
            <div style={{ width: '240px' }}>
              <select className="form-control" value={selectedRecruiterFilter} onChange={(e) => setSelectedRecruiterFilter(e.target.value)}>
                <option value="">All Recruiters</option>
                {recruiters.map(r => (
                  <option key={r.id} value={r.id}>{r.full_name} ({r.role})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* PIPELINE BOARD KANBAN */}
      {activeBoardMode ? (
        <div className="pipeline-board">
          {pipelineColumns.map(col => {
            const list = candidates.filter(c => c.pipeline_status === col);
            const isOver = dragOverCol === col;
            return (
              <div 
                key={col} 
                className={`pipeline-col ${isOver ? 'drag-over' : ''}`}
                style={{
                  border: isOver ? '2px dashed var(--primary)' : '2px solid transparent',
                  borderRadius: '8px',
                  backgroundColor: isOver ? 'rgba(217, 37, 37, 0.03)' : '',
                  transition: 'all 0.15s ease'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverCol !== col) setDragOverCol(col);
                }}
                onDragLeave={() => {
                  if (dragOverCol === col) setDragOverCol(null);
                }}
                onDrop={(e) => handleFileDrop(e, col)}
              >
                <div className="pipeline-col-header">
                  <span className="pipeline-col-title">
                    {col}
                  </span>
                  <span className="pipeline-card-count">{list.length}</span>
                </div>
                <div className="pipeline-cards" style={{ minHeight: '120px' }}>
                  {list.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Drop files or assign profiles here</div>
                  ) : (
                    list.map(cand => (
                      <div 
                        key={cand.id} 
                        className="pipeline-card" 
                        draggable={true}
                        onDragStart={(e) => handleCardDragStart(e, cand.id)}
                        onClick={() => viewCandidateDetails(cand.id)}
                        style={{ cursor: 'grab' }}
                      >
                        <div className="pipeline-card-title">{cand.name}</div>
                        <div className="pipeline-card-meta">{cand.current_position || 'Candidate'}</div>
                        <div className="pipeline-card-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                          <span>Exp: {cand.experience_years} yrs</span>
                          <span>{cand.location || 'Unknown'}</span>
                        </div>
                        <div className="pipeline-card-meta" style={{ marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                          Sourced by: <strong>{cand.recruiter_name || 'System / Admin'}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* CANDIDATES LIST VIEW */
        <div className="card">
          <div className="table-container">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Applied Vacancy</th>
                  <th>Experience</th>
                  <th>Skills keywords</th>
                  <th>Location</th>
                  <th>Notice Period</th>
                  <th>Sourced By</th>
                  <th>Pipeline Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.email} • {c.phone}</div>
                    </td>
                    <td>{c.vacancy_title || 'Unassigned'}</td>
                    <td>{c.experience_years} yrs</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.skills}>{c.skills || '-'}</td>
                    <td>{c.location || '-'}</td>
                    <td>{c.notice_period_days} days</td>
                    <td>
                      <strong style={{ fontSize: '12px' }}>{c.recruiter_name || 'System / Admin'}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-pipeline-${c.pipeline_status.toLowerCase()}`}>{c.pipeline_status}</span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px' }} onClick={() => viewCandidateDetails(c.id)}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD RESUME MODAL & PARSER SCREEN */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="card-title">Upload & Parse Resume</h3>
              <button className="modal-close" onClick={() => { setShowUploadModal(false); setParsedData(null); setResumeFile(null); }}><Icons.Close /></button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!parsedData ? (
                /* Drag & Drop File Selector */
                <div style={{ border: '2px dashed var(--border-color)', padding: '40px', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
                  <Icons.Upload />
                  <p style={{ margin: '12px 0 6px', fontWeight: '500' }}>
                    {parsing ? 'Extracting text and running heuristics...' : 'Select or Drop Resume PDF/DOC/DOCX'}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Limits: PDF files are parsed automatically using local algorithms</span>
                  {!parsing && (
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      style={{ display: 'block', margin: '16px auto 0' }} 
                      onChange={handleResumeFileSelect} 
                    />
                  )}
                </div>
              ) : (
                /* Parsed profile review form */
                <form onSubmit={handleCandidateSave}>
                  {duplicateWarning && (
                    <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '10px', borderRadius: '4px', fontSize: '12px', marginBottom: '14px' }}>
                      ⚠️ Duplicate Alert: {duplicateWarning}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label>Assigned Job Vacancy</label>
                      <select className="form-control" value={parsedData.vacancy_id || ''} onChange={(e) => setParsedData({ ...parsedData, vacancy_id: e.target.value || null })}>
                        <option value="">Select Job Position (Optional)...</option>
                        {vacancies.map(v => (
                          <option key={v.id} value={v.id}>{v.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Candidate Name</label>
                        <input type="text" className="form-control" value={parsedData.name} onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" className="form-control" value={parsedData.email} onChange={(e) => setParsedData({ ...parsedData, email: e.target.value })} required />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="text" className="form-control" value={parsedData.phone} onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Location / City</label>
                        <input type="text" className="form-control" value={parsedData.location} onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Nationality</label>
                        <input type="text" className="form-control" value={parsedData.nationality} onChange={(e) => setParsedData({ ...parsedData, nationality: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Experience (Years)</label>
                        <input type="number" className="form-control" value={parsedData.experience_years} onChange={(e) => setParsedData({ ...parsedData, experience_years: parseInt(e.target.value) })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Key Skills keywords</label>
                      <input type="text" className="form-control" value={parsedData.skills} onChange={(e) => setParsedData({ ...parsedData, skills: e.target.value })} />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Current Position</label>
                        <input type="text" className="form-control" value={parsedData.current_position} onChange={(e) => setParsedData({ ...parsedData, current_position: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Notice Period (Days)</label>
                        <input type="number" className="form-control" value={parsedData.notice_period_days} onChange={(e) => setParsedData({ ...parsedData, notice_period_days: parseInt(e.target.value) })} />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Current Salary (LPA / Annual)</label>
                        <input type="number" step="any" className="form-control" value={parsedData.current_salary} onChange={(e) => setParsedData({ ...parsedData, current_salary: parseFloat(e.target.value) })} />
                      </div>
                      <div className="form-group">
                        <label>Expected Salary (LPA / Annual)</label>
                        <input type="number" step="any" className="form-control" value={parsedData.expected_salary} onChange={(e) => setParsedData({ ...parsedData, expected_salary: parseFloat(e.target.value) })} />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer" style={{ borderTop: 'none', padding: '16px 0 0' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setParsedData(null); setResumeFile(null); }}>Reset</button>
                    <button type="submit" className="btn btn-primary" disabled={savingCandidate}>{savingCandidate ? 'Saving Profile...' : 'Save Candidate Profile'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAIL & TIMELINE MODAL */}
      {showDetailModal && selectedCandidate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="card-title">Candidate Sourcing Dossier: {selectedCandidate.candidate.name}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><Icons.Close /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px', backgroundColor: 'var(--bg-surface)' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '10px 16px', borderRadius: 0, borderBottom: candTab === 'profile' ? '2px solid var(--primary)' : 'none', color: candTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}
                onClick={() => setCandTab('profile')}
              >
                Profile & Sourcing History
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '10px 16px', borderRadius: 0, borderBottom: candTab === 'screening' ? '2px solid var(--primary)' : 'none', color: candTab === 'screening' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', fontSize: '13px' }}
                onClick={() => setCandTab('screening')}
              >
                AI screening Assistant
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
              
              {candTab === 'profile' ? (
                <>
                  {/* Header profile cards */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{selectedCandidate.candidate.name}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {selectedCandidate.candidate.current_position || 'No Current Position'} • Exp: {selectedCandidate.candidate.experience_years} years
                      </div>
                    </div>
                    <span className={`badge badge-pipeline-${selectedCandidate.candidate.pipeline_status.toLowerCase()}`} style={{ padding: '6px 14px', fontSize: '12px' }}>
                      {selectedCandidate.candidate.pipeline_status}
                    </span>
                  </div>

                  {/* Status workflow selector */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', width: '100%', marginBottom: '4px' }}>Update Pipeline State:</span>
                    {pipelineColumns.map(st => (
                      <button 
                        key={st} 
                        className="btn btn-secondary" 
                        style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: selectedCandidate.candidate.pipeline_status === st ? 'var(--primary-light)' : '', color: selectedCandidate.candidate.pipeline_status === st ? 'var(--primary)' : '' }}
                        onClick={() => handlePipelineStatusChange(selectedCandidate.candidate.id, st)}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Grid details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>Email: <strong>{selectedCandidate.candidate.email}</strong></div>
                    <div>Phone: <strong>{selectedCandidate.candidate.phone}</strong></div>
                    <div>Nationality: <strong>{selectedCandidate.candidate.nationality || 'General'}</strong></div>
                    <div>Location: <strong>{selectedCandidate.candidate.location || '-'}</strong></div>
                    <div>Skills: <strong style={{ fontSize: '12px' }}>{selectedCandidate.candidate.skills || 'None'}</strong></div>
                    <div>Vacancy assigned: <strong>{selectedCandidate.candidate.vacancy_title || 'Unassigned'}</strong></div>
                    <div>Current CTC: <strong>{selectedCandidate.candidate.current_salary ? `${selectedCandidate.candidate.current_salary} LPA` : '-'}</strong></div>
                    <div>Expected CTC: <strong>{selectedCandidate.candidate.expected_salary ? `${selectedCandidate.candidate.expected_salary} LPA` : '-'}</strong></div>
                    <div>Notice Period: <strong>{selectedCandidate.candidate.notice_period_days} days</strong></div>
                    <div>Sourcing Recruiter: <strong>{selectedCandidate.candidate.recruiter_name}</strong></div>
                  </div>

                  {/* View resume PDF links */}
                  {selectedCandidate.candidate.resume_path && (
                    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px' }}>Resume File attached</span>
                      <a href={`${API_BASE}${selectedCandidate.candidate.resume_path}`} target="_blank" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }}>View Resume</a>
                    </div>
                  )}

                  {/* Activity Timeline logs */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Candidate Activity History</h4>
                    <div className="timeline">
                      {selectedCandidate.timeline.map(log => (
                        <div key={log.id} className="timeline-item">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="timeline-title">{log.action_type}</span>
                              <span className="timeline-time">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                            <div className="timeline-desc">{log.details}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>by {log.full_name} ({log.role})</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {aiMatchScoreData && (
                    <>
                      {/* AI Match Metrics */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>AI Resume Match Analysis</span>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>{aiMatchScoreData.scores ? `${aiMatchScoreData.scores.Overall}% Match` : ''}</span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                          {aiMatchScoreData.scores && Object.entries(aiMatchScoreData.scores).map(([label, val]) => {
                            if (label === 'Overall') return null;
                            return (
                              <div key={label} style={{ padding: '6px 10px', backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '4px' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
                                <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{val}%</span>
                                  <span style={{ color: val >= 80 ? '#10b981' : val >= 50 ? '#f59e0b' : '#ef4444' }}>●</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* AI assessment reasoning text */}
                        <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #f3f4f6', fontSize: '12px' }}>
                          <strong>AI Assessment:</strong> {aiMatchScoreData.aiReasoning}
                        </div>

                        {/* Gaps alerts */}
                        {aiMatchScoreData.missingInfo && aiMatchScoreData.missingInfo.length > 0 && (
                          <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', color: '#b91c1c', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong>⚠️ Candidate Sourcing Gaps / Missing Items:</strong>
                            <span style={{ fontSize: '11px' }}>{aiMatchScoreData.missingInfo.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Recruiter verification checklist */}
                      {selectedVacancyInt && selectedVacancyInt.jd_eligibility_checklist && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Recruiter Eligibility Checklist</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedVacancyInt.jd_eligibility_checklist.map(item => (
                              <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  style={{ marginTop: '2px' }}
                                  checked={!!checklistAnswers[item.key]} 
                                  onChange={(e) => {
                                    const updated = { ...checklistAnswers, [item.key]: e.target.checked };
                                    setChecklistAnswers(updated);
                                  }}
                                />
                                <div>
                                  <strong>{item.label}</strong>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{item.desc}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Structured questions verification replies */}
                      {selectedVacancyInt && selectedVacancyInt.jd_screening_questions && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Structured Screening Verification Questions</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['basic', 'experience', 'skills', 'certifications'].map(groupKey => {
                              const qs = selectedVacancyInt.jd_screening_questions[groupKey];
                              if (!qs || qs.length === 0) return null;
                              return (
                                <div key={groupKey}>
                                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '6px' }}>{groupKey} Questions</div>
                                  {qs.map(q => (
                                    <div key={q.id} style={{ marginBottom: '8px' }}>
                                      <label style={{ fontSize: '12px', display: 'block', marginBottom: '3px' }}>{q.text}</label>
                                      <input 
                                        type="text" 
                                        className="form-control" 
                                        style={{ fontSize: '12px', padding: '6px 10px' }}
                                        placeholder="Record candidate's screening response..."
                                        value={qAnswers[q.id] || ''}
                                        onChange={(e) => {
                                          const updated = { ...qAnswers, [q.id]: e.target.value };
                                          setQAnswers(updated);
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={handleRecalculateMatch}>
                              🔄 Refresh AI Match Score
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dynamic follow-up recommendations */}
                      {followUpQs && followUpQs.length > 0 && (
                        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '6px', color: '#b45309', fontSize: '12px' }}>
                          <strong>💡 Dynamic AI Screening Follow-ups to Ask Candidate:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {followUpQs.map((q, i) => <li key={i}>{q.text}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Notes and submission recommendation decision */}
                      <form onSubmit={handleSaveScreening} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', fontWeight: '600' }}>Recruiter Screening Evaluation Notes</label>
                          <textarea 
                            rows="3" 
                            className="form-control" 
                            style={{ fontSize: '12px' }}
                            placeholder="Add communication logs, salary expectations, notice exceptions..." 
                            value={recruiterNotes} 
                            onChange={(e) => setRecruiterNotes(e.target.value)}
                            required
                          ></textarea>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label style={{ fontSize: '12px', fontWeight: '600' }}>Overall Sourcing Recommendation</label>
                            <select 
                              className="form-control" 
                              style={{ fontSize: '12px' }}
                              value={recommendation} 
                              onChange={(e) => setRecommendation(e.target.value)}
                              required
                            >
                              <option value="">Select recommendation...</option>
                              <option value="Recommended">Recommended (Meets all parameters)</option>
                              <option value="Maybe">Maybe (Some deviations / client review needed)</option>
                              <option value="Not Suitable">Not Suitable (Gaps exist)</option>
                            </select>
                          </div>
                        </div>

                        {screeningData && screeningData.is_approved_by_tl === 1 ? (
                          <div style={{ backgroundColor: 'var(--success-light)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.1)', color: '#065f46', fontSize: '12px', textAlign: 'center' }}>
                            <strong>✓ Screening approved by Team Leader ({screeningData.approver_name || 'System Admin'}). Candidate submitted to client.</strong>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: '1' }} disabled={savingScreening}>
                              {savingScreening ? 'Saving evaluation...' : 'Save Screening Evaluation'}
                            </button>
                            {screeningData && (
                              <button type="button" className="btn btn-secondary" onClick={() => setShowSummaryModal(true)}>
                                📄 View One-Page Summary Sheet
                              </button>
                            )}
                          </div>
                        )}
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ONE-PAGE SCREENING SUMMARY MODAL */}
      {showSummaryModal && selectedCandidate && screeningData && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '800px', padding: '0px', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">One-Page Screening Dossier</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>Print Dossier</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSummaryModal(false)}>Close</button>
              </div>
            </div>
            <div id="printable-area" className="modal-body" style={{ padding: '32px', backgroundColor: '#fff', color: '#111827', fontFamily: 'Inter, sans-serif' }}>
              
              {/* Header and branding */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #d92525', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>TalentGrade HR Consultancy</h1>
                  <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Candidate Evaluation Dossier</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>TalentGrade ATS</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Grid 1: Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: '750', marginBottom: '8px', color: '#1f2937', textTransform: 'uppercase' }}>Candidate Profile</h2>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280', width: '120px' }}>Candidate Name:</td>
                        <td style={{ padding: '4px 0', fontWeight: '600' }}>{selectedCandidate.candidate.name}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Designation:</td>
                        <td style={{ padding: '4px 0', fontWeight: '600' }}>{selectedCandidate.candidate.current_position || 'Not Specified'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Contact Details:</td>
                        <td style={{ padding: '4px 0' }}>{selectedCandidate.candidate.email} | {selectedCandidate.candidate.phone}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Location:</td>
                        <td style={{ padding: '4px 0' }}>{selectedCandidate.candidate.location || 'Not Specified'} ({selectedCandidate.candidate.nationality || 'General'})</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0', color: '#6b7280' }}>Target Vacancy:</td>
                        <td style={{ padding: '4px 0', fontWeight: '600', color: '#d92525' }}>{selectedCandidate.candidate.vacancy_title || 'Unassigned'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>AI Overall Match</div>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#d92525', margin: '4px 0' }}>
                    {aiMatchScoreData && aiMatchScoreData.scores ? `${aiMatchScoreData.scores.Overall}%` : '-'}
                  </div>
                  <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(217,37,37,0.1)' }}>
                    {screeningData.recruiter_recommendation}
                  </span>
                </div>
              </div>

              {/* Grid 2: Scores Breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '750', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px', textTransform: 'uppercase', color: '#374151' }}>Matching Performance Breakdown</h3>
                {aiMatchScoreData && aiMatchScoreData.scores && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                    {Object.entries(aiMatchScoreData.scores).map(([key, val]) => {
                      if (key === 'Overall') return null;
                      return (
                        <div key={key} style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                          <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>{key}</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginTop: '2px' }}>{val}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grid 3: Screening Responses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px', fontSize: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '750', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px', textTransform: 'uppercase', color: '#374151' }}>Eligibility Verification</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {selectedVacancyInt && selectedVacancyInt.jd_eligibility_checklist && selectedVacancyInt.jd_eligibility_checklist.map(item => (
                        <tr key={item.key} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 0', color: '#4b5563' }}>{item.label}:</td>
                          <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: '600' }}>
                            {checklistAnswers[item.key] ? '✓ Passed' : '✗ Failed/No'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: '750', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px', textTransform: 'uppercase', color: '#374151' }}>AI Match Assessment</h3>
                  <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb', lineHeight: '1.4', fontSize: '11px' }}>
                    <strong>AI Analysis:</strong> {aiMatchScoreData ? aiMatchScoreData.aiReasoning : ''}
                    {aiMatchScoreData && aiMatchScoreData.missingInfo && aiMatchScoreData.missingInfo.length > 0 && (
                      <div style={{ marginTop: '6px', color: '#b91c1c' }}>
                        <strong>Gaps Flagged:</strong> {aiMatchScoreData.missingInfo.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 4: Interview Questionnaire Responses */}
              <div style={{ marginBottom: '20px', fontSize: '11px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '750', borderBottom: '1px solid #e5e7eb', paddingBottom: '6px', marginBottom: '10px', textTransform: 'uppercase', color: '#374151' }}>Screening Interview Responses</h3>
                {selectedVacancyInt && selectedVacancyInt.jd_screening_questions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['basic', 'experience', 'skills', 'certifications'].map(group => {
                      const qs = selectedVacancyInt.jd_screening_questions[group] || [];
                      if (qs.length === 0) return null;
                      return (
                        <div key={group} style={{ border: '1px solid #f3f4f6', borderRadius: '4px', padding: '8px' }}>
                          <div style={{ fontWeight: '700', textTransform: 'uppercase', color: '#d92525', marginBottom: '4px', fontSize: '9px' }}>{group} verification</div>
                          {qs.map(q => (
                            <div key={q.id} style={{ marginBottom: '4px' }}>
                              <div style={{ color: '#4b5563' }}>Q: {q.text}</div>
                              <div style={{ fontWeight: '600', paddingLeft: '8px', borderLeft: '2px solid #e5e7eb', marginTop: '2px' }}>A: {qAnswers[q.id] || 'Not recorded'}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grid 5: Evaluation Notes */}
              <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', fontSize: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  <div>
                    <strong>Sourcing Recruiter Comments:</strong>
                    <p style={{ margin: '4px 0 0', color: '#374151', fontStyle: 'italic', lineHeight: '1.4' }}>
                      "{screeningData.recruiter_notes || 'No evaluation notes recorded.'}"
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Evaluated by:</strong> {screeningData.recruiter_name}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>Talent Sourcing Specialist</div>
                    {screeningData.is_approved_by_tl === 1 && (
                      <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 'bold' }}>
                        ✓ Approved by Team Leader
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// VENDORS B2B COMPONENT
// ==========================================
function VendorsView({ user, token }) {
  const [vendors, setVendors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', poc_name: '', phone: '', whatsapp: '', email: '', countries: '', specialization: '', remarks: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ company_name: '', poc_name: '', phone: '', whatsapp: '', email: '', countries: '', specialization: '', remarks: '' });
        fetchVendors();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      alert('Error registering vendor');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">B2B Vendor Management</h2>
          <div className="page-subtitle">Track agency partners, countries, and recruitment specialties.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Icons.Plus /> Register B2B Partner
        </button>
      </div>

      {/* VENDOR DIRECTORY TABLE */}
      <div className="card">
        <div className="table-container">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Partner Company</th>
                <th>POC Detail</th>
                <th>Contact Info</th>
                <th>Countries</th>
                <th>Specialization</th>
                <th>Registered By</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: '600' }}>{v.company_name}</td>
                  <td>{v.poc_name}</td>
                  <td style={{ fontSize: '12px' }}>
                    <div>Email: {v.email}</div>
                    <div>Phone: {v.phone || '-'}</div>
                    {v.whatsapp && <div>WhatsApp: {v.whatsapp}</div>}
                  </td>
                  <td>{v.countries || '-'}</td>
                  <td>{v.specialization || 'General Sourcing'}</td>
                  <td>{v.manager_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD VENDOR MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Register Agency Partner</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><Icons.Close /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Apex Recruitment Services" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Point of Contact (POC)</label>
                    <input type="text" className="form-control" placeholder="e.g. John Doe" value={formData.poc_name} onChange={(e) => setFormData({ ...formData, poc_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" className="form-control" placeholder="poc@apex.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" className="form-control" placeholder="e.g. +91 9876543210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp Number</label>
                    <input type="text" className="form-control" placeholder="WhatsApp contact..." value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Countries of Operation</label>
                    <input type="text" className="form-control" placeholder="e.g. India, UAE, UK" value={formData.countries} onChange={(e) => setFormData({ ...formData, countries: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Sourcing Specialization</label>
                    <input type="text" className="form-control" placeholder="e.g. IT, Healthcare, BPO" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Remarks / Notes</label>
                  <input type="text" className="form-control" placeholder="Commission agreements, notes..." value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// REPORTS COMPONENT
// ==========================================
function ReportsView({ user, token }) {
  const [reportType, setReportType] = useState('recruiter'); // recruiter vs vendor vs attendance
  const [reportData, setReportData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setEmployees(data.users || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedEmployee, startDate, endDate]);

  const fetchReport = async () => {
    try {
      let endpoint = '';
      if (reportType === 'recruiter') {
        endpoint = `${API_BASE}/api/reports/recruiter-performance`;
      } else if (reportType === 'vendor') {
        endpoint = `${API_BASE}/api/reports/vendor-performance`;
      } else {
        endpoint = `${API_BASE}/api/reports/attendance?user_id=${selectedEmployee}&start_date=${startDate}&end_date=${endDate}`;
      }
      
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReportData(data.report || []);
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    if (reportData.length === 0) return;
    let headers = [];
    let rows = [];

    if (reportType === 'recruiter') {
      headers = ['Recruiter Name', 'Employee ID', 'Team', 'Sourced', 'Screening', 'Interviews', 'Offers', 'Joined', 'Tasks Completed', 'Total Tasks'];
      rows = reportData.map(r => [r.full_name, r.employee_id, r.team_name || 'None', r.sourced_count, r.screening_count, r.interview_count, r.offer_count, r.joined_count, r.tasks_completed, r.tasks_total]);
    } else if (reportType === 'vendor') {
      headers = ['B2B Company', 'POC Name', 'Email', 'Sourcing Domain', 'Candidates Submitted', 'Joined Count', 'Conversion Rate %'];
      rows = reportData.map(v => [v.company_name, v.poc_name, v.email, v.specialization, v.submitted, v.joined, `${v.conversion_rate}%`]);
    } else {
      headers = ['Employee Name', 'Employee ID', 'Role', 'Team', 'Date', 'Punch In', 'Punch Out', 'Hours Worked', 'Device Details', 'Status'];
      rows = reportData.map(r => [
        r.full_name,
        r.employee_id,
        r.user_role,
        r.team_name || 'None',
        r.attendance_date ? r.attendance_date.split('T')[0] : '-',
        r.punch_in_time ? new Date(r.punch_in_time).toLocaleTimeString() : '-',
        r.punch_out_time ? new Date(r.punch_out_time).toLocaleTimeString() : '-',
        r.working_hours || '-',
        `${r.punch_in_browser || '-'} (${r.punch_in_device || '-'})`,
        r.is_late === 1 ? 'Late' : 'On-Time'
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `talentgrade_${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Platform Performance Reports</h2>
          <div className="page-subtitle">Export CSV, generate metrics and review conversion graphs.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-secondary" onClick={handlePrint}>Print PDF</button>
        </div>
      </div>

      {/* FILTER CONTROL CARD */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn" 
            style={{ backgroundColor: reportType === 'recruiter' ? 'var(--primary-light)' : 'transparent', color: reportType === 'recruiter' ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            onClick={() => setReportType('recruiter')}
          >
            Recruiter Metrics
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: reportType === 'vendor' ? 'var(--primary-light)' : 'transparent', color: reportType === 'vendor' ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            onClick={() => setReportType('vendor')}
          >
            B2B Partner Metrics
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: reportType === 'attendance' ? 'var(--primary-light)' : 'transparent', color: reportType === 'attendance' ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            onClick={() => setReportType('attendance')}
          >
            Attendance Logs
          </button>
        </div>
      </div>

      {/* ATTENDANCE SPECIFIC DATE FILTERS */}
      {reportType === 'attendance' && (
        <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Filter Recruiter</label>
            <select className="form-control" style={{ width: '200px' }} value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); setSelectedEmployee(''); }}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* REPORT CONTENT TABLE */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {reportType === 'recruiter' ? 'Sourcing Recruiter Performance Matrix' : reportType === 'vendor' ? 'B2B Partner Performance Scorecard' : 'Collective Attendance Log History'}
          </span>
        </div>
        <div className="table-container">
          {reportType === 'recruiter' ? (
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Team</th>
                  <th>Total Sourced</th>
                  <th>Screening</th>
                  <th>Interviews</th>
                  <th>Offers</th>
                  <th>Joined</th>
                  <th>Tasks Done</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{row.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.employee_id}</div>
                    </td>
                    <td>{row.team_name || '-'}</td>
                    <td><strong>{row.sourced_count}</strong></td>
                    <td>{row.screening_count}</td>
                    <td>{row.interview_count}</td>
                    <td>{row.offer_count}</td>
                    <td><span className="badge badge-success">{row.joined_count}</span></td>
                    <td>{row.tasks_completed} / {row.tasks_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : reportType === 'vendor' ? (
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Company Partner</th>
                  <th>POC Name</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Sourced Count</th>
                  <th>Joined Count</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(row => (
                  <tr key={row.id}>
                    <td><strong style={{ color: 'var(--primary)' }}>{row.company_name}</strong></td>
                    <td>{row.poc_name}</td>
                    <td>{row.email}</td>
                    <td>{row.specialization}</td>
                    <td>{row.submitted}</td>
                    <td>{row.joined}</td>
                    <td>
                      <strong style={{ color: 'var(--success)' }}>{row.conversion_rate}%</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Team</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>IP / Browser Info</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{row.full_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.user_role} • {row.employee_id}</div>
                    </td>
                    <td>{row.team_name || '-'}</td>
                    <td>{row.attendance_date ? row.attendance_date.split('T')[0] : '-'}</td>
                    <td>{row.punch_in_time ? new Date(row.punch_in_time).toLocaleTimeString() : '-'}</td>
                    <td>{row.punch_out_time ? new Date(row.punch_out_time).toLocaleTimeString() : 'Active'}</td>
                    <td>{row.working_hours ? `${row.working_hours} hrs` : '-'}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      IP: {row.punch_in_ip || '-'}<br/>
                      {row.punch_in_browser || '-'}
                    </td>
                    <td>
                      {row.is_late === 1 ? (
                        <span className="badge badge-danger">Late</span>
                      ) : (
                        <span className="badge badge-success">On-Time</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ==========================================
// TEAMS MANAGEMENT COMPONENT (ADMIN ONLY)
// ==========================================
function TeamsView({ user, token }) {
  const [teams, setTeams] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  
  // Member assignment state
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberUserId, setMemberUserId] = useState('');
  const [leaderUserId, setLeaderUserId] = useState('');

  // Add Employee Form state
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState('Recruiter');
  const [empTeamId, setEmpTeamId] = useState('');
  const [savingEmp, setSavingEmp] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchRecruiters();
    fetchEmployees();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecruiters = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/teams/recruiters/unassigned`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRecruiters(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEmployees(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTeamName })
      });
      if (res.ok) {
        setNewTeamName('');
        setShowCreateModal(false);
        fetchTeams();
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (err) {
      alert('Error creating team');
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setSavingEmp(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: empId,
          full_name: empName,
          email: empEmail,
          password: empPassword,
          role: empRole,
          team_id: empTeamId ? parseInt(empTeamId) : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Employee registered successfully!');
        setEmpId('');
        setEmpName('');
        setEmpEmail('');
        setEmpPassword('');
        setEmpRole('Recruiter');
        setEmpTeamId('');
        setShowEmployeeModal(false);
        fetchEmployees();
        fetchRecruiters();
        fetchTeams(); // refresh member counts
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      alert('Error registering employee');
    } finally {
      setSavingEmp(false);
    }
  };

  const handleAssignLeader = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !leaderUserId) return;
    try {
      const res = await fetch(`${API_BASE}/api/teams/${selectedTeamId}/assign-leader`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leaderId: leaderUserId })
      });
      if (res.ok) {
        setLeaderUserId('');
        setSelectedTeamId('');
        fetchTeams();
        fetchRecruiters();
        fetchEmployees();
      }
    } catch (err) {
      alert('Error assigning team leader');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !memberUserId) return;
    try {
      const res = await fetch(`${API_BASE}/api/teams/${selectedTeamId}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: memberUserId })
      });
      if (res.ok) {
        setMemberUserId('');
        setSelectedTeamId('');
        fetchTeams();
        fetchRecruiters();
        fetchEmployees();
      }
    } catch (err) {
      alert('Error adding member to team');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">TalentGrade Team & Employee Center</h2>
          <div className="page-subtitle">Configure department structures, assign leaders, and assign recruiters.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowEmployeeModal(true)}>
            <Icons.Plus /> Add Employee User
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Icons.Plus /> Create Sourcing Team
          </button>
        </div>
      </div>

      <div className="grid-2-1">
        {/* TEAMS SUMMARY */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Active Platform Teams ({teams.length})</span>
          </div>
          <div className="table-container">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Assigned Team Leader</th>
                  <th>Member Count</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '600' }}>{t.name}</td>
                    <td>{t.leader_name || <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Unassigned</span>}</td>
                    <td><strong>{t.member_count} members</strong></td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* WORKGROUP CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ASSIGN LEADER FORM */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Assign Team Leader</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleAssignLeader} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Team</label>
                  <select className="form-control" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} required>
                    <option value="">Select Team...</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Leader (Team Leader role)</label>
                  <select className="form-control" value={leaderUserId} onChange={(e) => setLeaderUserId(e.target.value)} required>
                    <option value="">Select Employee...</option>
                    {recruiters.filter(u => u.role === 'Team Leader').map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Save Assignment</button>
              </form>
            </div>
          </div>

          {/* ADD MEMBER FORM */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Add Recruiter Member</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Target Team</label>
                  <select className="form-control" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} required>
                    <option value="">Select Team...</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Recruiter Member</label>
                  <select className="form-control" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)} required>
                    <option value="">Select Recruiter...</option>
                    {recruiters.filter(u => u.role === 'Recruiter').map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Save Assignment</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* EMPLOYEE ROSTER SECTION */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <span className="card-title">Employee Roster ({employees.length})</span>
        </div>
        <div className="table-container">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>System Role</th>
                <th>Assigned Team</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: '600' }}>{emp.employee_id}</td>
                  <td style={{ fontWeight: '600' }}>{emp.full_name}</td>
                  <td>{emp.email}</td>
                  <td>
                    <span className={`badge ${emp.role === 'Super Admin' ? 'badge-danger' : emp.role === 'Team Leader' ? 'badge-warning' : 'badge-info'}`}>
                      {emp.role}
                    </span>
                  </td>
                  <td>{emp.team_name || <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Create Sourcing Team</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><Icons.Close /></button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Team Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Team C" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      {showEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="card-title">Register New Employee User</h3>
              <button className="modal-close" onClick={() => setShowEmployeeModal(false)}><Icons.Close /></button>
            </div>
            <form onSubmit={handleCreateEmployee}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" className="form-control" placeholder="e.g., TG1005" value={empId} onChange={(e) => setEmpId(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" placeholder="e.g., Jane Smith" value={empName} onChange={(e) => setEmpName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" placeholder="e.g., jane@tgats.com" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Initial Login Password</label>
                  <input type="text" className="form-control" placeholder="Initial temporary password" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>System Role</label>
                  <select className="form-control" value={empRole} onChange={(e) => setEmpRole(e.target.value)} required>
                    <option value="Recruiter">Recruiter (Default Sourcing Agent)</option>
                    <option value="Team Leader">Team Leader (Sourcing Manager)</option>
                    <option value="Super Admin">Super Admin (Platform Administrator)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign to Team (Optional)</label>
                  <select className="form-control" value={empTeamId} onChange={(e) => setEmpTeamId(e.target.value)}>
                    <option value="">No Team / Unassigned</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEmp}>{savingEmp ? 'Saving...' : 'Register Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// SYSTEM LOGS VIEW (ADMIN/TL ONLY)
// ==========================================
function LogsView({ user, token }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/activity-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Activity Audit Trails</h2>
          <div className="page-subtitle">Track security and platform changes in chronological log.</div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="tg-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Employee / User</th>
                <th>Action Type</th>
                <th>Detail Logs</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{log.full_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.role} ({log.employee_id})</div>
                  </td>
                  <td><strong>{log.action}</strong></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.details}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.ip_address || 'Internal'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ==========================================
// USER PROFILE & PHOTO CROPPER COMPONENT
// ==========================================
function ProfileView({ user, token, fetchProfile }) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageFileSrc, setImageFileSrc] = useState('');
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageFileSrc(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSubmit = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext('2d');

    // Make canvas a cropped square avatar 200x200
    canvas.width = 200;
    canvas.height = 200;

    // Direct center crop on selected image
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - size) / 2;
    const sy = (img.naturalHeight - size) / 2;

    ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

    // Convert to Blob and send
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('avatar', blob, 'cropped_avatar.jpg');

      try {
        const res = await fetch(`${API_BASE}/api/profile/upload-avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          setShowCropModal(false);
          setImageFileSrc('');
          // Update profile globally
          fetchProfile();
        } else {
          alert(data.error);
        }
      } catch (err) {
        alert('Failed to upload crop avatar');
      }
    }, 'image/jpeg');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">My Profile Settings</h2>
          <div className="page-subtitle">Configure avatar photos and personal identity.</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={user.avatar_url ? `${API_BASE}${user.avatar_url}` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} 
              alt="avatar" 
            />
            <button 
              className="btn btn-secondary" 
              style={{ position: 'absolute', bottom: '0', right: '0', borderRadius: '50%', padding: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Change Photo"
            >
              <Icons.Plus />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Full Name</span>
              <strong>{user.full_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email Address</span>
              <strong>{user.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Employee ID</span>
              <strong>{user.employee_id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Workgroup Role</span>
              <strong>{user.role}</strong>
            </div>
            {user.team_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Team</span>
                <strong>{user.team_name}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CROP MODAL INTERFACE */}
      {showCropModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="card-title">Crop Profile Picture</h3>
              <button className="modal-close" onClick={() => { setShowCropModal(false); setImageFileSrc(''); }}><Icons.Close /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div className="cropper-container">
                <img 
                  ref={imageRef} 
                  src={imageFileSrc} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  alt="to crop" 
                  onLoad={() => {
                    // Draw preview image immediately
                    const canvas = canvasRef.current;
                    const img = imageRef.current;
                    if (canvas && img) {
                      const ctx = canvas.getContext('2d');
                      canvas.width = 200;
                      canvas.height = 200;
                      const size = Math.min(img.naturalWidth, img.naturalHeight);
                      const sx = (img.naturalWidth - size) / 2;
                      const sy = (img.naturalHeight - size) / 2;
                      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
                    }
                  }}
                />
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                <canvas ref={canvasRef} className="crop-canvas" style={{ borderRadius: '50%', border: '2px solid var(--border-color)', width: '100px', height: '100px' }}></canvas>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>Preview avatar view</span>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCropModal(false); setImageFileSrc(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCropSubmit}>Crop and Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
