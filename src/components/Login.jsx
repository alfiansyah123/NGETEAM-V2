import { useState, useEffect } from 'react';
import './Login.css';

const Login = ({ onLogin, teamContext }) => {
    const [username, setUsername] = useState(teamContext?.user_id || '');
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
                    <h1 className="login-title">
                        {teamContext ? teamContext.name : 'NGE-team'}
                    </h1>
                    <p className="login-subtitle">
                        {teamContext ? `Team Portal: /t/${teamContext.user_id}` : 'Premium Link Generator'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="login-error">{error}</div>}

                    {/* Only show username for non-team login */}
                    {!teamContext && (
                        <div className="login-field">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                                autoComplete="username"
                            />
                        </div>
                    )}

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
                    <p>© 2025 NGE-team. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
