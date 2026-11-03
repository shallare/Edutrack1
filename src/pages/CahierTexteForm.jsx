import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen } from '../components/Common';
import { studentMenu } from '../utils/menus';

function CahierTexteForm() {
    const { user, ready } = useAuth(['delegue', 'etudiant'], '/etudiant/login');
    const [matieres, setMatieres] = useState([]);
    const [classes, setClasses] = useState([]);
    const [form, setForm] = useState({
        matiere_id: '',
        classe_id: '',
        date: new Date().toISOString().split('T')[0],
        heure_debut: '',
        heure_fin: '',
        titre_chapitre: '',
        numero_chapitre: '',
        resume: '',
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!ready) return;
        const fetchData = async () => {
            try {
                const [mat, cla] = await Promise.all([
                    api.get('/admin/matieres'),
                    api.get('/admin/classes'),
                ]);
                setMatieres(mat.data);
                setClasses(cla.data);
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, [ready]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/cours/creer', form);
            setMessage({
                text: 'Cours ajoute. En attente de validation par le professeur.',
                type: 'success',
            });
            setForm({
                ...form,
                heure_debut: '',
                heure_fin: '',
                titre_chapitre: '',
                numero_chapitre: '',
                resume: '',
            });
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        } catch (error) {
            const errMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(', ')
                : error.response?.data?.message || 'Erreur lors de l\'enregistrement';
            setMessage({ text: errMsg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!ready) return <LoadingScreen />;

    return (
        <Layout
            user={user}
            role={user?.role}
            menuItems={studentMenu(user?.role === 'delegue')}
            title="Remplir le cahier de texte"
            subtitle="Enregistrez le deroule de la seance de cours"
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Left Column (Main Form) */}
                <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
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
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon name="edit" size={22} />
                            </div>
                            <div>
                                <h3 className="section-title">Nouvelle séance</h3>
                                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                    Enregistrez les détails du cours d'aujourd'hui
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                <div className="field">
                                    <label className="label">Matière *</label>
                                    <select name="matiere_id" value={form.matiere_id} onChange={handleChange} className="select" required>
                                        <option value="">Sélectionner...</option>
                                        {matieres.map(m => (
                                            <option key={m.id} value={m.id}>{m.nom} {m.code ? `(${m.code})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label className="label">Classe *</label>
                                    <select name="classe_id" value={form.classe_id} onChange={handleChange} className="select" required>
                                        <option value="">Sélectionner...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                                <div className="field">
                                    <label className="label">Date *</label>
                                    <input type="date" name="date" value={form.date} onChange={handleChange} className="input" required />
                                </div>
                                <div className="field">
                                    <label className="label">Heure début</label>
                                    <input type="time" name="heure_debut" value={form.heure_debut} onChange={handleChange} className="input" />
                                </div>
                                <div className="field">
                                    <label className="label">Heure fin</label>
                                    <input type="time" name="heure_fin" value={form.heure_fin} onChange={handleChange} className="input" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
                                <div className="field">
                                    <label className="label">N° chapitre</label>
                                    <input
                                        type="number"
                                        name="numero_chapitre"
                                        value={form.numero_chapitre}
                                        onChange={handleChange}
                                        placeholder="Ex. 3"
                                        className="input"
                                        min="1"
                                    />
                                </div>
                                <div className="field">
                                    <label className="label">Titre du chapitre *</label>
                                    <input
                                        type="text"
                                        name="titre_chapitre"
                                        value={form.titre_chapitre}
                                        onChange={handleChange}
                                        placeholder="Ex. Les structures de données"
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="label">Résumé de la séance *</label>
                                <textarea
                                    name="resume"
                                    value={form.resume}
                                    onChange={handleChange}
                                    placeholder="Décrivez ce qui a été vu en classe : notions abordées, exercices, applications..."
                                    className="textarea"
                                    rows="6"
                                    required
                                />
                            </div>

                            {message.text && <MessageBox message={message} />}

                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                                    {loading ? (
                                        <><div className="spinner spinner-sm" /> Envoi...</>
                                    ) : (
                                        <><Icon name="send" size={15} /> Envoyer au professeur</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div style={{ flex: '1 1 30%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Instructions Card */}
                    <div className="glass-card" style={{ padding: 24, background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 16 }}>Instructions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--primary)' }}><Icon name="info" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    Le cahier de texte permet de garder une trace officielle de l'avancement pédagogique.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--warning)' }}><Icon name="alert-circle" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    Assurez-vous que les heures et les titres correspondent exactement au cours dispensé.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ color: 'var(--success)' }}><Icon name="check-circle" size={18} /></div>
                                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    Une fois envoyé, le professeur devra valider votre saisie pour qu'elle soit visible par tous.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Widget */}
                    <div className="glass-card" style={{ padding: 24, border: '1px dashed var(--glass-border)', background: 'transparent' }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 16, color: 'var(--text-muted)' }}>Aperçu Rapide</h3>
                        <div style={{ padding: 16, borderRadius: 12, background: 'var(--glass-bg-light)' }}>
                            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>{form.titre_chapitre || 'Titre du chapitre...'}</p>
                            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {form.resume || 'Le résumé s\'affichera ici...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default CahierTexteForm;
