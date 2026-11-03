import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen } from '../components/Common';
import { adminMenu } from '../utils/menus';

function CreerClasse() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [nom, setNom] = useState('');
    const [annee, setAnnee] = useState('2025-2026');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/admin/classe/creer', { nom, annee_academique: annee });
            setMessage({ text: 'Classe creee avec succes', type: 'success' });
            setNom('');
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            const errMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(', ')
                : error.response?.data?.message || 'Erreur lors de la creation';
            setMessage({ text: errMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!ready) return <LoadingScreen />;

    return (
        <Layout
            user={user}
            role="admin"
            menuItems={adminMenu()}
            title="Creer une classe"
            subtitle="Ajoutez une nouvelle classe academique"
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Left Column: Form */}
                <div style={{ flex: '1 1 60%', minWidth: 0 }}>
                    <div className="glass-card" style={{ padding: 32 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            marginBottom: 24,
                            paddingBottom: 18,
                            borderBottom: '1px solid var(--glass-border)',
                        }}>
                            <div style={{
                                width: 44, height: 44,
                                borderRadius: 12,
                                background: 'var(--success-soft)',
                                color: 'var(--success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon name="building" size={22} />
                            </div>
                            <div>
                                <h3 className="section-title">Structure Académique</h3>
                                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                    Créez une nouvelle division pédagogique
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div className="field">
                                <label className="label">Nom de la classe *</label>
                                <input
                                    type="text"
                                    value={nom}
                                    onChange={(e) => setNom(e.target.value)}
                                    placeholder="Ex. SIL3, MIAGE2, GL1..."
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="field">
                                <label className="label">Année académique *</label>
                                <input
                                    type="text"
                                    value={annee}
                                    onChange={(e) => setAnnee(e.target.value)}
                                    placeholder="2025-2026"
                                    className="input"
                                    required
                                />
                            </div>

                            {message.text && <MessageBox message={message} />}

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {loading ? <><div className="spinner spinner-sm" /> Création...</> : <><Icon name="plus" size={16} /> Créer la classe</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Guidance */}
                <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ padding: 24, background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
                        <h4 style={{ margin: '0 0 12px', color: 'var(--success)', fontWeight: 700 }}>Prochaine étape</h4>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            Après avoir créé la classe, rendez-vous dans la <strong>Gestion des classes</strong> pour y inscrire des étudiants.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Organisation</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--warning)' }}><Icon name="users" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                    Chaque classe doit avoir au moins un délégué nommé.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--info)' }}><Icon name="book" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                    Associez ensuite les matières via le module d'assignation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default CreerClasse;
