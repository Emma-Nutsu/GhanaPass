'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { Users, CheckCircle, Clock, Flag, Key, FileText, ExternalLink, AlertTriangle, BarChart3, List, Map as MapIcon, ShieldAlert, Plug, Home, Terminal, LogOut, Search, Check, X, Info, Eye, ShieldCheck, Activity, Globe } from 'lucide-react';

const GhanaActivityMap = nextDynamic(() => import('../../components/GhanaActivityMap'), { ssr: false });

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('gp_token') : null;

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    fetchAll();
  }, [token, router]);

  const fetchAll = () => {
    fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setStats(data)).catch(() => { });
    fetchUsers();
    fetch('/api/admin/fraud', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setFraudAlerts(data.alerts || [])).catch(() => { });
  };

  const fetchUsers = (s, st) => {
    let url = '/api/admin/users?limit=50';
    if (s || search) url += `&search=${encodeURIComponent(s || search)}`;
    if (st || statusFilter) url += `&status=${st || statusFilter}`;
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setUsers(data.users || [])).catch(() => { });
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setToast({ type: 'success', message: `User status updated to ${status}` });
      fetchUsers();
    } catch {
      setToast({ type: 'error', message: 'Failed to update status' });
    }
  };

  const updateFraudAlert = async (alertId, status) => {
    try {
      await fetch(`/api/admin/fraud/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      setToast({ type: 'success', message: 'Alert updated' });
      fetchAll();
    } catch { setToast({ type: 'error', message: 'Failed to update alert' }); }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('gp_token');
    if (token) {
      fetch('/api/auth/logout', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` } 
      }).catch(() => {});
    }
    localStorage.removeItem('gp_token');
    localStorage.removeItem('gp_user');
    router.push('/auth/login');
  };

  const severityColors = { low: '#60A5FA', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };
  const statusBadge = { verified: 'badge-verified', pending: 'badge-pending', flagged: 'badge-flagged', rejected: 'badge-rejected' };

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-brand"><div className="logo-icon"><img src="/logos/COA.png" alt="COA" /></div><span>Ghana<span className="brand-accent">Pass</span></span><span style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700, marginLeft: '8px', padding: '2px 8px', background: 'rgba(206,17,38,0.1)', borderRadius: '4px' }}>ADMIN</span></Link>
        <ul className="navbar-links">
          <li><a onClick={() => setTab('overview')} style={{ cursor: 'pointer', color: tab === 'overview' ? 'var(--gold)' : undefined }}>Overview</a></li>
          <li><a onClick={() => setTab('users')} style={{ cursor: 'pointer', color: tab === 'users' ? 'var(--gold)' : undefined }}>Users</a></li>
          <li><a onClick={() => setTab('activity')} style={{ cursor: 'pointer', color: tab === 'activity' ? 'var(--gold)' : undefined }}>Activity</a></li>
          <li><a onClick={() => setTab('map')} style={{ cursor: 'pointer', color: tab === 'map' ? 'var(--gold)' : undefined }}>Map</a></li>
          <li><a onClick={() => setTab('fraud')} style={{ cursor: 'pointer', color: tab === 'fraud' ? 'var(--gold)' : undefined }}>Fraud</a></li>
        </ul>
        <div className="navbar-auth">
          <Link href="/dashboard" className="btn btn-secondary btn-sm">User Dashboard</Link>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Admin Panel</div>
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 size={24} color="white" /> },
              { id: 'users', label: 'Users', icon: <Users size={24} color="white" /> },
              { id: 'activity', label: 'Activity', icon: <List size={24} color="white" /> },
              { id: 'map', label: 'Map', icon: <MapIcon size={24} color="white" /> },
              { id: 'fraud', label: 'Fraud', icon: <ShieldAlert size={24} color="white" /> },
              { id: 'integrations', label: 'Integrations', icon: <Plug size={24} color="white" /> },
            ].map(t => (
              <a key={t.id} onClick={() => setTab(t.id)} className={`sidebar-link ${tab === t.id ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                <span className="link-icon">{t.icon}</span> {t.label}
              </a>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-title">Navigate</div>
            <Link href="/dashboard" className="sidebar-link"><span className="link-icon"><Home size={24} color="white" /></span> User Dashboard</Link>
            <Link href="/developer" className="sidebar-link"><span className="link-icon"><Terminal size={24} color="white" /></span> Developer Portal</Link>
            <a onClick={handleLogout} className="sidebar-link" style={{ cursor: 'pointer', color: 'var(--red-light)' }}>
              <span className="link-icon"><LogOut size={24} color="var(--red-light)" /></span> Sign Out
            </a>
          </div>
        </aside>

        <main className="main-content">
          {tab === 'overview' && stats && <OverviewTab stats={stats} fraudAlerts={fraudAlerts} severityColors={severityColors} />}
          {tab === 'users' && <UsersTab users={users} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} fetchUsers={fetchUsers} updateUserStatus={updateUserStatus} statusBadge={statusBadge} />}
          {tab === 'activity' && <ActivityFeedTab token={token} />}
          {tab === 'map' && <ActivityMapTab token={token} />}
          {tab === 'fraud' && <FraudTab token={token} fraudAlerts={fraudAlerts} updateFraudAlert={updateFraudAlert} severityColors={severityColors} users={users} />}
          {tab === 'integrations' && <IntegrationsTab token={token} />}
        </main>
      </div>

      {toast && <div className={`toast ${toast.type}`} onClick={() => setToast(null)}>{toast.message}</div>}
    </>
  );
}

// ─── Overview Tab ───
function OverviewTab({ stats, fraudAlerts, severityColors }) {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Ghana Pass National Identity Platform — Command Center</p>
      </div>
      <div className="stats-grid">
        {[
          { icon: <Users size={40} color="white" strokeWidth={3} />, val: stats.overview.total_users, label: 'Total Citizens' },
          { icon: <CheckCircle size={40} color="white" strokeWidth={3} />, val: stats.overview.verified_users, label: 'Verified ID' },
          { icon: <Plug size={40} color="white" strokeWidth={3} />, val: stats.overview.oauth_clients, label: 'OAuth Clients' },
          { icon: <ShieldAlert size={40} color="white" strokeWidth={3} />, val: stats.overview.open_fraud_alerts, label: 'Open Alerts' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
            </div>
            <div className="stat-value">{s.val}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 1rem' }}>Verification Distribution</h3>
      <div style={{ display: 'flex', gap: '4px', height: '40px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
        {stats.charts.verification_distribution.map((v, i) => {
          const colors = { verified: '#00A86B', pending: '#D4A843', flagged: '#F59E0B', rejected: '#EF4444' };
          const total = stats.charts.verification_distribution.reduce((s, x) => s + x.count, 0);
          const pct = ((v.count / total) * 100).toFixed(0);
          return <div key={i} style={{ background: colors[v.verification_status] || '#6B7280', flex: v.count, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>{pct}%</div>;
        })}
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {stats.charts.verification_distribution.map((v, i) => {
          const colors = { verified: '#00A86B', pending: '#D4A843', flagged: '#F59E0B', rejected: '#EF4444' };
          return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[v.verification_status] || '#6B7280' }}></div>{v.verification_status} ({v.count})</div>;
        })}
      </div>
    </div>
  );
}

// ─── Users Tab ───
function UsersTab({ users, search, setSearch, statusFilter, setStatusFilter, fetchUsers, updateUserStatus, statusBadge }) {
  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">User Management</h1><p className="page-subtitle">View and manage all registered users</p></div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} color="white" />
          <input placeholder="Search by name, card number, or phone..." value={search} onChange={e => { setSearch(e.target.value); fetchUsers(e.target.value, statusFilter); }} />
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); fetchUsers(search, e.target.value); }}>
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="card-glass" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Ghana Card</th><th>Phone</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{u.ghana_card_number}</td>
                <td>{u.phone}</td>
                <td><span className={`badge ${statusBadge[u.verification_status]}`}>{u.verification_status}</span></td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {u.verification_status !== 'verified' && <button className="btn btn-green btn-sm" onClick={() => updateUserStatus(u.id, 'verified')}>✓</button>}
                    {u.verification_status !== 'flagged' && <button className="btn btn-sm" style={{ background: '#F59E0B', color: '#000' }} onClick={() => updateUserStatus(u.id, 'flagged')}>⚑</button>}
                    {u.verification_status !== 'rejected' && <button className="btn btn-danger btn-sm" onClick={() => updateUserStatus(u.id, 'rejected')}>✕</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Activity Feed Tab ───
function ActivityFeedTab({ token }) {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let url = '/api/admin/activity-feed?limit=50';
    if (filter) url += `&type=${filter}`;
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setActivities(data.activities || [])).catch(() => { });
  }, [token, filter]);

  const actionIcons = {
    login: <Key size={16} color="white" />,
    register: <FileText size={16} color="white" />,
    login_failed: <X size={16} color="white" />,
    logout: <LogOut size={16} color="white" />
  };
  const actionColors = { login: '#00A86B', register: '#D4A843', login_failed: '#EF4444', logout: '#6B7280' };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Activity Feed</h1><p className="page-subtitle">Real-time monitoring of all platform activity across Ghana</p></div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'login', 'register', 'login_failed', 'logout'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {f ? actionIcons[f] : <List size={16} />} {f ? f.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Activity size={24} color="white" /></div>
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{activities.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Key size={24} color="#00A86B" /></div>
          <div className="stat-label">Logins</div>
          <div className="stat-value">{activities.filter(a => a.action === 'login').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FileText size={24} color="#D4A843" /></div>
          <div className="stat-label">Registrations</div>
          <div className="stat-value">{activities.filter(a => a.action === 'register').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><X size={24} color="#EF4444" /></div>
          <div className="stat-label">Failed</div>
          <div className="stat-value">{activities.filter(a => a.success === 0).length}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {activities.map((a, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderLeft: `3px solid ${actionColors[a.action] || '#6B7280'}` }}>
            <div style={{ fontSize: '1.3rem', width: '36px', textAlign: 'center' }}>{actionIcons[a.action] || '📌'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.full_name || 'Unknown'}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.ghana_card_number}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {a.action?.replace(/_/g, ' ')} • {a.location || 'Unknown'} • IP: {a.ip_address || '::1'}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleTimeString()}</div>
              <span className={`badge ${a.success ? 'badge-verified' : 'badge-rejected'}`} style={{ fontSize: '0.65rem' }}>{a.success ? 'SUCCESS' : 'FAILED'}</span>
            </div>
          </div>
        ))}
        {activities.length === 0 && <div className="empty-state"><div className="icon">📋</div><h3>No activity yet</h3></div>}
      </div>
    </div>
  );
}

// ─── Activity Map Tab (Leaflet/OpenStreetMap) ───
function ActivityMapTab({ token }) {
  const [mapData, setMapData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    fetch('/api/admin/map-data', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setMapData(data)).catch(() => { });
  }, [token]);

  const riskColors = { low: '#00A86B', medium: '#F59E0B', high: '#EF4444' };

  if (!mapData) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" style={{ width: '40px', height: '40px' }}></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🗺️ National Activity Map</h1>
        <p className="page-subtitle">Live monitoring of identity platform usage across Ghana&apos;s regions — powered by OpenStreetMap</p>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '2', minWidth: '450px' }}>
          <GhanaActivityMap regions={mapData.regions} livePoints={mapData.live_points} onRegionClick={setSelectedRegion} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {[['#00A86B', 'Login'], ['#D4A843', 'Registration'], ['#EF4444', 'Failed Login'], ['#3B82F6', 'Verification'], ['#818CF8', 'Doc Sign']].map(([c, l], i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, display: 'inline-block' }}></span> {l}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: '1', minWidth: '280px' }}>
          {selectedRegion ? (
            <div className="card" style={{ padding: '1.5rem', animation: 'fadeInUp 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: riskColors[selectedRegion.risk_level] }}></div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedRegion.name}</h3>
                <span className={`badge ${selectedRegion.risk_level === 'high' ? 'badge-rejected' : selectedRegion.risk_level === 'medium' ? 'badge-pending' : 'badge-verified'}`}>{selectedRegion.risk_level?.toUpperCase()} RISK</span>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {[{ l: 'Total Activity', v: selectedRegion.total_activity, i: '📊' },
                { l: 'Logins', v: selectedRegion.stats.logins, i: '🔑', c: '#00A86B' },
                { l: 'Registrations', v: selectedRegion.stats.registrations, i: '📝', c: '#D4A843' },
                { l: 'Verifications', v: selectedRegion.stats.verifications, i: '✅', c: '#3B82F6' },
                { l: 'Suspicious', v: selectedRegion.stats.suspicious, i: '🚨', c: selectedRegion.stats.suspicious > 5 ? '#EF4444' : '#F59E0B' },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.i} {item.l}</span>
                    <span style={{ fontWeight: 700, color: item.c || 'inherit' }}>{item.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {selectedRegion.lat.toFixed(4)}°N, {Math.abs(selectedRegion.lng).toFixed(4)}°W</div>
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🗺️</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select a Region</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Click a region marker on the map to view detailed statistics</p>
            </div>
          )}
          <div className="card" style={{ padding: '1rem', marginTop: '1rem', borderColor: 'rgba(212,168,67,0.2)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>🏛️ Authorized Agencies</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>• National Security Council<br />• Ghana Police Service<br />• National Intelligence Bureau<br />• Ministry of Interior<br />• Bank of Ghana</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fraud Monitoring Tab (with Detailed Reports) ───
function FraudTab({ token, fraudAlerts, updateFraudAlert, severityColors, users }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const viewReport = async (userId) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/admin/fraud-report/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setReport(data);
      setSelectedUser(userId);
    } catch { }
    setLoadingReport(false);
  };

  const riskColors = { low: '#00A86B', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🚨 Fraud Monitoring</h1>
        <p className="page-subtitle">Advanced threat detection and investigation dashboard</p>
      </div>

      {/* ════ DETAILED FRAUD INVESTIGATION REPORT ════ */}
      {report && (
        <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.3s ease' }}>
          {/* Report Header with Risk Gauge */}
          <div className="card" style={{ padding: '1.5rem', borderColor: `${riskColors[report.risk_level]}40`, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Fraud Investigation Report</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>{report.user.full_name}</h2>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--gold)' }}>{report.user.ghana_card_number}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '80px', height: '80px', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={riskColors[report.risk_level]} strokeWidth="3" strokeDasharray={`${report.risk_score}, 100`} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: riskColors[report.risk_level] }}>{report.risk_score}</span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk</span>
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setReport(null); setSelectedUser(null); }}>✕ Close</button>
              </div>
            </div>
          </div>

          {/* Subject Identity Details */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: `4px solid ${riskColors[report.risk_level]}` }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>🆔 Subject Identity Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Full Name', value: report.user.full_name, icon: '👤' },
                { label: 'Ghana Card Number', value: report.user.ghana_card_number, icon: '🪪', mono: true },
                { label: 'Phone Number', value: report.user.phone || 'N/A', icon: '📱' },
                { label: 'Email Address', value: report.user.email || 'N/A', icon: '📧' },
                { label: 'Date of Birth', value: report.user.date_of_birth || 'N/A', icon: '📅' },
                { label: 'Account Role', value: report.user.role?.toUpperCase(), icon: '🛡️' },
                { label: 'Verification Status', value: report.user.verification_status, icon: '✅' },
                { label: 'Account Created', value: report.user.created_at ? new Date(report.user.created_at).toLocaleString() : 'N/A', icon: '📆' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{item.icon} {item.label}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: item.mono ? 'monospace' : 'inherit' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Login Statistics */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '1rem' }}>
            <div className="stat-card">
              <div className="stat-icon"><Key size={24} color="white" /></div>
              <div className="stat-label">Total Logins</div>
              <div className="stat-value">{report.summary.total_logins}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><X size={24} color="#EF4444" /></div>
              <div className="stat-label">Failed Logins</div>
              <div className="stat-value">{report.summary.failed_logins}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={24} color="#00A86B" /></div>
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">{report.summary.success_rate}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><AlertTriangle size={24} color="#F59E0B" /></div>
              <div className="stat-label">Active Alerts</div>
              <div className="stat-value">{report.summary.active_alerts}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Globe size={24} color="white" /></div>
              <div className="stat-label">Unique Locations</div>
              <div className="stat-value">{report.summary.unique_locations}</div>
            </div>
          </div>

          {/* Location & Activity Timeline Table */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📍 Location & Activity Timeline</h3>
            {report.location_history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity recorded yet.</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr><th>Timestamp</th><th>Action</th><th>Location</th><th>IP Address</th><th>Device</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {report.location_history.map((loc, i) => (
                      <tr key={i} style={{ background: !loc.success ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(loc.timestamp).toLocaleString()}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                            background: loc.action === 'login' ? 'rgba(0,168,107,0.1)' : loc.action === 'login_failed' ? 'rgba(239,68,68,0.1)' : 'rgba(212,168,67,0.1)',
                            color: loc.action === 'login' ? '#00A86B' : loc.action === 'login_failed' ? '#EF4444' : '#D4A843'
                          }}>
                            {loc.action?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>📍 {loc.location || 'Unknown'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{loc.ip_address || '::1'}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>💻 {loc.device ? loc.device.substring(0, 50) : 'Unknown'}</td>
                        <td><span className={`badge ${loc.success ? 'badge-verified' : 'badge-rejected'}`} style={{ fontSize: '0.65rem' }}>{loc.success ? '✓ SUCCESS' : '✕ FAILED'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User's Fraud Alerts */}
          {report.fraud_alerts && report.fraud_alerts.length > 0 && (
            <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #EF4444' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>⚠️ Active Fraud Alerts for {report.user.full_name}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.fraud_alerts.map((alert, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{alert.alert_type?.replace(/_/g, ' ')}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, background: `${severityColors[alert.severity]}22`, color: severityColors[alert.severity] }}>{alert.severity?.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{alert.description}</p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created: {new Date(alert.created_at).toLocaleString()} • Status: {alert.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fraud Alerts List */}
      {fraudAlerts.length === 0 ? (
        <div className="empty-state"><div className="icon">🛡️</div><h3>No fraud alerts</h3><p>The system is operating normally.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {fraudAlerts.map((alert, i) => (
            <div key={i} className="card" style={{ borderLeft: `4px solid ${severityColors[alert.severity]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{alert.alert_type?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{alert.full_name} ({alert.ghana_card_number}) • {new Date(alert.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, background: `${severityColors[alert.severity]}22`, color: severityColors[alert.severity], border: `1px solid ${severityColors[alert.severity]}44` }}>{alert.severity?.toUpperCase()}</span>
                  <span className={`badge ${alert.status === 'resolved' ? 'badge-verified' : alert.status === 'dismissed' ? 'badge-pending' : 'badge-flagged'}`}>{alert.status}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>{alert.description}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {alert.user_id && (
                  <button className="btn btn-sm btn-primary" onClick={() => viewReport(alert.user_id)} disabled={loadingReport}>
                    {loadingReport && selectedUser === alert.user_id ? '⏳ Loading...' : '📊 View Full Report'}
                  </button>
                )}
                {(alert.status === 'open' || alert.status === 'investigating') && (
                  <>
                    <button className="btn btn-sm btn-secondary" onClick={() => updateFraudAlert(alert.id, 'investigating')}>🔍 Investigate</button>
                    <button className="btn btn-sm btn-green" onClick={() => updateFraudAlert(alert.id, 'resolved')}>✓ Resolve</button>
                    <button className="btn btn-sm" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)', background: 'transparent' }} onClick={() => updateFraudAlert(alert.id, 'dismissed')}>Dismiss</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Investigation Grid */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>🔍 Quick Investigation</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Select any user to generate a comprehensive fraud investigation report with full identity, location history, IP tracking, and device analysis
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {users.slice(0, 8).map((u, i) => (
            <button key={i} className="card" onClick={() => viewReport(u.id)}
              style={{ cursor: 'pointer', padding: '12px', textAlign: 'left', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.full_name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.ghana_card_number}</div>
              <div style={{ marginTop: '4px' }}>
                <span className={`badge badge-${u.verification_status === 'verified' ? 'verified' : u.verification_status === 'flagged' ? 'flagged' : 'pending'}`} style={{ fontSize: '0.6rem' }}>{u.verification_status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Integrations Tab ───
function IntegrationsTab({ token }) {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch('/api/admin/integrations', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(data => setClients(data.clients || [])).catch(() => { });
  }, [token]);

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="page-title">Integrations</h1><p className="page-subtitle">Manage OAuth clients and third-party integrations</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {clients.map((client, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--gradient-green)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🏛️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{client.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.description}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>Client ID: {client.client_id}</div>
            </div>
            <span className={`badge ${client.is_active ? 'badge-active' : 'badge-rejected'}`}>{client.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
