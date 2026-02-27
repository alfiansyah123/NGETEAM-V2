import { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
    const [activeSection, setActiveSection] = useState('appearance');
    const [cfToken, setCfToken] = useState('');
    const [cfAccountId, setCfAccountId] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [nameservers, setNameservers] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('...');

    // Appearance Settings
    const [brandName, setBrandName] = useState('GEN LINK');
    const [brandBadge, setBrandBadge] = useState('PLAT_AG');

    // Smartlink / Team State
    const [smartlinks, setSmartlinks] = useState([]);
    const [smartName, setSmartName] = useState('');
    const [smartSlug, setSmartSlug] = useState('');
    const [smartUrl, setSmartUrl] = useState('');
    const [smartPassword, setSmartPassword] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [oldSlug, setOldSlug] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
        window.location.href = '/';
    };

    // Load saved credentials & initial data
    useEffect(() => {
        fetchSettings();
        fetchDomains();
        fetchCurrentPassword();
        fetchSmartlinks();
    }, []);

    const fetchSettings = async () => {
        try {
            const tokenRes = await fetch('/api/get-settings?key=cf_token');
            const tokenData = await tokenRes.json();
            if (tokenData.success && tokenData.data) setCfToken(tokenData.data.value);

            const accRes = await fetch('/api/get-settings?key=cf_account_id');
            const accData = await accRes.json();
            if (accData.success && accData.data) setCfAccountId(accData.data.value);

            const nameRes = await fetch('/api/get-settings?key=brand_name');
            const nameData = await nameRes.json();
            if (nameData.success && nameData.data) setBrandName(nameData.data.value);

            const badgeRes = await fetch('/api/get-settings?key=brand_badge');
            const badgeData = await badgeRes.json();
            if (badgeData.success && badgeData.data) setBrandBadge(badgeData.data.value);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    const fetchCurrentPassword = async () => {
        try {
            const res = await fetch('/api/get-admin-password');
            const data = await res.json();
            if (data.success) {
                setCurrentPassword(data.password);
            }
        } catch (err) {
            console.error('Failed to fetch password:', err);
        }
    };

    const fetchDomains = async () => {
        try {
            const response = await fetch('/api/get-domains');
            if (response.ok) {
                const data = await response.json();
                setDomains(data.domains || []);
            }
        } catch (err) {
            console.error('Failed to fetch domains:', err);
        }
    };

    const fetchSmartlinks = async () => {
        try {
            const res = await fetch('/api/get-team');
            const data = await res.json();
            if (data.success) {
                setSmartlinks(data.team || []);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to fetch team data' });
            }
        } catch (err) {
            console.error('Failed to fetch smartlinks:', err);
            setMessage({ type: 'error', text: 'Network error fetching team data' });
        }
    };

    const handleAddSmartlink = async (e) => {
        e.preventDefault();
        if (!smartName || !smartSlug || !smartUrl || !smartPassword) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                // UPDATE MODE
                const res = await fetch('/api/update-team-member', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingId,
                        name: smartName,
                        user_id: smartSlug,
                        password: smartPassword,
                        target_url: smartUrl,
                        old_user_id: oldSlug
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to update smartlink');
                }

                setMessage({ type: 'success', text: 'Smartlink updated!' });
                cancelEdit();
                fetchSmartlinks();
            } else {
                // ADD MODE
                // Step 1: Add to Team table (ID/Slug tracking)
                const teamRes = await fetch('/api/add-team-member', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: smartName, user_id: smartSlug, password: smartPassword })
                });

                if (!teamRes.ok) {
                    const err = await teamRes.json();
                    throw new Error(err.error || 'Failed to add smartlink');
                }

                // Step 2: Create the Link entry
                const linkRes = await fetch('/api/save-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        slug: smartSlug,
                        original_url: smartUrl,
                        domain_url: domains[0] || window.location.hostname,
                        user_id: smartSlug,
                        title: `Smartlink ${smartName}`,
                        description: 'Persistent Team Link'
                    })
                });

                if (linkRes.ok) {
                    setMessage({ type: 'success', text: 'Smartlink created!' });
                    setSmartName('');
                    setSmartSlug('');
                    setSmartUrl('');
                    setSmartPassword('');
                    fetchSmartlinks();
                }
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (link) => {
        setEditingId(link.id);
        setSmartName(link.name);
        setSmartSlug(link.user_id);
        setOldSlug(link.user_id);
        setSmartPassword(link.password);
        setSmartUrl(link.links?.original_url || '');
        // Scroll to form
        const form = document.querySelector('form');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setOldSlug('');
        setSmartName('');
        setSmartSlug('');
        setSmartUrl('');
        setSmartPassword('');
    };

    const handleDeleteSmartlink = async (id) => {
        if (!confirm('Delete this smartlink?')) return;
        try {
            await fetch('/api/delete-team-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchSmartlinks();
        } catch (err) {
            console.error(err);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 chars' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Password updated!' });
                setNewPassword('');
                fetchCurrentPassword();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const saveAppearance = async () => {
        setLoading(true);
        try {
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'brand_name', value: brandName })
            });
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'brand_badge', value: brandBadge })
            });
            setMessage({ type: 'success', text: 'Appearance saved!' });
        } finally {
            setLoading(false);
        }
    };

    const saveCredentials = async () => {
        setLoading(true);
        try {
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'cf_token', value: cfToken })
            });
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'cf_account_id', value: cfAccountId })
            });
            setMessage({ type: 'success', text: 'Credentials saved!' });
        } finally {
            setLoading(false);
        }
    };

    const addDomainWithCloudflare = async () => {
        if (!newDomain.trim()) return;
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            // 1. Add Zone to Cloudflare
            const addZoneRes = await fetch('/api/cloudflare/add-zone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain.trim(), cfToken, cfAccountId })
            });
            const zoneData = await addZoneRes.json();
            if (!addZoneRes.ok) throw new Error(zoneData.error || 'Failed to add Zone');

            const zoneId = zoneData.zone_id;

            // 2. Setup DNS (CNAMEs)
            const dnsRes = await fetch('/api/cloudflare/setup-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain.trim(), zoneId, cfToken })
            });
            if (!dnsRes.ok) console.warn('DNS Setup possibly incomplete');

            // 3. Add to Pages Project Domains
            const pagesRes = await fetch('/api/cloudflare/add-pages-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain.trim(), cfToken, cfAccountId })
            });
            if (!pagesRes.ok) console.warn('Pages Domain link possibly incomplete');

            // 4. Setup Worker Proxy (Wildcard)
            await fetch('/api/cloudflare/setup-worker-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain.trim(), cfToken, cfAccountId })
            });

            // 5. Add to Database
            await fetch('/api/add-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newDomain.trim() })
            });

            setNameservers(zoneData.nameservers);
            setMessage({ type: 'success', text: 'Domain added & setup!' });
            setNewDomain('');
            fetchDomains();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDomain = async (domain) => {
        if (!confirm(`Delete ${domain}?`)) return;
        setLoading(true);
        try {
            await fetch('/api/delete-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            });
            setDomains(prev => prev.filter(d => d !== domain));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container fade-in">
            {/* Top Bar */}
            <div className="mnx-top-bar" style={{ marginBottom: '30px' }}>
                <div className="mnx-logo-group">
                    <div className="mnx-logo-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                    </div>
                    <div className="mnx-logo-text">
                        {brandName.includes(' ') ? (
                            <h1>{brandName.split(' ')[0]} <span>{brandName.split(' ').slice(1).join(' ')}</span></h1>
                        ) : (
                            <h1>{brandName}</h1>
                        )}
                        <span className="mnx-logo-badge">{brandBadge}</span>
                    </div>
                </div>
                <div className="mnx-status-controls">
                    <div className="mnx-pill-select" style={{ border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        ADMIN PANEL
                    </div>
                    {/* HOME REPLACED WITH TEAM BUTTON */}
                    <button
                        className={`mnx-power-btn ${activeSection === 'team' ? 'active' : ''}`}
                        title="Team Management"
                        onClick={() => setActiveSection('team')}
                        style={{ background: activeSection === 'team' ? 'var(--bg-tabs)' : 'none' }}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke={activeSection === 'team' ? 'var(--accent-cyan)' : 'currentColor'} strokeWidth="2.5" fill="none">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </button>
                    {/* Logout button */}
                    <button onClick={handleLogout} className="mnx-power-btn" title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--accent-red)" strokeWidth="2.5" fill="none">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="admin-layout">
                {/* Sidebar */}
                <div className="admin-sidebar">
                    <div className={`sidebar-nav-item ${activeSection === 'appearance' ? 'active' : ''}`} onClick={() => setActiveSection('appearance')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                        Appearance
                    </div>
                    <div className={`sidebar-nav-item ${activeSection === 'cloudflare' ? 'active' : ''}`} onClick={() => setActiveSection('cloudflare')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"></path><line x1="8" y1="16" x2="8.01" y2="16"></line><line x1="8" y1="20" x2="8.01" y2="20"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="12" y1="22" x2="12.01" y2="22"></line><line x1="16" y1="16" x2="16.01" y2="16"></line><line x1="16" y1="20" x2="16.01" y2="20"></line></svg>
                        Cloudflare
                    </div>
                    <div className={`sidebar-nav-item ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Security
                    </div>
                    <div className={`sidebar-nav-item ${activeSection === 'domains' ? 'active' : ''}`} onClick={() => setActiveSection('domains')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                        Domains
                    </div>
                    <div className={`sidebar-nav-item ${activeSection === 'team' ? 'active' : ''}`} onClick={() => setActiveSection('team')}>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Smartlinks / Team
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="admin-content">
                    {activeSection === 'appearance' && (
                        <div className="mnx-card fade-in">
                            <span className="section-label">🎨 APPEARANCE SETTINGS</span>
                            <div className="mnx-grid" style={{ marginBottom: '20px', marginTop: '15px' }}>
                                <div>
                                    <span className="section-label">BRAND NAME</span>
                                    <div className="mnx-input-group">
                                        <input type="text" className="mnx-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <span className="section-label">BRAND BADGE</span>
                                    <div className="mnx-input-group">
                                        <input type="text" className="mnx-input" value={brandBadge} onChange={(e) => setBrandBadge(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <button className="btn-mnx-main" onClick={saveAppearance} disabled={loading}>SAVE APPEARANCE</button>
                        </div>
                    )}

                    {activeSection === 'cloudflare' && (
                        <div className="mnx-card fade-in">
                            <span className="section-label">☁️ CLOUDFLARE SETTINGS</span>
                            <div className="mnx-grid" style={{ marginBottom: '20px', marginTop: '15px' }}>
                                <div>
                                    <span className="section-label">API TOKEN</span>
                                    <div className="mnx-input-group">
                                        <input type="password" className="mnx-input" value={cfToken} onChange={(e) => setCfToken(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <span className="section-label">ACCOUNT ID</span>
                                    <div className="mnx-input-group">
                                        <input type="text" className="mnx-input" value={cfAccountId} onChange={(e) => setCfAccountId(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <button className="btn-mnx-main" onClick={saveCredentials} disabled={loading}>SAVE CREDENTIALS</button>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="mnx-card fade-in">
                            <span className="section-label">🔒 SECURITY</span>
                            <div style={{ marginTop: '15px' }}>
                                <span className="section-label">CURRENT PASSWORD: <span style={{ color: 'var(--accent-cyan)' }}>{currentPassword}</span></span>
                                <div className="mnx-input-group">
                                    <input type="password" className="mnx-input" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                    <button className="service-btn active" onClick={handleChangePassword} disabled={loading} style={{ borderRadius: '0 12px 12px 0', padding: '0 20px' }}>UPDATE</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'domains' && (
                        <div className="fade-in">
                            <div className="mnx-card">
                                <span className="section-label">🌐 REGISTERED DOMAINS</span>
                                <div className="mnx-input-group" style={{ marginTop: '15px', marginBottom: '15px' }}>
                                    <input type="text" className="mnx-input" placeholder="example.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
                                    <button className="btn-mnx-main" onClick={addDomainWithCloudflare} disabled={loading} style={{ width: 'auto', padding: '0 25px', marginTop: 0, borderRadius: '0 12px 12px 0', minWidth: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {loading ? (
                                            <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                                <line x1="12" y1="2" x2="12" y2="6"></line>
                                                <line x1="12" y1="18" x2="12" y2="22"></line>
                                                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                                                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                                                <line x1="2" y1="12" x2="6" y2="12"></line>
                                                <line x1="18" y1="12" x2="22" y2="12"></line>
                                                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                                                <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
                                            </svg>
                                        ) : 'ADD'}
                                    </button>
                                </div>
                                <div className="output-scroll" style={{ maxHeight: '300px' }}>
                                    {domains.map((d, i) => (
                                        <div key={i} className="mnx-output-item" style={{ marginBottom: '5px' }}>
                                            <span>{d}</span>
                                            <button className="mnx-power-btn" onClick={() => handleDeleteDomain(d)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'team' && (
                        <div className="fade-in">
                            <div className="mnx-card">
                                <span className="section-label">🚀 SMARTLINK MANAGEMENT (TEAM)</span>

                                <form onSubmit={handleAddSmartlink} style={{ marginTop: '20px', background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px', position: 'relative' }}>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            CANCEL EDIT [X]
                                        </button>
                                    )}
                                    <div className="mnx-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '15px' }}>
                                        <div>
                                            <span className="section-label">NAMA MEMBER</span>
                                            <input type="text" className="mnx-input" placeholder="e.g. Alfi Team" value={smartName} onChange={(e) => setSmartName(e.target.value)} />
                                        </div>
                                        <div>
                                            <span className="section-label">SLUG ID (/t/...)</span>
                                            <input type="text" className="mnx-input" placeholder="e.g. alfi" value={smartSlug} onChange={(e) => setSmartSlug(e.target.value)} />
                                        </div>
                                        <div>
                                            <span className="section-label">PASSWORD</span>
                                            <input type="text" className="mnx-input" placeholder="password123" value={smartPassword} onChange={(e) => setSmartPassword(e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '15px' }}>
                                        <span className="section-label">TARGET URL (DESTINATION)</span>
                                        <input type="text" className="mnx-input" placeholder="https://..." value={smartUrl} onChange={(e) => setSmartUrl(e.target.value)} />
                                    </div>
                                    <button className="btn-mnx-main" type="submit" disabled={loading} style={{ marginTop: '20px' }}>
                                        {editingId ? 'SIMPAN PERUBAHAN' : 'BUAT SMARTLINK'}
                                    </button>
                                </form>

                                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="mnx-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>NAMA</th>
                                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>SLUG</th>
                                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>PASSWORD</th>
                                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>TARGET URL</th>
                                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>LINK GEN</th>
                                                <th style={{ textAlign: 'center', padding: '12px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800 }}>AKSI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {smartlinks.map(link => (
                                                <tr key={link.id} className="mnx-output-item-row" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
                                                    <td style={{ padding: '15px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontWeight: 700, color: '#fff' }}>{link.name}</td>
                                                    <td style={{ padding: '15px' }}><span className="mnx-pill" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', fontSize: '0.7rem' }}>/t/{link.user_id}</span></td>
                                                    <td style={{ padding: '15px', color: '#ff9d00', fontSize: '0.8rem', fontFamily: 'monospace' }}>{link.password}</td>
                                                    <td style={{ padding: '15px', color: '#94a3b8', fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.links?.original_url || '-'}</td>
                                                    <td style={{ padding: '15px' }}>
                                                        <a href={`${window.location.protocol}//${window.location.host}/t/${link.user_id}`} target="_blank" rel="noreferrer" style={{ color: '#06b6d4', fontSize: '0.8rem', textDecoration: 'none' }}>
                                                            {window.location.host}/t/{link.user_id}
                                                        </a>
                                                    </td>
                                                    <td style={{ padding: '15px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button className="mnx-power-btn" onClick={() => handleEditClick(link)} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                            </button>
                                                            <button className="mnx-power-btn" onClick={() => handleDeleteSmartlink(link.id)}>
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {message.text && (
                        <div className={`mnx-alert ${message.type === 'success' ? 'mnx-alert-success' : 'mnx-alert-error'}`} style={{ marginTop: '20px' }}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin;
