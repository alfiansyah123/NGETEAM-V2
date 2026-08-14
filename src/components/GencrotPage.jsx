import { useState, useEffect } from 'react';
import { fetchDomains, batchSaveLinks } from '../services/api';

const SESSION_KEY = 'gencrot_session';

// ─── Login Screen ────────────────────────────────────────────────────────────
function GencrotLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-gencrot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem(SESSION_KEY, '1');
        onSuccess();
      } else {
        setError(data.error || 'Password salah');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-base)',
        borderRadius: '20px',
        padding: '40px 32px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)'
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 4px 20px rgba(6,182,212,0.35)'
          }}>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px' }}>
            GEN LINK
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Generator Access
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <div className="mnx-input-group" style={{ animation: shake ? 'shakex 0.4s ease' : 'none' }}>
              <input
                className="mnx-input"
                type="password"
                placeholder="Masukkan password akses..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                style={{ fontSize: '0.95rem', padding: '13px 16px' }}
              />
            </div>
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '8px', textAlign: 'center' }}>
                ⚠ {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-mnx-main"
            style={{ width: '100%', padding: '13px', fontSize: '0.9rem', letterSpacing: '1.5px' }}
            disabled={loading}
          >
            {loading ? 'VERIFIKASI...' : 'MASUK'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '24px', opacity: 0.5 }}>
          ccpXengine · Authorized Access Only
        </p>
      </div>

      <style>{`
        @keyframes shakex {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

// ─── Generator Page ──────────────────────────────────────────────────────────
function GencrotGenerator() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('__RANDOM__');
  const [targetUrls, setTargetUrls] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [customSlug, setCustomSlug] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useFSubdomain, setUseFSubdomain] = useState(false);
  const [selectedLp, setSelectedLp] = useState('OFF');

  const femaleNames = [
    'olivia','emma','amelia','sophia','charlotte','ava','isabella','mia','evelyn','harper',
    'luna','camila','gianna','elizabeth','eleanor','ella','abigail','sofia','avery','scarlett',
    'emily','aria','penelope','chloe','layla','mila','nora','hazel','madison','ellie',
    'lily','nova','isla','grace','violet','aurora','riley','zoey','willow','emilia'
  ];

  useEffect(() => {
    fetch('/api/get-domains')
      .then(r => r.json())
      .then(d => setDomains(d.domains || []))
      .catch(() => {});
  }, []);

  const generateRandomSlug = (length = 16) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleGenerate = async () => {
    const urls = targetUrls.split('\n').filter(u => u.trim());
    if (!urls.length) { alert('Masukkan minimal satu URL!'); return; }

    setLoading(true);
    const linksToBatch = [];
    const generatedLinks = [];
    let count = 0;

    try {
      for (const url of urls) {
        for (let i = 0; i < jumlah; i++) {
          count++;
          let slug = customSlug?.trim()
            ? (urls.length * jumlah > 1 ? `${customSlug.trim()}-${count}` : customSlug.trim())
            : generateRandomSlug(16);

          let domainToUse = selectedDomain;
          if (selectedDomain === '__RANDOM__' && domains.length > 0) {
            domainToUse = domains[Math.floor(Math.random() * domains.length)];
          }

          let finalDomain = domainToUse;
          if (useFSubdomain && !domainToUse.includes('localhost')) {
            const name = femaleNames[Math.floor(Math.random() * femaleNames.length)];
            const suffix = Math.floor(Math.random() * 100);
            finalDomain = `${name}${suffix}.${domainToUse}`;
          }

          const protocol = domainToUse.includes('localhost') ? 'http' : 'https';
          let link = `${protocol}://${finalDomain}/${slug}`;
          if (selectedLp !== 'OFF') link += `?lp=${selectedLp}`;

          linksToBatch.push({
            slug,
            original_url: url,
            domain_url: domainToUse,
            title: judul,
            description: deskripsi,
            image_url: imageUrl,
            user_id: null
          });
          generatedLinks.push(link);
        }
      }

      if (linksToBatch.length > 0) await batchSaveLinks(linksToBatch);
      setOutput(generatedLinks);
      if (customSlug) setCustomSlug('');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!output.length) return;
    await navigator.clipboard.writeText(output.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  return (
    <div className="container fade-in">
      {/* Header */}
      <header className="mnx-top-bar">
        <div className="mnx-logo-group">
          <div className="mnx-logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--accent-cyan)" strokeWidth="2.5" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <div className="mnx-brand-name">GEN LINK</div>
            <div className="mnx-brand-badge">PUBLIC · GENERATOR</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleLogout}
            className="secondary-glass-btn"
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            KELUAR
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="mnx-main-layout" style={{ marginTop: '0' }}>
        <div className="admin-section">
          <span className="section-label">⚡ TARGET URL</span>
          <div className="mnx-input-group">
            <textarea
              className="mnx-textarea"
              style={{ minHeight: '130px' }}
              placeholder="Masukkan URL target di sini, satu per baris..."
              value={targetUrls}
              onChange={e => setTargetUrls(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-section">
          <span className="section-label">🌐 DOMAIN</span>
          <div className="mnx-input-group">
            <select
              className="mnx-input"
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="__RANDOM__">🎲 Random Domain</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="fsub-pub"
              checked={useFSubdomain}
              onChange={e => setUseFSubdomain(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="fsub-pub" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer' }}>
              Gunakan female subdomain
            </label>
          </div>
        </div>

        <div className="admin-section">
          <span className="section-label">🎯 LANDING PAGE</span>
          <div className="mnx-compact-nav" style={{ marginBottom: '0' }}>
            {['OFF', 'LP1', 'LP2', 'LP3'].map(lp => (
              <button
                key={lp}
                className={`mnx-tab-btn ${selectedLp === lp ? 'active' : ''}`}
                onClick={() => setSelectedLp(lp)}
              >
                {lp}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <span className="section-label">⚙️ METADATA & OPSI</span>
          <div className="mnx-grid" style={{ marginBottom: '10px' }}>
            <div>
              <span className="section-title">CUSTOM SLUG</span>
              <div className="mnx-input-group">
                <input
                  className="mnx-input"
                  placeholder="slug-kustom"
                  value={customSlug}
                  onChange={e => setCustomSlug(e.target.value)}
                />
              </div>
            </div>
            <div>
              <span className="section-title">JUMLAH</span>
              <div className="mnx-input-group">
                <input
                  type="number"
                  className="mnx-input"
                  value={jumlah}
                  min={1}
                  max={100}
                  onChange={e => setJumlah(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span className="section-title">JUDUL META</span>
            <div className="mnx-input-group">
              <input
                className="mnx-input"
                placeholder="Input Judul Link..."
                value={judul}
                onChange={e => setJudul(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <span className="section-title">IMAGE URL</span>
            <div className="mnx-input-group">
              <input
                className="mnx-input"
                placeholder="https://image.url/..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <div>
            <span className="section-title">DESKRIPSI META</span>
            <div className="mnx-input-group">
              <textarea
                className="mnx-textarea"
                style={{ minHeight: '70px' }}
                placeholder="Deskripsi link..."
                value={deskripsi}
                onChange={e => setDeskripsi(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          className="btn-mnx-main"
          style={{ width: '100%', padding: '15px', fontSize: '0.95rem', letterSpacing: '2px', marginBottom: '16px' }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? '⚡ GENERATING...' : '⚡ GENERATE LINK'}
        </button>

        {/* Output */}
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="section-label" style={{ marginBottom: 0 }}>📋 HASIL</span>
            {output.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{output.length} link</span>
            )}
          </div>
          {output.length > 0 ? (
            <>
              <div style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-base)',
                borderRadius: '12px',
                padding: '14px',
                maxHeight: '300px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.8'
              }}>
                {output.map((link, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ wordBreak: 'break-all', color: 'var(--accent-cyan)' }}>{link}</span>
                    <svg
                      onClick={() => navigator.clipboard.writeText(link).then(() => alert('Copied!'))}
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.6 }}
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn-mnx-main"
                  style={{ flexGrow: 1, height: '40px' }}
                  onClick={copyAll}
                >
                  {copied ? 'COPIED!' : 'COPY ALL'}
                </button>
                <button
                  className="secondary-glass-btn"
                  style={{ height: '40px' }}
                  onClick={() => { setOutput([]); setCopied(false); }}
                >
                  CLEAR
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.4, padding: '20px', fontSize: '0.85rem' }}>
              Hasil link akan muncul di sini...
            </div>
          )}
        </div>
      </div>

      <div className="mnx-footer">ccpXengine &nbsp; V 2 . 0 &nbsp; AERO</div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function GencrotPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));

  if (!authed) {
    return <GencrotLogin onSuccess={() => setAuthed(true)} />;
  }
  return <GencrotGenerator />;
}
