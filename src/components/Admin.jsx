import { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
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

    // Load saved credentials & initial data
    useEffect(() => {
        fetchSettings();
        fetchDomains();
        fetchCurrentPassword();
    }, []);

    const fetchSettings = async () => {
        try {
            // Fetch CF Token
            const tokenRes = await fetch('/api/get-settings?key=cf_token');
            const tokenData = await tokenRes.json();
            if (tokenData.success && tokenData.data) setCfToken(tokenData.data.value);

            // Fetch CF Account ID
            const accRes = await fetch('/api/get-settings?key=cf_account_id');
            const accData = await accRes.json();
            if (accData.success && accData.data) setCfAccountId(accData.data.value);

            // Fetch Appearance
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

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 chars' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setNewPassword('');
                fetchCurrentPassword();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const saveCredentials = async () => {
        setLoading(true);
        try {
            // Save Token
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'cf_token', value: cfToken })
            });

            // Save Account ID
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'cf_account_id', value: cfAccountId })
            });

            setMessage({ type: 'success', text: 'Credentials saved to Database!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save credentials' });
        } finally {
            setLoading(false);
        }
    };

    const addDomainWithCloudflare = async () => {
        if (!newDomain.trim()) {
            setMessage({ type: 'error', text: 'Please enter a domain name' });
            return;
        }

        if (!cfToken || !cfAccountId) {
            setMessage({ type: 'error', text: 'Please set Cloudflare credentials first' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        setNameservers(null);

        try {
            // Step 1: Add zone to Cloudflare
            const addZoneRes = await fetch('/api/cloudflare/add-zone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: newDomain.trim(),
                    cfToken,
                    cfAccountId
                })
            });

            const zoneData = await addZoneRes.json();

            if (!addZoneRes.ok) {
                throw new Error(zoneData.error || 'Failed to add zone');
            }

            // Step 2: Setup DNS records
            const setupDnsRes = await fetch('/api/cloudflare/setup-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zoneId: zoneData.zone_id,
                    domain: newDomain.trim(),
                    cfToken
                })
            });

            const dnsData = await setupDnsRes.json();

            if (!setupDnsRes.ok) {
                throw new Error(dnsData.error || 'Failed to setup DNS');
            }

            // Step 3: Link domain to Pages project
            const addPagesRes = await fetch('/api/cloudflare/add-pages-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: newDomain.trim(),
                    cfToken,
                    cfAccountId
                })
            });

            const pagesData = await addPagesRes.json();

            if (!addPagesRes.ok) {
                throw new Error(pagesData.error || 'Failed to link to Pages project');
            }

            // Step 4: Save domain to database
            const saveRes = await fetch('/api/add-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newDomain.trim() })
            });

            const dbData = await saveRes.json();

            if (!saveRes.ok) {
                throw new Error(dbData.error || 'Failed to save domain to database');
            }

            // Step 5: Deploy Worker Sakti (Proxy for Wildcard)
            const proxyRes = await fetch('/api/cloudflare/setup-worker-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: newDomain.trim(),
                    cfToken,
                    cfAccountId
                })
            });
            const proxyData = await proxyRes.json();
            if (!proxyRes.ok) {
                throw new Error(`Cara Sakti Failed: ${proxyData.error || 'Check API Permissions (Workers Scripts)'}`);
            }

            // Success!
            setNameservers(zoneData.nameservers);
            setMessage({
                type: 'success',
                text: `Domain "${newDomain}" added successfully!`
            });
            setNewDomain('');
            fetchDomains();

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
            setMessage({ type: 'success', text: 'Appearance settings saved!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save appearance' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDomain = async (domain) => {
        if (!confirm(`Are you sure you want to delete ${domain}? This will remove it from database AND Cloudflare.`)) {
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. Delete from Cloudflare (if credentials exist)
            if (cfToken && cfAccountId) {
                try {
                    const cfRes = await fetch('/api/cloudflare/delete-zone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ domain, cfToken, cfAccountId })
                    });
                    const cfData = await cfRes.json();
                    if (!cfRes.ok) {
                        console.warn('Cloudflare deletion failed, but proceeding to DB:', cfData.error);
                    }
                } catch (cfErr) {
                    console.error('Cloudflare fetch error:', cfErr);
                }
            }

            // 2. Delete from Database
            const dbRes = await fetch('/api/delete-domain', {
                method: 'POST', // Using POST for better compatibility
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            });

            const dbData = await dbRes.json();

            if (!dbRes.ok) throw new Error(dbData.error || 'Failed to delete from database');

            if (dbData.deleted === 0) {
                setMessage({ type: 'warning', text: `Domain ${domain} not found in DB (already deleted?)` });
            } else {
                setMessage({ type: 'success', text: `Domain ${domain} deleted!` });
            }

            // Optimistic update
            setDomains(prev => prev.filter(d => d !== domain));

            // Sync with server
            fetchDomains();

        } catch (err) {
            setMessage({ type: 'error', text: 'Delete failed: ' + err.message });
            fetchDomains(); // Revert on error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container fade-in">
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
                    <a href="/" className="mnx-power-btn" title="Back to Generator" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </a>
                </div>
            </div>

            {/* Appearance Settings */}
            <div className="mnx-card-container fade-in">
                <div className="mnx-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                        <span className="section-label" style={{ marginBottom: 0 }}>🎨 APPEARANCE SETTINGS</span>
                    </div>

                    <div className="mnx-grid" style={{ marginBottom: '20px' }}>
                        <div>
                            <span className="section-label">BRAND NAME</span>
                            <div className="mnx-input-group">
                                <input
                                    type="text"
                                    className="mnx-input"
                                    placeholder="e.g. MNX GEN"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <span className="section-label">BRAND BADGE</span>
                            <div className="mnx-input-group">
                                <input
                                    type="text"
                                    className="mnx-input"
                                    placeholder="e.g. PRO_V1"
                                    value={brandBadge}
                                    onChange={(e) => setBrandBadge(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="btn-mnx-main" onClick={saveAppearance} disabled={loading} style={{ background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)', boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        SAVE APPEARANCE
                    </button>
                </div>
            </div>

            {/* Cloudflare Credentials */}
            <div className="mnx-card-container fade-in">
                <div className="mnx-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <span className="section-label" style={{ marginBottom: 0 }}>CLOUDFLARE SETTINGS</span>
                    </div>

                    <div className="mnx-grid" style={{ marginBottom: '20px' }}>
                        <div>
                            <span className="section-label">API TOKEN</span>
                            <div className="mnx-input-group">
                                <input
                                    type="password"
                                    className="mnx-input"
                                    placeholder="Cloudflare API Token"
                                    value={cfToken}
                                    onChange={(e) => setCfToken(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <span className="section-label">ACCOUNT ID</span>
                            <div className="mnx-input-group">
                                <input
                                    type="text"
                                    className="mnx-input"
                                    placeholder="Account ID"
                                    value={cfAccountId}
                                    onChange={(e) => setCfAccountId(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button className="btn-mnx-main" onClick={saveCredentials} disabled={loading} style={{ background: 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        SAVE CREDENTIALS
                    </button>
                </div>
            </div>

            {/* Change Password */}
            <div className="mnx-card-container fade-in" style={{ marginTop: '24px' }}>
                <div className="mnx-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span className="section-label" style={{ marginBottom: 0 }}>ADMIN PASSWORD</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Current: <strong style={{ color: 'var(--accent-cyan)' }}>{currentPassword}</strong></span>
                    </div>

                    <div className="mnx-input-group">
                        <input
                            type="password"
                            className="mnx-input"
                            placeholder="New Password (min 6 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            className="service-btn active"
                            onClick={handleChangePassword}
                            disabled={loading}
                            style={{ height: '100%', borderRadius: '0 12px 12px 0', padding: '0 25px' }}
                        >
                            UPDATE
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Domain */}
            <div className="mnx-card-container fade-in" style={{ marginTop: '24px' }}>
                <div className="mnx-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                        <span className="section-label" style={{ marginBottom: 0 }}>ADD DOMAIN (AUTO SETUP)</span>
                    </div>

                    <div className="mnx-input-group">
                        <input
                            type="text"
                            className="mnx-input"
                            placeholder="example.com"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            className="btn-mnx-main"
                            onClick={addDomainWithCloudflare}
                            disabled={loading}
                            style={{ width: 'auto', padding: '0 25px', marginTop: 0, borderRadius: '0 12px 12px 0' }}
                        >
                            {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'ADD & SETUP'}
                        </button>
                    </div>

                    {message.text && (
                        <div className={`mnx-output-bar ${message.type}`} style={{ padding: '15px', marginTop: '15px', minHeight: 'auto', justifyContent: 'flex-start', fontSize: '0.85rem' }}>
                            <div style={{ color: message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
                                {message.text}
                            </div>
                        </div>
                    )}

                    {nameservers && (
                        <div className="mnx-output-bar" style={{ display: 'block', padding: '15px', marginTop: '15px', minHeight: 'auto' }}>
                            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>📋 UPDATE NAMESERVERS:</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {nameservers.map((ns, i) => (
                                    <code key={i} style={{ background: 'var(--bg-surface)', padding: '5px 10px', borderRadius: '5px', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{ns}</code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Domain List */}
            <div className="mnx-card-container fade-in" style={{ marginTop: '24px' }}>
                <div className="mnx-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            <span className="section-label" style={{ marginBottom: 0 }}>REGISTERED DOMAINS</span>
                        </div>
                        <span className="mnx-logo-badge" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{domains.length}</span>
                    </div>

                    <div className="output-scroll" style={{ maxHeight: '400px' }}>
                        {domains.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>No domains registered yet</div>
                        ) : (
                            domains.map((domain, index) => (
                                <div key={index} className="mnx-output-item" style={{ marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{domain}</span>
                                    <button
                                        className="mnx-power-btn"
                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                        onClick={() => handleDeleteDomain(domain)}
                                        disabled={loading}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
