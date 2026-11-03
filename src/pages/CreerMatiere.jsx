import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen } from '../components/Common';
import { adminMenu } from '../utils/menus';

function CreerMatiere() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [form, setForm] = useState({
        nom: '',
        code: '',
        description: '',
        total_chapitres: '',
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/admin/matiere/creer', form);
            setMessage({ text: 'Matiere creee avec succes', type: 'success' });
            setForm({ nom: '', code: '', description: '', total_chapitres: '' });
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
            title="Nouvelle matiere"
            subtitle="Ajoutez une matiere au programme pedagogique"
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
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon name="book" size={22} />
                            </div>
                            <div>
                                <h3 className="section-title">Configuration Matière</h3>
                                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                    Définissez une nouvelle unité d'enseignement
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                <div className="field">
                                    <label className="label">Nom de la matière *</label>
                                    <input
                                        type="text"
                                        name="nom"
                                        value={form.nom}
                                        onChange={handleChange}
                                        placeholder="Ex. Algorithmique"
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label className="label">Code</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={form.code}
                                        onChange={handleChange}
                                        placeholder="Ex. ALGO-301"
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Total de chapitres prévus</label>
                                <input
                                    type="number"
                                    name="total_chapitres"
                                    value={form.total_chapitres}
                                    onChange={handleChange}
                                    placeholder="Ex. 8"
                                    className="input"
                                    min="1"
                                />
                                <p className="hint">Utilisé pour le calcul de progression automatique</p>
                            </div>

                            <div className="field">
                                <label className="label">Description du programme</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Décrivez brièvement les objectifs de cette matière..."
                                    className="textarea"
                                    rows="3"
                                />
                            </div>

                            {message.text && <MessageBox message={message} />}

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {loading ? <><div className="spinner spinner-sm" /> Création...</> : <><Icon name="plus" size={16} /> Créer la matière</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Guidance */}
                <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ padding: 24, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                        <h4 style={{ margin: '0 0 12px', color: 'var(--accent)', fontWeight: 700 }}>Pédagogie</h4>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            Une structure claire avec un nombre de chapitres défini permet aux étudiants de mieux suivre leur avancement.
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Impact Système</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--primary)' }}><Icon name="bar-chart" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                    Génère automatiquement des graphiques de progression.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--success)' }}><Icon name="clipboard-check" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                                    Permet l'assignation de professeurs spécifiques.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default CreerMatiere;
