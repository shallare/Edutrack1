import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen } from '../components/Common';
import { adminMenu } from '../utils/menus';

function CreerEnseignant() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [form, setForm] = useState({
        nom_complet: '',
        email: '',
        mot_de_passe: '',
        telephone: '',
    });
    const [showPassword, setShowPassword] = useState(false);
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
            await api.post('/admin/enseignant/creer', form);
            setMessage({
                text: 'Enseignant cree avec succes. Il peut maintenant se connecter.',
                type: 'success',
            });
            setForm({ nom_complet: '', email: '', mot_de_passe: '', telephone: '' });
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
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
            title="Creer un enseignant"
            subtitle="Ajoutez un nouveau professeur au systeme"
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
                                background: 'var(--primary-soft)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon name="user-plus" size={22} />
                            </div>
                            <div>
                                <h3 className="section-title">Nouveau Professeur</h3>
                                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                    Remplissez les informations pour créer le compte
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div className="field">
                                <label className="label">Nom complet *</label>
                                <input
                                    type="text"
                                    name="nom_complet"
                                    value={form.nom_complet}
                                    onChange={handleChange}
                                    placeholder="Prénom Nom"
                                    className="input"
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                <div className="field">
                                    <label className="label">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="prof@wiico.com"
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label className="label">Téléphone</label>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        value={form.telephone}
                                        onChange={handleChange}
                                        placeholder="+229 XX XX XX XX"
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Mot de passe *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="mot_de_passe"
                                        value={form.mot_de_passe}
                                        onChange={handleChange}
                                        placeholder="Min. 6 caractères"
                                        className="input"
                                        style={{ paddingRight: 48 }}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%',
                                            transform: 'translateY(-50%)', background: 'none',
                                            border: 'none', color: 'var(--text-muted)',
                                            padding: 6, display: 'flex', alignItems: 'center',
                                        }}
                                    >
                                        <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                                    </button>
                                </div>
                                <p className="hint">Le professeur pourra changer son mot de passe plus tard</p>
                            </div>

                            {message.text && <MessageBox message={message} />}

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/dashboard')}
                                    className="btn btn-secondary"
                                >
                                    Annuler
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {loading ? <><div className="spinner spinner-sm" /> Création...</> : <><Icon name="check" size={16} /> Enregistrer l'enseignant</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Guidance & Stats */}
                <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ padding: 24, background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
                        <h4 style={{ margin: '0 0 12px', color: 'var(--primary)', fontWeight: 700 }}>Conseils</h4>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li style={{ fontSize: 13, display: 'flex', gap: 10 }}>
                                <Icon name="info" size={16} color="var(--primary)" />
                                <span>Utilisez une adresse email professionnelle.</span>
                            </li>
                            <li style={{ fontSize: 13, display: 'flex', gap: 10 }}>
                                <Icon name="shield" size={16} color="var(--primary)" />
                                <span>Le mot de passe doit être sécurisé (6+ car.).</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Rôles & Permissions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ padding: 12, borderRadius: 12, background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}>
                                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>Validation de cours</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Peut valider les entrées du cahier de texte des délégués.</p>
                            </div>
                            <div style={{ padding: 12, borderRadius: 12, background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}>
                                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>Statistiques</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Accès aux rapports de présence pour ses matières.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default CreerEnseignant;
