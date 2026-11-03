import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { LoadingScreen, useAuth, StatCard } from '../components/Common';

function AdminDashboard() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [stats, setStats] = useState({ etudiants: 0, enseignants: 0, classes: 0, matieres: 0 });
    const [enAttente, setEnAttente] = useState(0);
    const [derniersInscrits, setDerniersInscrits] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!ready) return;
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/admin/dashboard');
                setStats(response.data.stats);
                setEnAttente(response.data.etudiants_en_attente);
                setDerniersInscrits(response.data.derniers_inscrits || []);
            } catch (e) {
                console.error('Erreur dashboard:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [ready]);

    if (!ready || loading) return <LoadingScreen text="Chargement du tableau de bord..." />;

    const menuItems = [
        { label: 'Tableau de bord', icon: 'dashboard', href: '/admin/dashboard' },
        { label: 'Etudiants',       icon: 'users',     href: '/admin/etudiants', alert: enAttente },
        { label: 'Classes',         icon: 'building',  href: '/admin/classe/gerer' },
        { label: 'Matieres',        icon: 'book',      href: '/admin/matiere/creer' },
        { label: 'Enseignants',     icon: 'chalkboard',href: '/admin/enseignant/creer' },
        { label: 'Assignations',    icon: 'flag',      href: '/admin/enseignant/assigner' },
    ];

    const actionCards = [
        { title: 'Valider inscriptions', desc: enAttente > 0
            ? `${enAttente} etudiant${enAttente > 1 ? 's' : ''} en attente`
            : 'Aucune en attente',
          href: '/admin/etudiants', icon: 'user-check', color: 'var(--accent)' },
        { title: 'Creer un enseignant', desc: 'Ajouter un nouveau professeur',
          href: '/admin/enseignant/creer', icon: 'user-plus', color: 'var(--info)' },
        { title: 'Creer une classe', desc: 'Nouvelle classe academique',
          href: '/admin/classe/creer', icon: 'plus-circle', color: 'var(--success)' },
        { title: 'Gerer les classes', desc: 'Etudiants et delegues',
          href: '/admin/classe/gerer', icon: 'users', color: 'var(--warning)' },
    ];

    return (
        <Layout
            user={user}
            role="admin"
            menuItems={menuItems}
            title="Tableau de bord"
            subtitle={`Bienvenue, ${user?.nom_complet}`}
            actions={enAttente > 0 ? (
                <button
                    onClick={() => navigate('/admin/etudiants')}
                    className="pill pill-warning"
                    style={{ cursor: 'pointer', border: '1px solid rgba(251, 191, 36, 0.3)' }}
                >
                    <Icon name="alert" size={12} />
                    {enAttente} inscription{enAttente > 1 ? 's' : ''} en attente
                </button>
            ) : null}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Left Column (Main) */}
                <div style={{ flex: '1 1 65%', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
                    {/* Banner */}
                    <div style={{
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                        borderRadius: 'var(--radius-xl)', padding: '36px 40px', color: '#fff',
                        boxShadow: 'var(--shadow-glow-primary)'
                    }}>
                        <h2 style={{ fontSize: 28, margin: '0 0 12px', fontFamily: 'var(--font-display)', zIndex: 2, position: 'relative' }}>
                            Bonjour {user?.nom_complet?.split(' ')[0] || 'Admin'}
                        </h2>
                        <p style={{ opacity: 0.9, maxWidth: '60%', margin: '0 0 20px', lineHeight: 1.5, zIndex: 2, position: 'relative', fontSize: 15 }}>
                            {enAttente > 0 
                                ? `Vous avez ${enAttente} inscriptions en attente. C'est beaucoup de travail pour aujourd'hui ! Commençons.` 
                                : `Bienvenue sur votre tableau de bord. Tout est à jour aujourd'hui !`}
                        </p>
                        <button onClick={() => navigate('/admin/etudiants')} style={{
                            background: 'white', color: 'var(--primary-strong)', border: 'none',
                            padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: 600,
                            cursor: 'pointer', zIndex: 2, position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            Examiner
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
                            <Icon name="monitor" size={80} color="white" />
                            <Icon name="bar-chart-2" size={80} color="white" />
                        </div>
                    </div>

                    {/* Aperçu Global (Like "You need to hire") */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 className="section-title">Aperçu de la plateforme</h3>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>Voir tout</button>
                        </div>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                            gap: 16 
                        }}>
                            {[
                                { icon: 'users', color: '#3b82f6', title: 'Etudiants', count: stats.etudiants, sub: 'Inscrits' },
                                { icon: 'chalkboard', color: '#f59e0b', title: 'Enseignants', count: stats.enseignants, sub: 'Professeurs' },
                                { icon: 'building', color: '#10b981', title: 'Classes', count: stats.classes, sub: 'Creees' },
                                { icon: 'book', color: '#6366f1', title: 'Matieres', count: stats.matieres, sub: 'Programme' },
                                { icon: 'clock', color: '#8b5cf6', title: 'Attente', count: enAttente, sub: 'Inscriptions' }
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

                    {/* Actions rapides (Liquid Bubbles) */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 className="section-title">Actions Rapides</h3>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>Voir tout</button>
                        </div>
                        
                        <div className="water-bubble-container">
                            {actionCards.map((action, i) => (
                                <div 
                                    key={i} 
                                    className="water-bubble"
                                    onClick={() => navigate(action.href)}
                                >
                                    <div className="bubble-icon" style={{ color: action.color }}>
                                        <Icon name={action.icon} size={24} />
                                    </div>
                                    <h4 className="bubble-title">{action.title}</h4>
                                    <p className="bubble-desc">{action.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column (Sidebar) */}
                <div style={{ flex: '1 1 30%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Status Widget */}
                    <div className="glass-card" style={{ padding: 24, background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 className="section-title" style={{ fontSize: 15 }}>État du Système</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>Opérationnel</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Serveur API</span>
                                <span style={{ fontWeight: 600 }}>En ligne (12ms)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Base de données</span>
                                <span style={{ fontWeight: 600 }}>Connecté</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Mises à jour</span>
                                <span style={{ fontWeight: 600 }}>Aucune</span>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Calendar (Dynamic) */}
                    <div className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 className="section-title" style={{ fontSize: 15 }}>Calendrier</h3>
                            <span className="pill pill-neutral" style={{ fontSize: 11, textTransform: 'capitalize' }}>
                                <Icon name="calendar" size={12} /> {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                            {(() => {
                                const today = new Date();
                                const currentDay = today.getDay(); // 0 (Dim) to 6 (Sam)
                                // Calculer le lundi de la semaine actuelle
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
                                            background: isToday ? 'var(--primary)' : 'transparent',
                                            color: isToday ? 'white' : 'var(--text-secondary)',
                                            boxShadow: isToday ? 'var(--shadow-glow-primary)' : 'none',
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

                    {/* New Applicants (Derniers Inscrits) */}
                    <div className="glass-card" style={{ padding: 24, borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 className="section-title" style={{ fontSize: 15 }}>Nouveaux Inscrits</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/etudiants')} style={{ color: 'var(--primary)', fontWeight: 600 }}>Voir tout</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {derniersInscrits.length > 0 ? derniersInscrits.slice(0, 5).map(etu => {
                                const initials = (etu.nom_complet || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                                return (
                                    <div key={etu.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="avatar avatar-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>{initials}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{etu.nom_complet}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {etu.classe?.nom || 'Sans classe'}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {etu.est_valide ? (
                                                <div style={{ color: 'var(--success)' }}><Icon name="check-circle" size={16} /></div>
                                            ) : (
                                                <div style={{ color: 'var(--warning)' }}><Icon name="clock" size={16} /></div>
                                            )}
                                        </div>
                                    </div>
                                )
                            }) : (
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Aucun nouvel inscrit.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Support / Feedback */}
                    <div className="glass-card" style={{ padding: 20, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)', color: 'white', borderRadius: 'var(--radius-xl)' }}>
                         <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>Besoin d'aide ?</h4>
                         <p style={{ margin: '0 0 16px', fontSize: 11, opacity: 0.9 }}>Contactez le support technique pour toute question sur la plateforme.</p>
                         <button className="btn btn-sm" style={{ width: '100%', background: 'white', color: 'var(--primary)', border: 'none', fontWeight: 700 }}>Contacter</button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default AdminDashboard;
