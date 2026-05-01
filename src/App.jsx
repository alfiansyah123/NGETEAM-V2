
import { useState, useEffect } from 'react'
import './App.css'
import { fetchDomains, saveLink, batchSaveLinks, addDomain } from './services/api'
import Login from './components/Login'
import LiveTraffic from './components/LiveTraffic'
import Reports from './components/Reports'
import Admin from './components/Admin'


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState('__RANDOM__')
  const [activeTab, setActiveTab] = useState('generator')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [teamMode, setTeamMode] = useState(null) // { userId, name, targetUrl }
  const [subId, setSubId] = useState('')
  const [selectedShortener, setSelectedShortener] = useState('DEFAULT')
  const [ixSkApiKey, setIxSkApiKey] = useState(localStorage.getItem('ix_sk_api_key') || '')

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('auth_token');
      const loggedUser = localStorage.getItem('auth_user');
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);

      let authenticated = !!token;

      if (segments[0] === 't' && segments.length === 2) {
        const userIdFromUrl = segments[1];
        await loadTeamContext(userIdFromUrl);
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
      const res = await fetch(`/api/get-smartlink-by-user?user_id=${userId}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTeamMode(data.data);
        setSubId(data.data.user_id || '');
        if (data.data.target_url) {
          setTargetUrls(data.data.target_url);
        }
        if (data.data.url_trafee) {
          setUrlTrafee(data.data.url_trafee);
        }
        if (data.data.routing_mode) {
          setRoutingMode(data.data.routing_mode);
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
  const [urlTrafee, setUrlTrafee] = useState('')
  const [routingMode, setRoutingMode] = useState('random')
    
  // Auto-save Routing Mode when changed by user
  const handleRoutingChange = async (newMode) => {
      setRoutingMode(newMode);
      if (teamMode) {
          try {
              await fetch('/api/update-team-member', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      id: teamMode.id,
                      name: teamMode.name,
                      user_id: teamMode.user_id,
                      password: teamMode.password,
                      target_url: targetUrls,
                      url_trafee: urlTrafee,
                      old_user_id: teamMode.user_id,
                      routing_mode: newMode
                  })
              });
          } catch (err) {
              console.error('Failed to auto-save routing mode:', err);
          }
      }
  };
  const [useFSubdomain, setUseFSubdomain] = useState(false)

  const [domains, setDomains] = useState([])

  const [output, setOutput] = useState([])
  const [imageError, setImageError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)

  // History State
  const [history, setHistory] = useState([])

  const getIsAdmin = () => {
    const role = localStorage.getItem('auth_role');
    const user = localStorage.getItem('auth_user');
    return (role || '').toLowerCase().trim() === 'admin' ||
      (user || '').toLowerCase().trim() === 'ngeteam' ||
      (user || '').toLowerCase().trim() === 'admin';
  };


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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImg(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.data.url);
      } else {
        alert('Upload gagal: ' + (data.error || 'Server error. Pastikan bucket "images" di Supabase dibuat menjadi Public.'));
      }
    } catch (err) {
      alert('Error uploading image. Cek koneksi jaringan.');
    } finally {
      setUploadingImg(false);
      e.target.value = null;
    }
  };

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
    
    // Update iMonetizeit (click_id=)
    if (targetUrls) {
      const params = ['click_id', 'clickid', 'subid'];
      let updatedText = targetUrls;
      params.forEach(param => {
        const regex = new RegExp(`(${param}=)([^&\\s]*)`, 'gi');
        updatedText = updatedText.replace(regex, `$1${val}`);
      });
      setTargetUrls(updatedText);
    }

    // Update Trafee (track=)
    if (urlTrafee) {
      const regex = new RegExp(`(track=)([^&\\s]*)`, 'gi');
      setUrlTrafee(urlTrafee.replace(regex, `$1${val}`));
    }
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
            url_trafee: urlTrafee,
            routing_mode: routingMode,
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

        // 🔥 PRE-WARM: Paksa Facebook & Edge cache langsung scrape thumbnail
        // Ini berjalan di background, tidak menghambat UI
        fetch('/api/warm-og-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: generatedLinks })
        }).catch(() => {}); // Silent - jangan ganggu user kalau gagal
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

  const rawPath = window.location.pathname.toLowerCase().trim();
  const normalizedPath = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;
  const isAdminPage = normalizedPath === '/admin';
  const isAdmin = getIsAdmin();

  // Intelligent Redirection (Hides Global Generator)
  useEffect(() => {
    if (!isLoggedIn || normalizedPath !== '/' || teamMode) return;

    if (isAdmin) {
      window.location.href = '/admin';
    } else {
      const loggedUser = localStorage.getItem('auth_user');
      if (loggedUser) {
        window.location.href = `/t/${loggedUser}`;
      }
    }
  }, [isLoggedIn, isAdmin, normalizedPath, teamMode]);

  if (checkingAuth) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // If on admin page path, show Admin component (it has its own auth check inside)
  if (isAdminPage) {
    return <Admin />;
  }

  if (!isLoggedIn) {
    return (
      <Login
        teamContext={teamMode}
        onLogin={() => {
          setIsLoggedIn(true);
        }}
      />
    );
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
          <div className="generator-layout fade-in">
            {/* LEFT COLUMN: LINK ENGINE */}
            <div className="admin-section">
              <span className="section-label">⚡ LINK ENGINE</span>

              <div style={{ marginBottom: '20px' }}>
                <span className="section-title">ROUTING ENGINE</span>
                <div className="mnx-compact-nav">
                  <select 
                    className="mnx-input" 
                    style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(0, 242, 255, 0.2)', color: 'var(--accent-cyan)', fontWeight: 800, textAlign: 'center' }}
                    value={routingMode}
                    onChange={(e) => handleRoutingChange(e.target.value)}
                  >
                    <option value="random">RANDOM SMART</option>
                    <option value="trafee">FORCE TRAFEE</option>
                    <option value="imonetizeit">FORCE IMONETIZEIT</option>
                  </select>
                </div>
              </div>

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

              <span className="section-title">URL IMONETIZEIT (LOCKED)</span>
              <div className="mnx-input-group target-url-group">
                <div className="mnx-input-prepend" style={{ height: 'auto', alignSelf: 'stretch', display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  LOCKED
                </div>
                <textarea
                  className="mnx-input"
                  style={{ minHeight: '80px', background: 'transparent' }}
                  value={targetUrls}
                  onChange={(e) => !teamMode && setTargetUrls(e.target.value)}
                  readOnly={!!teamMode}
                />
              </div>

              <span className="section-title">URL TRAFEE (LOCKED)</span>
              <div className="mnx-input-group target-url-group">
                <div className="mnx-input-prepend" style={{ height: 'auto', alignSelf: 'stretch', display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  LOCKED
                </div>
                <textarea
                  className="mnx-input"
                  style={{ minHeight: '80px', background: 'transparent' }}
                  value={urlTrafee}
                  onChange={(e) => !teamMode && setUrlTrafee(e.target.value)}
                  readOnly={!!teamMode}
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

              <div className="mnx-grid" style={{ marginTop: '20px' }}>
                <button
                  className={`secondary-glass-btn ${useFSubdomain ? 'active' : ''}`}
                  style={{ height: '50px' }}
                  onClick={() => setUseFSubdomain(!useFSubdomain)}
                >
                  F-SUB: {useFSubdomain ? 'ON' : 'OFF'}
                </button>
                <button className="btn-mnx-main" onClick={generateLinks} disabled={loading} style={{ height: '50px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
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
                      <div key={idx} className="mnx-output-item" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.85rem' }}>{link}</span>
                        <svg onClick={() => { navigator.clipboard.writeText(link); alert('Copied!'); }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: 'pointer' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button className="btn-mnx-main" style={{ flexGrow: 1, height: '40px', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }} onClick={copyAll}>
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
                      background: 'var(--surface-color)',
                      border: '1px solid var(--accent-cyan)',
                      borderRadius: '12px',
                      width: '42px',
                      height: '42px',
                      marginLeft: '8px',
                      flexShrink: 0,
                      boxShadow: '0 0 10px rgba(6, 182, 212, 0.1)'
                    }}
                  >
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImg} />
                    {uploadingImg ? (
                      <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
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

      <div className="mnx-footer">
        ccpXengine &nbsp; V 2 . 0 &nbsp; AERO
      </div>

    </div >
  )
}

export default App
