import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { LoadingScreen, useAuth, StatCard, Empty, MessageBox } from '../components/Common';
import { teacherMenu } from '../utils/menus';

/* Sous-composant : carte d'evaluation pour un cours */
function EvaluationCard({ cours }) {
    const [evaluations, setEvaluations] = useState(null);
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggle = async () => {
        if (!show && !evaluations) {
            setLoading(true);
            try {
                const res = await api.get(`/cours/${cours.id}/evaluations`);
                setEvaluations(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        setShow(!show);
    };

    const stars = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: '0 0 4px',
                    }}>
                        {cours.matiere?.nom || '—'}
                    </h4>
                    <p style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {cours.titre_chapitre} <span style={{ opacity: 0.5 }}>·</span> {cours.classe?.nom}
                    </p>
                </div>
                <button onClick={toggle} className="btn btn-sm btn-secondary">
                    {show ? <><Icon name="eye-off" size={13} /> Masquer</> : <><Icon name="eye" size={13} /> Voir</>}
                </button>
            </div>

            {show && (
                <div style={{
                    padding: '18px 20px',
                    borderTop: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.15)',
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                            <div className="spinner spinner-sm" style={{ margin: '0 auto' }} />
                        </div>
                    ) : evaluations ? (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                                gap: 12,
                                marginBottom: evaluations.evaluations?.filter(e => e.commentaire).length > 0 ? 16 : 0,
                            }}>
                                {[
                                    { label: 'Clarte', value: evaluations.moyennes?.clarte },
                                    { label: 'Contenu', value: evaluations.moyennes?.contenu },
                                    { label: 'Supports', value: evaluations.moyennes?.supports },
                                    { label: 'Avis', value: evaluations.moyennes?.total_evaluations, isCount: true },
                                ].map(s => (
                                    <div key={s.label} style={{
                                        background: 'var(--glass-bg-light)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 10,
                                        padding: 12,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{
                                            fontSize: 22,
                                            fontWeight: 700,
                                            color: 'var(--accent)',
                                            fontFamily: 'var(--font-display)',
                                        }}>
                                            {s.value || 0}
                                        </div>
                                        <div style={{
                                            fontSize: 10.5,
                                            color: 'var(--text-muted)',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.6,
                                            marginTop: 3,
                                        }}>{s.label}</div>
                                        {!s.isCount && s.value > 0 && (
                                            <div style={{ color: 'var(--accent)', fontSize: 12, marginTop: 4 }}>
                                                {stars(s.value)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {evaluations.evaluations?.filter(e => e.commentaire).length > 0 && (
                                <div>
                                    <p style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.6,
                                        margin: '0 0 10px',
                                    }}>Commentaires anonymes</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {evaluations.evaluations.filter(e => e.commentaire).map((e, i) => (
                                            <div key={i} style={{
                                                padding: '10px 14px',
                                                background: 'var(--glass-bg-light)',
                                                borderLeft: '3px solid var(--accent)',
                                                borderRadius: '0 10px 10px 0',
                                                fontSize: 13,
                                                fontStyle: 'italic',
                                                color: 'var(--text-secondary)',
                                            }}>
                                                « {e.commentaire} »
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!evaluations.evaluations || evaluations.evaluations.length === 0) && (
                                <p style={{
                                    fontSize: 13,
                                    color: 'var(--text-muted)',
                                    textAlign: 'center',
                                    margin: 0,
                                    fontStyle: 'italic',
                                }}>
                                    Aucune evaluation pour ce cours
                                </p>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function TeacherDashboard() {
    const { user, ready } = useAuth('enseignant', '/enseignant/login');
    const [cours, setCours] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!ready) return;
        const fetchCours = async () => {
            try {
                const res = await api.get('/enseignant/cours');
                setCours(res.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchCours();
    }, [ready]);

    if (!ready || loading) return <LoadingScreen text="Chargement de votre espace..." />;

    const stats = {
        enAttente: cours.filter(c => c.statut === 'soumis').length,
        valides:   cours.filter(c => c.statut === 'valide').length,
        corriges:  cours.filter(c => c.statut === 'corrige').length,
        total:     cours.length,
    };

    const coursValides = cours.filter(c => c.statut === 'valide');

    return (
        <Layout
            user={user}
            role="enseignant"
            menuItems={teacherMenu()}
            title="Espace Enseignant"
            subtitle={`Bienvenue, ${user?.nom_complet}`}
            actions={stats.enAttente > 0 ? (
                <button
                    onClick={() => navigate('/enseignant/validation')}
                    className="pill pill-warning"
                    style={{ cursor: 'pointer', border: '1px solid rgba(251, 191, 36, 0.3)' }}
                >
                    <Icon name="alert" size={12} />
                    {stats.enAttente} cours a valider
                </button>
            ) : null}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Left Column (Main) */}
                <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
                    {/* Banner */}
                    <div style={{
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)',
                        borderRadius: 'var(--radius-xl)', padding: '36px 40px', color: '#fff',
                        boxShadow: 'var(--shadow-glow-accent)'
                    }}>
                        <h2 style={{ fontSize: 28, margin: '0 0 12px', fontFamily: 'var(--font-display)', zIndex: 2, position: 'relative' }}>
                            Bonjour {user?.nom_complet?.split(' ')[0] || 'Professeur'}
                        </h2>
                        <p style={{ opacity: 0.9, maxWidth: '60%', margin: '0 0 20px', lineHeight: 1.5, zIndex: 2, position: 'relative', fontSize: 15 }}>
                            {stats.enAttente > 0 
                                ? `Vous avez ${stats.enAttente} cours en attente de validation. Vérifiez les séances saisies par vos délégués.` 
                                : `Bienvenue sur votre espace enseignant. Tout est à jour aujourd'hui !`}
                        </p>
                        <button onClick={() => navigate('/enseignant/validation')} style={{
                            background: 'white', color: 'var(--accent-strong)', border: 'none',
                            padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 600,
                            cursor: 'pointer', zIndex: 2, position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            Valider les cours
                            <Icon name="arrow-right" size={16} />
                        </button>
                        
                        {/* Banner Decorations */}
                        <div style={{
                            position: 'absolute', right: '-10%', bottom: '-20%',
                            width: 300, height: 300, background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
                            zIndex: 1
                        }} />
                        <div style={{
                            position: 'absolute', right: '5%', bottom: '15%', zIndex: 1, opacity: 0.9,
                            background: 'rgba(255,255,255,0.15)', padding: 16, borderRadius: '24px',
                            backdropFilter: 'blur(10px)', display: 'flex', gap: 16, transform: 'rotate(-5deg)'
                        }}>
                            <Icon name="chalkboard" size={80} color="white" />
                            <Icon name="clipboard-check" size={80} color="white" />
                        </div>
                    </div>

                    {/* Aperçu Global (Cards) */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 className="section-title">Aperçu Pédagogique</h3>
                        </div>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                            gap: 16 
                        }}>
                            {[
                                { icon: 'clock', color: '#f59e0b', title: 'À valider', count: stats.enAttente, sub: 'Soumis' },
                                { icon: 'check-circle', color: '#10b981', title: 'Validés', count: stats.valides, sub: 'Signés' },
                                { icon: 'edit', color: '#3b82f6', title: 'Renvoyés', count: stats.corriges, sub: 'À corriger' },
                                { icon: 'book', color: '#6366f1', title: 'Total', count: stats.total, sub: 'Cours' }
                            ].map((stat, i) => (
                                <div key={i} className="glass-card interactive" style={{
                                    padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    textAlign: 'center', gap: 14, borderRadius: 'var(--radius-xl)'
                                }}>
                                    <div style={{
                                        width: 54, height: 54, borderRadius: 18,
                                        background: stat.color,
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 8px 16px ${stat.color}40`
                                    }}>
                                        <Icon name={stat.icon} size={26} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.title}</h4>
                                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>({stat.count} {stat.sub})</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Evaluations cours validés */}
                    <div className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <div>
                                <h3 className="section-title">Évaluations des étudiants</h3>
                            </div>
                            <span className="pill pill-accent">
                                <Icon name="star" size={11} />
                                {coursValides.length} Cours
                            </span>
                        </div>

                        {coursValides.length === 0 ? (
                            <Empty
                                icon="star"
                                title="Aucun cours validé"
                                description="Les retours des étudiants apparaitront ici une fois vos cours validés"
                            />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {coursValides.map(c => <EvaluationCard key={c.id} cours={c} />)}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column (Sidebar) */}
                <div style={{ flex: '1 1 30%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Top bar profile widget */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--glass-bg-light)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: '50%' }}><Icon name="settings" size={20} /></button>
                            <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: '50%', position: 'relative' }}>
                                <Icon name="bell" size={20} />
                                {stats.enAttente > 0 && <span style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%' }} />}
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{user?.nom_complet}</p>
                                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Enseignant</p>
                            </div>
                            <div className="avatar avatar-md accent" style={{ width: 40, height: 40 }}>
                                {(user?.nom_complet || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Calendar (Dynamic) */}
                    <div className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 className="section-title" style={{ fontSize: 15 }}>Planning</h3>
                            <span className="pill pill-neutral" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                                <Icon name="calendar" size={12} /> {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                            {(() => {
                                const today = new Date();
                                const currentDay = today.getDay();
                                const monday = new Date(today);
                                monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
                                
                                return [0, 1, 2, 3, 4].map((offset) => {
                                    const date = new Date(monday);
                                    date.setDate(monday.getDate() + offset);
                                    const isToday = date.toDateString() === today.toDateString();
                                    const dayName = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'][offset];
                                    
                                    return (
                                        <div key={offset} style={{ 
                                            padding: '12px 8px', borderRadius: 16, textAlign: 'center',
                                            background: isToday ? 'var(--accent)' : 'transparent',
                                            color: isToday ? 'white' : 'var(--text-secondary)',
                                            boxShadow: isToday ? 'var(--shadow-glow-accent)' : 'none',
                                            flex: 1,
                                            minWidth: 0
                                        }}>
                                            <div style={{ fontSize: 10, marginBottom: 4, fontWeight: 600, opacity: isToday ? 1 : 0.7 }}>{dayName}</div>
                                            <div style={{ fontSize: 15, fontWeight: 800 }}>{date.getDate()}</div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Raccourcis (Liquid Bubbles) */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 className="section-title" style={{ fontSize: 15 }}>Raccourcis</h3>
                        </div>
                        
                        <div className="water-bubble-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                            {[
                                { title: 'Validation', desc: 'Signer les cours', href: '/enseignant/validation', icon: 'clipboard-check', color: 'var(--warning)' },
                                { title: 'Paramètres', desc: 'Mon compte', href: '#', icon: 'settings', color: 'var(--text-muted)' }
                            ].map((action, i) => (
                                <div 
                                    key={i} 
                                    className="water-bubble"
                                    style={{ height: 160, padding: 16 }}
                                    onClick={() => navigate(action.href)}
                                >
                                    <div className="bubble-icon" style={{ color: action.color, width: 44, height: 44 }}>
                                        <Icon name={action.icon} size={20} />
                                    </div>
                                    <h4 className="bubble-title" style={{ fontSize: 12 }}>{action.title}</h4>
                                    <p className="bubble-desc" style={{ fontSize: 9 }}>{action.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default TeacherDashboard;
