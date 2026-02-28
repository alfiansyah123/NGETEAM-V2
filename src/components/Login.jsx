import { useState, useEffect } from 'react';
import './Login.css';

const Login = ({ onLogin, teamContext }) => {
    const [username, setUsername] = useState(teamContext?.user_id || 'admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync username if teamContext loads late
    useEffect(() => {
        if (teamContext?.user_id) {
            setUsername(teamContext.user_id);
        }
    }, [teamContext]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('auth_token', result.token);
                localStorage.setItem('auth_user', username);
                if (result.role) {
                    localStorage.setItem('auth_role', result.role);
                }
                onLogin();
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-particles"></div>

            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo-wrapper">
                        <img src="/ngeteam-logo.png" alt="NGETEAM" className="login-logo" />
                    </div>
                    <p className="login-subtitle">
                        {teamContext ? `Team Portal: /t/${teamContext.user_id}` : ''}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="login-error">{error}</div>}

                    <div className="login-field">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="login-spinner"></span>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 NGE-team. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
