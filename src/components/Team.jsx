import { useState, useEffect } from 'react';
import './Team.css';

const Team = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [userId, setUserId] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/get-team');
            const data = await res.json();
            if (data.success) {
                setTeam(data.team || []);
            }
        } catch (err) {
            console.error('Failed to fetch team:', err);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!name || !userId) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/add-team-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, user_id: userId })
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Member added successfully!' });
                setName('');
                setUserId('');
                fetchTeam();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this member?')) return;

        try {
            const res = await fetch('/api/delete-team-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                fetchTeam();
            }
        } catch (err) {
            console.error('Failed to delete member:', err);
        }
    };

    return (
        <div className="team-container fade-in">
            <div className="team-grid">
                {/* List Section */}
                <div className="team-list-section">
                    <h3 className="mnx-section-title">TEAM MEMBERS <span className="mnx-badge">{team.length}</span></h3>
                    <div className="team-members-list">
                        {team.length === 0 ? (
                            <div className="mnx-card" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                No team members yet.
                            </div>
                        ) : (
                            team.map(member => (
                                <div key={member.id} className="team-member-card">
                                    <div className="member-info">
                                        <h4>{member.name}</h4>
                                        <p>ID: {member.user_id}</p>
                                    </div>
                                    <button className="delete-btn" onClick={() => handleDelete(member.id)}>
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Add Section */}
                <div className="team-add-section">
                    <div className="add-member-form">
                        <h3>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                            ADD NEW MEMBER
                        </h3>
                        {message.text && (
                            <div className={`mnx-alert ${message.type === 'success' ? 'mnx-alert-success' : 'mnx-alert-error'}`}>
                                {message.text}
                            </div>
                        )}
                        <form onSubmit={handleAddMember}>
                            <div className="form-group">
                                <label>Member Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>User ID / Team Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. john123"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'ADDING...' : 'ADD TO TEAM'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Team;
