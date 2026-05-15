import { useState, useEffect, useMemo } from 'react';
import './LiveTraffic.css';
import androidIcon from '../assets/android-icon.png';
import appleIcon from '../assets/apple-icon.png';
import windowsIcon from '../assets/windows-icon.png';
// Live traffic component using API

const LiveTraffic = () => {
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClicks = async () => {
        console.log('Fetching clicks...'); // DEBUG
        try {
            const response = await fetch('/api/get-recent-clicks');
            console.log('Fetch response status:', response.status); // DEBUG
            if (response.ok) {
                const data = await response.json();
                console.log('Fetch data:', data); // DEBUG
                setClicks(data.clicks || []);
            } else {
                console.error('Fetch failed with status:', response.status);
            }
        } catch (err) {
            console.error('Failed to fetch clicks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('LiveTraffic mounted'); // DEBUG
        fetchClicks();

        // Polling Strategy (Save Supabase Realtime Quota)
        // Fetches new clicks every 60 seconds instead of realtime broadcast.
        const interval = setInterval(() => {
            fetchClicks();
        }, 10000); // Update every 10 seconds for "Live" feel

        return () => {
            clearInterval(interval);
        };
    }, []);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const getCountryFlag = (country) => {
        if (!country || country === 'XX') {
            return <span style={{ fontSize: '1.2rem' }}>🌍</span>;
        }
        return (
            <img
                src={`https://flagcdn.com/w80/${country.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/w160/${country.toLowerCase()}.png 2x`}
                alt={country}
                className="flag-img"
                onError={(e) => { e.target.outerHTML = '<span style="font-size:1.2rem">🌍</span>'; }}
            />
        );
    };

    const getOSIcon = (os) => {
        const iconStyle = { width: '16px', height: '16px', verticalAlign: 'middle' };

        switch (os) {
            case 'iOS':
            case 'macOS':
                return <img src={appleIcon} alt={os} style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
            case 'Windows':
            case 'Windows Phone':
                return <img src={windowsIcon} alt={os} style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
            case 'Android':
                return <img src={androidIcon} alt="Android" style={{ width: '16px', height: '16px', verticalAlign: 'middle' }} />;
            case 'Linux':
                return <svg style={iconStyle} viewBox="0 0 512 512" fill="currentColor"><path d="M512 32c0 17.7-14.3 32-32 32H32C14.3 64 0 49.7 0 32S14.3 0 32 0h448c17.7 0 32 14.3 32 32zm0 32v96H0V64h512zm0 128v224H0V192h512z" /></svg>; // Terminal icon for generic *nix
            default:
                return <svg style={iconStyle} viewBox="0 0 512 512" fill="currentColor"><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" /></svg>;
        } // End getOSIcon
    };

    const getBrowserIcon = (browser) => {
        const iconStyle = { width: '16px', height: '16px', verticalAlign: 'middle', marginLeft: '5px' };
        // Simple SVG icons for common browsers/apps
        const icons = {
            'Facebook': <svg style={{ ...iconStyle, color: '#1877F2' }} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
            'Instagram': <svg style={{ ...iconStyle, color: '#E1306C' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
            'TikTok': <svg style={{ ...iconStyle, color: 'var(--text-primary)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.03 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>,
            'Chrome': <svg style={{ ...iconStyle, color: '#4285F4' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm0 4.154c1.927 0 3.692.68 5.097 1.82L15.355 9.17c-.85-.596-1.875-.95-2.986-.95-2.9 0-5.32 1.99-6.077 4.708H2.435C3.39 7.426 7.338 4.154 12 4.154zm0 15.692c-2.368 0-4.47-1.054-5.922-2.73l3.65-6.32c.22.89.87 1.62 1.72 2.05l-3.33 5.772c1.17.78 2.56 1.228 4.052 1.228 4.23 0 7.747-3.13 8.355-7.23h3.81c-.69 6.27-6.02 11.23-12.335 11.23zm7.077-8.308c-.225 3.32-2.26 6.088-5.077 7.45l-3.65-6.32c.596-.34 1.085-.83 1.425-1.425l6.73 3.882c.35-1.14.572-2.35.572-3.587 0-1.87-.52-3.63-1.42-5.17l-3.75 6.49c.65 1.135 1.05 2.457 1.05 3.86z" /></svg>,
            'Safari': <svg style={{ ...iconStyle, color: '#00A4E4' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.6c-5.302 0-9.6-4.298-9.6-9.6s4.298-9.6 9.6-9.6 9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6zm1.146-13.854l-5.694 10.392 10.392-5.694-4.698-4.698zm-1.05 6.648l-1.698 3.102 3.102-1.698-1.404-1.404z" /></svg>,
            'Firefox': <svg style={{ ...iconStyle, color: '#FF7139' }} viewBox="0 0 24 24" fill="currentColor"><path d="M22.42 8.78c-1.55-2.304-4.05-3.32-6.525-2.65-.632-1.291-1.611-2.903-3.081-3.682 3.067-.552 4.417 2.025 4.305 2.502 0 0 .19-1.252-1.294-3.483-2.613-3.68-7.781-1.077-7.781-1.077s.824 1.166.529 3.968c-4.212 1.458-5.319 5.867-5.39 6.208 0 0-.27 2.148 1.442 3.904.582.597 1.637.896 1.637.896s-.686-.427-1.396-1.574c-.71-1.149-.661-2.9.229-4.265.89-1.365 3.321-2.228 4.226-2.073-.787 2.721 1.264 4.544 2.809 6.376-2.193.364-4.133 1.815-4.496 4.771-.069.566.216.732.216.732s.672-2.363 3.652-1.841c.205 1.503 2.1 3.208 4.881 2.457 2.783-.751 3.238-2.67 3.238-2.67s1.396.223 1.936-.884c.54-1.107-.638-1.574-.638-1.574s2.449-2.126 1.101-5.716z" /></svg>,
            'Unknown': <span>❓</span>
        };
        return icons[browser] || <span style={{ ...iconStyle, fontSize: '12px' }}>🌐</span>;
    };

    if (loading) {
        return (
            <div className="live-traffic">
                <div className="live-traffic-header">
                    <span className="live-dot"></span>
                    <h3>Live Traffic</h3>
                </div>
                <div className="traffic-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="live-traffic">
            <div className="live-traffic-header">
                <span className="live-dot"></span>
                <h3>Live Traffic</h3>
                <span className="traffic-count">{clicks.length} recent</span>
            </div>

            <div className="traffic-list">
                {clicks.length === 0 ? (
                    <div className="no-traffic">No traffic yet</div>
                ) : (
                    clicks.map((click) => (
                        <div
                            key={click.id}
                            className="traffic-item"
                        >
                            <div className="traffic-icons">
                                <span className="traffic-flag">{getCountryFlag(click.country)}</span>
                                <span className="traffic-os" title={click.os}>{getOSIcon(click.os)}</span>
                                <span className="traffic-browser" title={click.browser}>{getBrowserIcon(click.browser)}</span>
                            </div>
                            <div className="traffic-info">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="traffic-slug" title={click.clickId || click.slug}>
                                      {click.clickId
                                          ? (click.clickId.length > 15 ? click.clickId.substring(0, 15) + '...' : click.clickId)
                                          : `/${click.slug}`}
                                    </span>
                                </div>
                                <div className="traffic-meta">
                                    <span className="traffic-ip">{click.ip_address || click.ip}</span>
                                    <span className="traffic-time">{formatTime(click.created_at || click.time)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
};

export default LiveTraffic;
