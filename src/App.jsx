
import { useState, useEffect } from 'react'
import './App.css'
import { fetchDomains, saveLink, batchSaveLinks, addDomain } from './services/api'
import Login from './components/Login'
import LiveTraffic from './components/LiveTraffic'
import Reports from './components/Reports'
import Admin from './components/Admin'

function App() {
  // Check if on admin page
  const isAdminPage = window.location.pathname === '/admin';

  if (isAdminPage) {
    return <Admin />;
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('__RANDOM__')
  const [activeTab, setActiveTab] = useState('generator')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [teamMode, setTeamMode] = useState(null) // { userId, name, targetUrl }
  const [subId, setSubId] = useState('')
  const [selectedShortener, setSelectedShortener] = useState('DEFAULT')
  const [ixSkApiKey, setIxSkApiKey] = useState(localStorage.getItem('ix_sk_api_key') || '')

  // Consolidate App Initialization
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('auth_token');
      const loggedUser = localStorage.getItem('auth_user');
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);

      let authenticated = !!token;

      // Special Check for Team Routes (/t/...)
      if (segments[0] === 't' && segments.length === 2) {
        const userIdFromUrl = segments[1];

        // CRITICAL: Always load team context/branding regardless of login status
        await loadTeamContext(userIdFromUrl);

        // Deny access if not logged in OR mismatched user (and not admin)
        if (!token || !loggedUser || (loggedUser !== userIdFromUrl && loggedUser !== 'admin')) {
          authenticated = false;
        } else {
          authenticated = true;
        }
      }

      setIsLoggedIn(authenticated);
      setCheckingAuth(false);
    };

    initApp();
  }, []);

  const loadTeamContext = async (userId) => {
    try {
      const res = await fetch(`/api/get-smartlink-by-user?user_id=${userId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTeamMode(data.data);
        setSubId(data.data.user_id || '');
        if (data.data.target_url) {
          setTargetUrls(data.data.target_url);
        }
      }
    } catch (err) {
      console.error('Failed to load team context:', err);
    }
  };

  // Appearance Settings
  const [brandName, setBrandName] = useState('GEN LINK')
  const [brandBadge, setBrandBadge] = useState('PLAT_AG')

  // Generator State
  const [targetUrls, setTargetUrls] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [judul, setJudul] = useState('')
  const [jumlah, setJumlah] = useState(1)
  const [deskripsi, setDeskripsi] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [useFSubdomain, setUseFSubdomain] = useState(false)

  const [domains, setDomains] = useState([])

  const [output, setOutput] = useState([])
  const [imageError, setImageError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // History State
  const [history, setHistory] = useState([])


  useEffect(() => {
    const savedHistory = localStorage.getItem('link_history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const loadDomains = async () => {
    try {
      const data = await fetchDomains()
      setDomains(data.domains || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Fetch Appearance Settings
  const fetchAppearance = async () => {
    try {
      const nameRes = await fetch('/api/get-settings?key=brand_name');
      const nameData = await nameRes.json();
      if (nameData.success && nameData.data) setBrandName(nameData.data.value);

      const badgeRes = await fetch('/api/get-settings?key=brand_badge');
      const badgeData = await badgeRes.json();
      if (badgeData.success && badgeData.data) setBrandBadge(badgeData.data.value);
    } catch (err) {
      console.error('Failed to fetch appearance:', err);
    }
  };

  useEffect(() => {
    loadDomains();
    fetchAppearance();
  }, [])

  // Re-fetch branding when tab changes to ensure UI is in sync
  useEffect(() => {
    if (activeTab === 'generator') {
      fetchAppearance();
    }
  }, [activeTab])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleAddDomain = async () => {
    const newDomain = prompt('Masukkan domain baru (contoh: mylink.com):')
    if (!newDomain) return

    try {
      const result = await addDomain(newDomain)
      if (result.success) {
        alert('Domain berhasil ditambahkan!')
        await loadDomains()
        setSelectedDomain(result.domain)
      } else {
        alert(result.message || 'Gagal menambahkan domain')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  // Helper for Team Mode Sub-ID replacement
  const handleSubIdChange = (val) => {
    setSubId(val);
    if (!targetUrls) return;

    const params = ['click_id', 'clickid', 'subid'];
    let updatedText = targetUrls;
    params.forEach(param => {
      const regex = new RegExp(`(${param}=)([^&\\s]+)`, 'gi');
      updatedText = updatedText.replace(regex, `$1${val}`);
    });
    setTargetUrls(updatedText);
  };

  useEffect(() => {
    setImageError(false)
  }, [imageUrl])

  const generateRandomSlug = (length = 16) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let slug = ''
    for (let i = 0; i < length; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return slug
  }

  const femaleNames = [
    'olivia', 'emma', 'amelia', 'sophia', 'charlotte', 'ava', 'isabella', 'mia', 'evelyn', 'harper',
    'luna', 'camila', 'gianna', 'elizabeth', 'eleanor', 'ella', 'abigail', 'sofia', 'avery', 'scarlett',
    'emily', 'aria', 'penelope', 'chloe', 'layla', 'mila', 'nora', 'hazel', 'madison', 'ellie',
    'lily', 'nova', 'isla', 'grace', 'violet', 'aurora', 'riley', 'zoey', 'willow', 'emilia',
    'stella', 'zoe', 'victoria', 'hannah', 'addison', 'leah', 'lucy', 'eliana', 'ivy', 'everly',
    'lillian', 'paisley', 'elena', 'naomi', 'maya', 'natalie', 'kinsley', 'delilah', 'claire', 'audrey',
    'aaliyah', 'ruby', 'brooklyn', 'alice', 'aubrey', 'autumn', 'leilani', 'savannah', 'valentina', 'kennedy',
    'madelyn', 'josephine', 'bella', 'skylar', 'genesis', 'sophie', 'hailey', 'sadie', 'natalia', 'quinn',
    'caroline', 'allison', 'gabriella', 'anna', 'serenity', 'nevaeh', 'cora', 'ariana', 'emery', 'lydia',
    'jade', 'sarah', 'eva', 'adeline', 'madeline', 'piper', 'rylee', 'athena', 'peyton', 'vivian',
    'clara', 'raelynn', 'lilyana', 'brielle', 'mary', 'julia', 'hadley', 'leia', 'lola', 'jordyn',
    'reagan', 'mackenzie', 'lani', 'khloe', 'alaina', 'melanie', 'daisy', 'lilly', 'sienna', 'ariel',
    'angelina', 'isabel', 'reese', 'harlow', 'finley', 'katherine', 'adelaide', 'eliza', 'samantha', 'maggie',
    'liana', 'laila', 'lucia', 'valerie', 'alana', 'brianna', 'melody', 'kora', 'amara', 'rose'
  ]

  const addToHistory = (links) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      title: judul || 'Untitled',
      count: links.length,
      links: links
    }
    const updatedHistory = [newEntry, ...history]
    setHistory(updatedHistory)
    localStorage.setItem('link_history', JSON.stringify(updatedHistory))
  }

  const generateLinks = async () => {
    const urls = targetUrls.split('\n').filter(url => url.trim() !== '')

    if (urls.length === 0) {
      alert('Masukkan minimal satu URL!')
      return
    }

    if (!selectedDomain) {
      alert('Tunggu sebentar, sedang memuat domain...')
      return
    }

    setLoading(true)
    const generated = []
    let totalItems = urls.length * jumlah
    let processCount = 0

    try {
      const linksToBatch = [];
      const generatedLinks = [];

      for (const url of urls) {
        for (let i = 0; i < jumlah; i++) {
          processCount++

          let randomSlug
          if (customSlug && customSlug.trim() !== '') {
            if (totalItems > 1) {
              randomSlug = `${customSlug.trim()}-${processCount}`
            } else {
              randomSlug = customSlug.trim()
            }
          } else {
            randomSlug = generateRandomSlug(16)
          }

          let domainToUse = selectedDomain
          if (selectedDomain === '__RANDOM__' && domains.length > 0) {
            domainToUse = domains[Math.floor(Math.random() * domains.length)]
          }

          let finalDomain = domainToUse
          if (useFSubdomain && !domainToUse.includes('localhost')) {
            const randomName = femaleNames[Math.floor(Math.random() * femaleNames.length)]
            const randSuffix = Math.floor(Math.random() * 100)
            finalDomain = `${randomName}${randSuffix}.${domainToUse}`
          }

          const protocol = domainToUse.includes('localhost') ? 'http' : 'https'
          const generatedLink = `${protocol}://${finalDomain}/${randomSlug}`
          let finalLink = generatedLink

          // Shorten link if service is selected
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
            user_id: teamMode?.user_id || null
          });

          generatedLinks.push(finalLink);
        }
      }

      // Batch Save all links in a single request!
      if (linksToBatch.length > 0) {
        await batchSaveLinks(linksToBatch);
      }

      if (generatedLinks.length > 0) {
        setOutput(generatedLinks)
        addToHistory(generatedLinks)
        if (customSlug) setCustomSlug('')
      }
    } catch (err) {
      console.error('Error generating links:', err)
      alert(`Terjadi kesalahan: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyAll = async () => {
    if (output.length === 0) return
    try {
      await navigator.clipboard.writeText(output.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearOutput = () => {
    setOutput([])
    setCopied(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setIsLoggedIn(false)
  }

  if (checkingAuth) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <Login
        teamContext={teamMode}
        onLogin={async () => {
          setIsLoggedIn(true);
          // Check if we are on a team path to load context immediately after login
          const path = window.location.pathname;
          const segments = path.split('/').filter(Boolean);
          if (segments[0] === 't' && segments.length === 2) {
            loadTeamContext(segments[1]);
          } else {
            // Let's redirect admins to the admin page immediately upon login
            const loggedUser = localStorage.getItem('auth_user');
            // We need to fetch the admin username from settings to check properly, 
            // but since login just happened, checking against 'loggedUser' and potentially role is safer.
            // Usually, only the admin user can access the admin panel. 
            // To be 100% safe without an extra API call here, we check if they just logged in and want to go to admin.

            // A better way: The login API returns the role, let's store it!
          }
        }}
      />
    );
  }

  // If user is logged in, and they are an admin, redirect them to /admin 
  // ONLY if they are currently on the root path '/' (so we don't trap them if they intentionally visit another route, though they really shouldn't)
  if (isLoggedIn && window.location.pathname === '/') {
    const userRole = localStorage.getItem('auth_role');
    // For backwards compatibility, if role isn't set, we won't force redirect, but ideally login sets it.
    // Let's also check if user is the default 'ngeteam'
    const loggedUser = localStorage.getItem('auth_user');
    if (userRole === 'admin' || loggedUser === 'ngeteam' || loggedUser === 'admin') {
      window.location.href = '/admin';
      return null; // Return null while redirecting
    }
  }

  return (
    <div className="container fade-in">
      {/* Top Bar / Header */}
      <header className="mnx-top-bar">
        <div className="mnx-logo-group">
          <div className="mnx-logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="var(--accent-cyan)" strokeWidth="2.5" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <div className="mnx-brand-info">
            <img src="/ngeteam-logo.png" alt="NGETEAM" className="mnx-brand-logo" />
            <span className="mnx-brand-badge">{brandBadge}</span>
          </div>
        </div>

        <div className="mnx-status-controls">
          {teamMode && (
            <div className="mnx-pill-select team-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              {teamMode.name.toUpperCase()}
            </div>
          )}

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
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Sleek Segmented Control Navigation */}
      <div className="mnx-tab-nav">
        <button
          className={`mnx-tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          GENERATE LINK
        </button>
        <button
          className={`mnx-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          REPORTS
        </button>
      </div>

      {/* Content Area */}
      {
        activeTab === 'generator' ? (
          <div className="admin-section fade-in">
            <div className="admin-section">

              {/* Domain Selection */}
              <div className="section-header">
                <span className="section-title">SELECTED DOMAIN</span>
                <button
                  className="mnx-link-btn"
                  onClick={handleAddDomain}
                >
                  + ADD NEW
                </button>
              </div>
              <div className="mnx-input-group">
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

              <span className="section-title">TARGET URLS {teamMode && <span className="locked-badge">(LOCKED)</span>}</span>
              <div className="mnx-input-group target-url-group">
                {teamMode ? (
                  <>
                    <div className="mnx-input-prepend" style={{ height: 'auto', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      LOCKED
                    </div>
                    <textarea
                      className="mnx-input locked-textarea"
                      value={targetUrls}
                      readOnly
                    />
                  </>
                ) : (
                  <textarea
                    className="mnx-textarea"
                    placeholder="Paste URL Target Disini (Satu per baris)..."
                    value={targetUrls}
                    onChange={(e) => setTargetUrls(e.target.value)}
                  />
                )}
              </div>

              {teamMode && (
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
              )}

              <div className="mnx-grid grid-3-col">
                <div className="form-group">
                  <span className="section-title">CUSTOM SLUG</span>
                  <div className="mnx-input-group">
                    <input className="mnx-input" placeholder="slug-viral" value={customSlug} onChange={(e) => setCustomSlug(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <span className="section-title">JUDUL META</span>
                  <div className="mnx-input-group">
                    <input className="mnx-input" placeholder="Input Judul Link..." value={judul} onChange={(e) => setJudul(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
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

              <div className="mnx-grid">
                <div className="form-group">
                  <span className="section-title">IMAGE URL</span>
                  <div className="mnx-input-group">
                    <input className="mnx-input" placeholder="https://image.url/..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <span className="section-title">DESKRIPSI META</span>
                  <div className="mnx-input-group">
                    <input className="mnx-input" placeholder="Deskripsi link..." value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mnx-grid mobile-col-1">
                <button
                  className={`secondary-glass-btn ${useFSubdomain ? 'active' : ''}`}
                  onClick={() => setUseFSubdomain(!useFSubdomain)}
                >
                  F-SUBDOMAIN: {useFSubdomain ? 'ON' : 'OFF'}
                </button>
                <button className="btn-mnx-main" onClick={generateLinks} disabled={loading}>
                  {loading ? 'GENERATING...' : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                      GENERATE LINK
                    </>
                  )}
                </button>
              </div>

              {/* Result Area */}
              <div className="mnx-output-bar">
                {output.length > 0 ? (
                  <div className="output-scroll">
                    {output.map((link, idx) => (
                      <div key={idx} className="mnx-output-item">
                        <span>{link}</span>
                        <svg onClick={() => { navigator.clipboard.writeText(link); alert('Copied!'); }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: 'pointer' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="service-btn active" onClick={copyAll}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        {copied ? 'COPIED!' : 'COPY ALL'}
                      </button>
                      <button className="service-btn" onClick={clearOutput}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        CLEAR
                      </button>
                    </div>
                  </div>
                ) : (
                  "Resulting link..."
                )}
              </div>

              {/* Shortener Service Selection */}
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <span className="section-title" style={{ marginBottom: '10px' }}>SHORTENER SERVICE</span>
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

            <div className="mnx-footer">
              ccpXengine &nbsp; V 1 . 0
            </div>
          </div>
        ) : (
          <div className="mnx-card fade-in">
            <Reports />
          </div>
        )
      }

      {/* Floating Traffic Sidebar if in Generator */}
      {
        activeTab === 'generator' && (
          <div style={{ marginTop: '40px' }} className="fade-in">
            <LiveTraffic />
          </div>
        )
      }

    </div >
  )
}

export default App
