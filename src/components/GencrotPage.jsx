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
            GENCROT ACCESS
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

// ─── Generator Page (Identical to Main App layout) ───────────────────────────
function GencrotGenerator() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('__RANDOM__');
  const [targetUrls, setTargetUrls] = useState('');
  const [subId, setSubId] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [customSlug, setCustomSlug] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useFSubdomain, setUseFSubdomain] = useState(false);
  const [selectedLp, setSelectedLp] = useState('OFF');
  const [selectedShortener, setSelectedShortener] = useState('DEFAULT');
  const [ixSkApiKey, setIxSkApiKey] = useState(localStorage.getItem('ix_sk_api_key') || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [brandBadge, setBrandBadge] = useState('PLAT_AG');

  const femaleNames = [
    'olivia', 'emma', 'amelia', 'sophia', 'charlotte', 'ava', 'isabella', 'mia', 'evelyn', 'harper',
    'luna', 'camila', 'gianna', 'elizabeth', 'eleanor', 'ella', 'abigail', 'sofia', 'avery', 'scarlett',
    'emily', 'aria', 'penelope', 'chloe', 'layla', 'mila', 'nora', 'hazel', 'madison', 'ellie',
    'lily', 'nova', 'isla', 'grace', 'violet', 'aurora', 'riley', 'zoey', 'willow', 'emilia'
  ];

  useEffect(() => {
    fetchDomains().then(data => setDomains(data.domains || [])).catch(() => {});
    fetch('/api/get-settings?key=brand_badge')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setBrandBadge(d.data.value); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleSubIdChange = (val) => {
    setSubId(val);
    if (targetUrls) {
      const params = ['click_id', 'clickid', 'subid'];
      let updatedText = targetUrls;
      params.forEach(param => {
        const regex = new RegExp(`(${param}=)([^&\\s]*)`, 'gi');
        updatedText = updatedText.replace(regex, `$1${val}`);
      });
      setTargetUrls(updatedText);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.data.url);
      } else {
        alert('Upload gagal: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setUploadingImg(false);
      e.target.value = null;
    }
  };

  const generateRandomSlug = (length = 16) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length)]).join('');
  };

  const generateLinks = async () => {
    const urls = targetUrls.split('\n').filter(url => url.trim() !== '');
    if (urls.length === 0) { alert('Masukkan minimal satu URL!'); return; }
    if (!selectedDomain) { alert('Tunggu sebentar, sedang memuat domain...'); return; }

    setLoading(true);
    const linksToBatch = [];
    const generatedLinks = [];
    let totalItems = urls.length * jumlah;
    let processCount = 0;

    try {
      for (const url of urls) {
        for (let i = 0; i < jumlah; i++) {
          processCount++;
          let randomSlug = (customSlug && customSlug.trim() !== '')
            ? (totalItems > 1 ? `${customSlug.trim()}-${processCount}` : customSlug.trim())
            : generateRandomSlug(16);

          let domainToUse = selectedDomain;
          if (selectedDomain === '__RANDOM__' && domains.length > 0) {
            domainToUse = domains[Math.floor(Math.random() * domains.length)];
          }

          let finalDomain = domainToUse;
          if (useFSubdomain && !domainToUse.includes('localhost')) {
            const randomName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
            const randSuffix = Math.floor(Math.random() * 100);
            finalDomain = `${randomName}${randSuffix}.${domainToUse}`;
          }

          const protocol = domainToUse.includes('localhost') ? 'http' : 'https';
          let generatedLink = `${protocol}://${finalDomain}/${randomSlug}`;
          if (selectedLp !== 'OFF') generatedLink += `?lp=${selectedLp}`;

          let finalLink = generatedLink;
          if (selectedShortener !== 'DEFAULT') {
            try {
              const shortRes = await fetch('/api/shorten-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: generatedLink,
                  service: selectedShortener,
                  apiKey: selectedShortener === 'IX.SK' ? ixSkApiKey : null
                })
              });
              const shortData = await shortRes.json();
              if (shortData.success && shortData.shortenedUrl) {
                finalLink = shortData.shortenedUrl;
              }
            } catch (e) {
              console.warn('Shortening failed:', e);
            }
          }

          linksToBatch.push({
            slug: randomSlug,
            original_url: url,
            domain_url: domainToUse,
            title: judul,
            description: deskripsi,
            image_url: imageUrl,
            user_id: null
          });
          generatedLinks.push(finalLink);
        }
      }

      if (linksToBatch.length > 0) await batchSaveLinks(linksToBatch);

      if (generatedLinks.length > 0) {
        setOutput(generatedLinks);
        if (customSlug) setCustomSlug('');
        fetch('/api/warm-og-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: generatedLinks })
        }).catch(() => {});
      }
    } catch (err) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (output.length === 0) return;
    try {
      await navigator.clipboard.writeText(output.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const clearOutput = () => {
    setOutput([]);
    setCopied(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  return (
    <div className="container fade-in">
      {/* Top Bar / Header (Exact match to main App) */}
      <header className="mnx-top-bar">
        <div className="mnx-logo-group">
          <div className="mnx-logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--accent-cyan)" strokeWidth="2.5" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <div className="mnx-brand-info">
            <img src="/ngeteam-logo.png" alt="NGETEAM" className="mnx-brand-logo" />
            <span className="mnx-brand-badge">GENCROT</span>
          </div>
        </div>

        <div className="mnx-status-controls">
          <div className="mnx-theme-toggle-wrapper">
            <button
              onClick={toggleTheme}
              className={`mnx-theme-btn ${theme === 'light' ? 'light' : 'dark'}`}
              title="Toggle Theme"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                {theme === 'light' ? (
                  <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                ) : (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                )}
              </svg>
            </button>
          </div>

          <button className="mnx-logout-btn" onClick={handleLogout} title="Logout">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Simple Top Navigation - Only Generator */}
      <div className="mnx-tab-nav" style={{ justifyContent: 'center' }}>
        <div className="mnx-tab-btn active" style={{ cursor: 'default' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          GENCROT ENGINE ACTIVATED
        </div>
      </div>

      {/* Generator Layout - Exact 2 column match */}
      <div className="generator-layout fade-in">
        {/* LEFT COLUMN: LINK ENGINE */}
        <div className="admin-section">
          <span className="section-label">⚡ LINK ENGINE</span>

          {/* Domain Selection */}
          <div className="mnx-input-group" style={{ marginBottom: '20px' }}>
            <div className="mnx-input-prepend">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
              DOMAIN
            </div>
            <select
              className="mnx-input"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="__RANDOM__">Random Domain</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <span className="section-title">TARGET URL (IMONETIZEIT)</span>
          <div className="mnx-input-group target-url-group">
            <div className="mnx-input-prepend" style={{ height: 'auto', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              URL
            </div>
            <textarea
              className="mnx-input"
              style={{ minHeight: '80px', background: 'transparent' }}
              value={targetUrls}
              onChange={(e) => setTargetUrls(e.target.value)}
              placeholder="Masukkan URL target di sini..."
            />
          </div>

          <div className="fade-in form-group">
            <span className="section-title">CUSTOMIZE CLICK ID</span>
            <div className="mnx-input-group">
              <div className="mnx-input-prepend">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                CLICK ID
              </div>
              <input
                className="mnx-input"
                placeholder="e.g. Alcemits-ig"
                value={subId}
                onChange={(e) => handleSubIdChange(e.target.value)}
              />
            </div>
          </div>

          <div className="mnx-grid" style={{ marginTop: '20px', gridTemplateColumns: '1fr 1fr 2fr' }}>
            <button
              className={`secondary-glass-btn ${useFSubdomain ? 'active' : ''}`}
              style={{ height: '50px' }}
              onClick={() => setUseFSubdomain(!useFSubdomain)}
            >
              F-SUB: {useFSubdomain ? 'ON' : 'OFF'}
            </button>
            <select
              className="mnx-input"
              style={{ height: '50px', fontWeight: 800, textAlign: 'center', background: 'rgba(0, 242, 255, 0.04)', border: '1px dashed var(--border-base)', color: 'var(--accent-cyan)', padding: '0' }}
              value={selectedLp}
              onChange={(e) => setSelectedLp(e.target.value)}
            >
              <option value="OFF">LP: OFF</option>
              <option value="1">LP 1: Live Free Cams</option>
              <option value="2">LP 2: Exclusive Video</option>
              <option value="3">LP 3: Premium Stream</option>
            </select>
            <button className="btn-mnx-main" onClick={generateLinks} disabled={loading} style={{ height: '50px' }}>
              {loading ? 'GENERATING...' : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                  GENERATE
                </>
              )}
            </button>
          </div>

          {/* Result Area */}
          <div className="mnx-output-bar" style={{ marginTop: '30px', padding: '20px' }}>
            {output.length > 0 ? (
              <div className="output-scroll">
                {output.map((link, idx) => (
                  <div key={idx} className="mnx-output-item">
                    <span style={{ fontSize: '0.85rem' }}>{link}</span>
                    <svg onClick={() => { navigator.clipboard.writeText(link); alert('Copied!'); }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: 'pointer' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn-mnx-main" style={{ flexGrow: 1, height: '40px' }} onClick={copyAll}>
                    {copied ? 'COPIED!' : 'COPY ALL'}
                  </button>
                  <button className="secondary-glass-btn" style={{ height: '40px' }} onClick={clearOutput}>
                    CLEAR
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', opacity: 0.5 }}>Resulting link...</div>
            )}
          </div>

          {/* Shortener Service Selection */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>SHORTENER SERVICE</span>
            <div className="mnx-compact-nav" style={{ marginBottom: selectedShortener === 'IX.SK' ? '15px' : '0' }}>
              {['DEFAULT', 'IX.SK'].map(service => (
                <button
                  key={service}
                  className={`mnx-tab-btn ${selectedShortener === service ? 'active' : ''}`}
                  onClick={() => setSelectedShortener(service)}
                >
                  {service}
                </button>
              ))}
            </div>

            {selectedShortener === 'IX.SK' && (
              <div className="fade-in mnx-input-group" style={{ marginBottom: '0' }}>
                <div className="mnx-input-prepend" style={{ minWidth: 'auto', padding: '10px 15px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3y-2.5 2.5z"></path></svg>
                  API KEY
                </div>
                <input
                  className="mnx-input"
                  style={{ padding: '10px 15px', fontSize: '0.85rem' }}
                  placeholder="Masukkan IX.SK API Key..."
                  value={ixSkApiKey}
                  onChange={(e) => {
                    setIxSkApiKey(e.target.value);
                    localStorage.setItem('ix_sk_api_key', e.target.value);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: METADATA & SOCIAL */}
        <div className="admin-section">
          <span className="section-label">⚙️ METADATA & SOCIAL</span>

          <div className="mnx-grid">
            <div>
              <span className="section-title">CUSTOM SLUG</span>
              <div className="mnx-input-group">
                <input className="mnx-input" placeholder="slug-viral" value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} />
              </div>
            </div>
            <div>
              <span className="section-title">JUMLAH</span>
              <div className="mnx-input-group">
                <input
                  type="number"
                  className="mnx-input"
                  value={jumlah}
                  onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <span className="section-title">JUDUL META</span>
            <div className="mnx-input-group">
              <input className="mnx-input" placeholder="Input Judul Link..." value={judul} onChange={(e) => setJudul(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <span className="section-title">IMAGE URL</span>
            <div className="mnx-input-group" style={{ display: 'flex', alignItems: 'center' }}>
              <input className="mnx-input" placeholder="https://image.url/..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flexGrow: 1 }} />
              <label
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: uploadingImg ? 0.5 : 1,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-base)',
                  borderRadius: '10px',
                  width: '42px',
                  height: '42px',
                  marginLeft: '8px',
                  flexShrink: 0,
                  transition: 'border-color 0.15s ease'
                }}
              >
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImg} />
                {uploadingImg ? (
                  <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                )}
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <span className="section-title">DESKRIPSI META</span>
            <div className="mnx-input-group">
              <textarea
                className="mnx-textarea"
                style={{ minHeight: '80px' }}
                placeholder="Deskripsi link.."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              />
            </div>
          </div>

          <div className="mnx-preview-card">
            <div className="preview-label">LIVE PREVIEW</div>
            <div className="preview-image-box">
              {imageUrl ? <img src={imageUrl} alt="preview" /> : <div className="preview-placeholder">IMAGE PREVIEW</div>}
            </div>
            <div className="preview-content">
              <small>YOUR DOMAIN</small>
              <strong>{judul || 'Untitled Link'}</strong>
              <p>{deskripsi || 'Provide a description to see it here...'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mnx-footer">
        ccpXengine &nbsp; V 2 . 0 &nbsp; AERO
      </div>
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
