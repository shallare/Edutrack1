import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { LoadingScreen, useAuth, MessageBox, Empty } from '../components/Common';

function EtudiantsList() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [etudiants, setEtudiants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('tous');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [actionId, setActionId] = useState(null);

    useEffect(() => {
        if (!ready) return;
        fetchEtudiants();
    }, [ready]);

    const fetchEtudiants = async () => {
        try {
            const response = await api.get('/admin/etudiants');
            setEtudiants(response.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const validerEtudiant = async (id) => {
        setActionId(id);
        try {
            await api.put(`/admin/etudiant/${id}/valider`);
            setMessage({ text: 'Etudiant valide avec succes', type: 'success' });
            fetchEtudiants();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (e) {
            setMessage({ text: 'Erreur lors de la validation', type: 'error' });
        } finally { setActionId(null); }
    };

    const bloquerEtudiant = async (id) => {
        setActionId(id);
        try {
            await api.put(`/admin/etudiant/${id}/bloquer`);
            setMessage({ text: 'Etudiant bloque', type: 'success' });
            fetchEtudiants();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (e) {
            setMessage({ text: 'Erreur lors du blocage', type: 'error' });
        } finally { setActionId(null); }
    };

    if (!ready) return <LoadingScreen text="Chargement..." />;

    const filtered = etudiants.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = e.nom_complet.toLowerCase().includes(q)
            || e.email.toLowerCase().includes(q)
            || (e.matricule && e.matricule.toLowerCase().includes(q));
        if (filter === 'valides') return matchSearch && e.est_valide;
        if (filter === 'attente') return matchSearch && !e.est_valide;
        return matchSearch;
    });

    const stats = {
        total: etudiants.length,
        valides: etudiants.filter(e => e.est_valide).length,
        attente: etudiants.filter(e => !e.est_valide).length,
    };

    const menuItems = [
        { label: 'Tableau de bord', icon: 'dashboard', href: '/admin/dashboard' },
        { label: 'Etudiants',       icon: 'users',     href: '/admin/etudiants', alert: stats.attente },
        { label: 'Classes',         icon: 'building',  href: '/admin/classe/gerer' },
        { label: 'Matieres',        icon: 'book',      href: '/admin/matiere/creer' },
        { label: 'Enseignants',     icon: 'chalkboard',href: '/admin/enseignant/creer' },
        { label: 'Assignations',    icon: 'flag',      href: '/admin/enseignant/assigner' },
    ];

    return (
        <Layout
            user={user}
            role="admin"
            menuItems={menuItems}
            title="Gestion des étudiants"
            subtitle="Validez les inscriptions et gérez les comptes"
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Main Column */}
                <div style={{ flex: '1 1 68%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Banner */}
                    <div style={{
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)',
                        borderRadius: 'var(--radius-xl)', padding: '32px 36px', color: '#fff',
                        boxShadow: 'var(--shadow-glow-primary)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h2 style={{ fontSize: 24, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>Répertoire des Étudiants</h2>
                            <p style={{ opacity: 0.9, maxWidth: '500px', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                                Gérez les accès à la plateforme. {stats.attente > 0 ? `Il y a ${stats.attente} inscriptions en attente de validation.` : 'Toutes les inscriptions sont à jour.'}
                            </p>
                        </div>
                        <Icon name="users" size={120} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: 20, bottom: -20, zIndex: 1 }} />
                    </div>

                    {message.text && <MessageBox message={message} />}

                    {/* Table Section */}
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="section-title">Liste des inscrits</h3>
                            <div className="pill pill-neutral">{filtered.length} résultats</div>
                        </div>
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 60 }}>
                                <div className="spinner" style={{ margin: '0 auto' }} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <Empty
                                icon="users"
                                title="Aucun étudiant trouvé"
                                description={search ? 'Aucun résultat pour votre recherche' : 'Aucun étudiant inscrit pour le moment'}
                            />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Étudiant</th>
                                            <th>Email</th>
                                            <th>Matricule</th>
                                            <th>Statut</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(etu => {
                                            const initials = (etu.nom_complet || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                                            const isProcessing = actionId === etu.id;
                                            return (
                                                <tr key={etu.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div className="avatar avatar-sm accent">{initials}</div>
                                                            <span style={{ fontWeight: 600 }}>{etu.nom_complet}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{etu.email}</td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{etu.matricule || '—'}</td>
                                                    <td>
                                                        {etu.est_valide ? (
                                                            <span className="pill pill-success"><Icon name="check" size={11} /> Validé</span>
                                                        ) : (
                                                            <span className="pill pill-warning"><Icon name="clock" size={11} /> En attente</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {etu.est_valide ? (
                                                            <button onClick={() => bloquerEtudiant(etu.id)} disabled={isProcessing} className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>
                                                                {isProcessing ? '...' : <Icon name="x" size={16} />}
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => validerEtudiant(etu.id)} disabled={isProcessing} className="btn btn-sm btn-success">
                                                                {isProcessing ? '...' : 'Valider'}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div style={{ flex: '1 1 25%', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Stats Widget */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Statistiques</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total</span>
                                </div>
                                <span style={{ fontWeight: 700 }}>{stats.total}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Validés</span>
                                </div>
                                <span style={{ fontWeight: 700 }}>{stats.valides}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }} />
                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>En attente</span>
                                </div>
                                <span style={{ fontWeight: 700 }}>{stats.attente}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Widget */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Recherche & Filtres</h3>
                        
                        <div className="field" style={{ marginBottom: 20 }}>
                            <label className="label">Rechercher</label>
                            <div style={{ position: 'relative' }}>
                                <Icon name="search" size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Nom, email, matricule..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input"
                                    style={{ paddingLeft: 40, fontSize: 13 }}
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Statut</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { id: 'tous', label: 'Tous les étudiants', icon: 'users' },
                                    { id: 'valides', label: 'Inscriptions validées', icon: 'check-circle' },
                                    { id: 'attente', label: 'En attente', icon: 'clock' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: '1px solid transparent',
                                            background: filter === f.id ? 'var(--primary-soft)' : 'transparent',
                                            color: filter === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                                            textAlign: 'left', fontWeight: filter === f.id ? 600 : 400, transition: 'all 0.2s', width: '100%'
                                        }}
                                    >
                                        <Icon name={f.icon} size={16} />
                                        <span style={{ fontSize: 13 }}>{f.label}</span>
                                        {filter === f.id && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Help */}
                    <div className="glass-card" style={{ padding: 20, background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--primary)' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Icon name="info" size={20} color="var(--primary)" />
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                Validez les inscriptions pour permettre aux étudiants d'accéder à leurs cours et de scanner les codes QR.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default EtudiantsList;
