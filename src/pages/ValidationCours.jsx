import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { LoadingScreen, useAuth, MessageBox, Empty, StatCard } from '../components/Common';
import { teacherMenu } from '../utils/menus';

function ValidationCours() {
    const { user, ready } = useAuth('enseignant', '/enseignant/login');
    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [validatingId, setValidatingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!ready) return;
        fetchCours();
    }, [ready]);

    const fetchCours = async () => {
        try {
            const res = await api.get('/enseignant/cours');
            setCours(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleValider = async (id) => {
        setValidatingId(id);
        setMessage({ text: '', type: '' });
        try {
            await api.put(`/cours/${id}/valider`, {});
            setMessage({ text: 'Cours valide avec succes', type: 'success' });
            fetchCours();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (e) {
            setMessage({ text: 'Erreur lors de la validation', type: 'error' });
        } finally {
            setValidatingId(null);
        }
    };

    if (!ready || loading) return <LoadingScreen text="Chargement des cours..." />;

    const coursAValider = cours.filter(c => c.statut !== 'valide');
    const coursValides = cours.filter(c => c.statut === 'valide');

    return (
        <Layout
            user={user}
            role="enseignant"
            menuItems={teacherMenu()}
            title="Validation du cahier de texte"
            subtitle="Signez les séances de cours soumises par vos délégués"
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Main Column */}
                <div style={{ flex: '1 1 65%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Banner */}
                    <div style={{
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--info) 0%, var(--info-soft) 100%)',
                        borderRadius: 'var(--radius-xl)', padding: '32px 36px', color: '#fff',
                        boxShadow: 'var(--shadow-glow-info)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h2 style={{ fontSize: 24, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Validation Pédagogique</h2>
                            <p style={{ opacity: 0.9, maxWidth: '480px', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                                {coursAValider.length > 0 
                                    ? `Vous avez ${coursAValider.length} cours qui attendent votre signature numérique.` 
                                    : 'Tous les cahiers de texte de vos classes sont à jour et validés.'}
                            </p>
                        </div>
                        <Icon name="signature" size={120} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: 20, bottom: -20, zIndex: 1 }} />
                    </div>

                    {message.text && <MessageBox message={message} />}

                    {/* Section: A Valider */}
                    {coursAValider.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="section-title">Cours en attente</h3>
                                <div className="pill pill-warning">{coursAValider.length} à signer</div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                                {coursAValider.map(c => {
                                    const expanded = expandedId === c.id;
                                    return (
                                        <div key={c.id} className="glass-card interactive" style={{ padding: 22, borderRadius: 'var(--radius-xl)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Icon name="calendar" size={13} />
                                                    {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <span className={`pill ${c.statut === 'soumis' ? 'pill-warning' : 'pill-info'}`}>
                                                    {c.statut === 'soumis' ? 'Soumis' : 'Renvoyé'}
                                                </span>
                                            </div>

                                            <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>{c.matiere?.nom}</h4>
                                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Classe: {c.classe?.nom}</p>

                                            <div style={{ padding: 12, background: 'var(--glass-bg-light)', borderRadius: 12, marginBottom: 16 }}>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Chapitre {c.numero_chapitre}</div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.titre_chapitre}</div>
                                            </div>

                                            {c.resume && (
                                                <div style={{ marginBottom: 20 }}>
                                                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                                        {expanded ? c.resume : (c.resume.length > 100 ? c.resume.substring(0, 100) + '...' : c.resume)}
                                                    </p>
                                                    {c.resume.length > 100 && (
                                                        <button onClick={() => setExpandedId(expanded ? null : c.id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 11.5, fontWeight: 600, marginTop: 6, cursor: 'pointer' }}>
                                                            {expanded ? 'Réduire' : 'Voir tout'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleValider(c.id)}
                                                disabled={validatingId === c.id}
                                                className="btn btn-primary btn-block"
                                                style={{ borderRadius: 12 }}
                                            >
                                                {validatingId === c.id ? 'Signature...' : <><Icon name="signature" size={15} /> Signer le cours</>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: 40 }}>
                             <Empty icon="check-circle" title="Excellent travail" description="Tous vos cours sont validés pour le moment." />
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div style={{ flex: '1 1 30%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Summary Stats */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Aperçu Global</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div style={{ padding: 16, background: 'var(--glass-bg-light)', borderRadius: 16, textAlign: 'center' }}>
                                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--warning)' }}>{coursAValider.length}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>En attente</p>
                            </div>
                            <div style={{ padding: 16, background: 'var(--glass-bg-light)', borderRadius: 16, textAlign: 'center' }}>
                                <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--success)' }}>{coursValides.length}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Validés</p>
                            </div>
                        </div>
                    </div>

                    {/* History table simplified */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Dernières validations</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {coursValides.slice(0, 5).map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name="check" size={16} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.matiere?.nom}</p>
                                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{new Date(c.date).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            ))}
                            {coursValides.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Aucun historique</p>}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default ValidationCours;
