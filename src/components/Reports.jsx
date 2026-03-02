import { useState, useEffect } from 'react';
import './Reports.css';
import androidIcon from '../assets/android-icon.png';
import appleIcon from '../assets/apple-icon.png';
import windowsIcon from '../assets/windows-icon.png';

const Reports = () => {
    const [period, setPeriod] = useState('today');
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async (selectedPeriod) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/get-clicks-report?period=${selectedPeriod}`);
            if (response.ok) {
                const data = await response.json();
                setClicks(data.clicks || []);
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(period);
    }, [period]);

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const getCountryFlag = (country) => {
        if (!country || country === 'XX') {
            return <span style={{ fontSize: '1.2rem' }}>🌍</span>;
        }
        return (
            <img
                src={`https://flagcdn.com/24x18/${country.toLowerCase()}.png`}
                alt={country}
                style={{ width: '24px', height: '18px', borderRadius: '2px', verticalAlign: 'middle' }}
                onError={(e) => { e.target.style.display = 'none'; }}
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
                return <svg style={iconStyle} viewBox="0 0 512 512" fill="currentColor"><path d="M512 32c0 17.7-14.3 32-32 32H32C14.3 64 0 49.7 0 32S14.3 0 32 0h448c17.7 0 32 14.3 32 32zm0 32v96H0V64h512zm0 128v224H0V192h512z" /></svg>;
            default:
                return <svg style={iconStyle} viewBox="0 0 512 512" fill="currentColor"><path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" /></svg>;
        }
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Traffic Reports</h2>
                <div className="period-filters">
                    {['today', 'yesterday'].map((p) => (
                        <button
                            key={p}
                            className={`filter-btn ${period === p ? 'active' : ''}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="reports-card">
                {loading ? (
                    <div className="loading-state">Loading data...</div>
                ) : clicks.length === 0 ? (
                    <div className="empty-state">No data found for this period</div>
                ) : (
                    <div className="table-responsive">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Click ID</th>
                                    <th>Country</th>
                                    <th>OS</th>
                                    <th>Browser</th>
                                    <th>IP Address</th>
                                    <th>Target URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clicks.map((click) => (
                                    <tr key={click.id}>
                                        <td>{formatTime(click.time)}</td>
                                        <td className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{click.clickId || '-'}</td>
                                        <td>
                                            <div className="flex-center">
                                                {getCountryFlag(click.country)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-center">
                                                {getOSIcon(click.os)}
                                                <span className="ml-2">{click.os}</span>
                                            </div>
                                        </td>
                                        <td>{click.browser || '-'}</td>
                                        <td className="mono">{click.ip}</td>
                                        <td className="url-cell" title={click.originalUrl}>{click.originalUrl}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
