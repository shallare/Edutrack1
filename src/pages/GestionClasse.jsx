import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { useAuth, MessageBox, LoadingScreen, Empty } from '../components/Common';
import { adminMenu } from '../utils/menus';

function GestionClasse() {
    const { user, ready } = useAuth('admin', '/admin/login');
    const [etudiants, setEtudiants] = useState([]);
    const [allEtudiants, setAllEtudiants] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedEtudiant, setSelectedEtudiant] = useState('');
    const [selectedClasse, setSelectedClasse] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ready) return;
        fetchData();
    }, [ready]);

    const fetchData = async () => {
        try {
            const [classesRes, etuRes] = await Promise.all([
                api.get('/admin/classes'),
                api.get('/admin/etudiants'),
            ]);
            setClasses(classesRes.data);
            setAllEtudiants(etuRes.data.filter(e => e.est_valide));

            if (classesRes.data.length > 0) {
                setSelectedClasse(classesRes.data[0]);
                fetchEtudiants(classesRes.data[0].id);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchEtudiants = async (classeId) => {
        try {
            const res = await api.get(`/admin/classe/${classeId}/etudiants`);
            setEtudiants(res.data);
        } catch (e) { console.error(e); }
    };

    const handleClasseChange = (classeId) => {
        const classe = classes.find(c => c.id == classeId);
        setSelectedClasse(classe);
        setMessage({ text: '', type: '' });
        fetchEtudiants(classeId);
    };

    const handleAjouter = async () => {
        if (!selectedEtudiant || !selectedClasse) return;
        try {
            await api.post('/admin/etudiant/ajouter-classe', {
                etudiant_id: selectedEtudiant,
                classe_id: selectedClasse.id,
            });
            setMessage({ text: 'Etudiant ajoute a la classe', type: 'success' });
            fetchEtudiants(selectedClasse.id);
            setSelectedEtudiant('');
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            setMessage({ text: error.response?.data?.erreur || 'Erreur lors de l\'ajout', type: 'error' });
        }
    };

    const handleNommerDelegue = async (etudiantId) => {
        try {
            await api.post('/admin/etudiant/nommer-delegue', {
                etudiant_id: etudiantId,
                classe_id: selectedClasse.id,
            });
            setMessage({ text: 'Delegue nomme avec succes', type: 'success' });
            fetchEtudiants(selectedClasse.id);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (e) {
            setMessage({ text: 'Erreur lors de la nomination', type: 'error' });
        }
    };

    if (!ready || loading) return <LoadingScreen text="Chargement..." />;

    const etudiantsDisponibles = allEtudiants.filter(e => !etudiants.find(et => et.id === e.id));
    const nbDelegues = etudiants.filter(e => e.est_delegue).length;

    return (
        <Layout
            user={user}
            role="admin"
            menuItems={adminMenu()}
            title="Gestion des classes"
            subtitle="Organisez les étudiants et nommez les délégués"
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {/* Main Column */}
                <div style={{ flex: '1 1 65%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Top Stats/Banner */}
                    <div style={{
                        position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)',
                        borderRadius: 'var(--radius-xl)', padding: '32px 40px', color: '#fff',
                        boxShadow: 'var(--shadow-glow-warning)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h2 style={{ fontSize: 26, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                                {selectedClasse ? `Gestion : ${selectedClasse.nom}` : 'Sélectionnez une classe'}
                            </h2>
                            <p style={{ opacity: 0.9, maxWidth: '480px', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                                Gérez les effectifs de la classe et désignez les délégués responsables de la saisie du cahier de texte.
                            </p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                <div className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                    <Icon name="users" size={13} /> {etudiants.length} Étudiants
                                </div>
                                <div className="pill" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                    <Icon name="user-shield" size={13} /> {nbDelegues} Délégués
                                </div>
                            </div>
                        </div>
                        <Icon name="building" size={140} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: -10, bottom: -30, zIndex: 1 }} />
                    </div>

                    {message.text && <MessageBox message={message} />}

                    {/* Table of students */}
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="section-title">Étudiants inscrits</h3>
                            {nbDelegues >= 2 && (
                                <span className="pill pill-warning" style={{ fontSize: 10 }}>
                                    <Icon name="info" size={11} /> Limite de délégués atteinte
                                </span>
                            )}
                        </div>

                        {etudiants.length === 0 ? (
                            <Empty
                                icon="users"
                                title="Classe vide"
                                description="Ajoutez des étudiants à cette classe pour commencer."
                            />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Étudiant</th>
                                            <th>Email</th>
                                            <th>Rôle</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {etudiants.map(e => {
                                            const initials = (e.nom_complet || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                                            return (
                                                <tr key={e.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                            <div className={`avatar avatar-sm ${e.est_delegue ? 'accent' : ''}`}>{initials}</div>
                                                            <span style={{ fontWeight: 600 }}>{e.nom_complet}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{e.email}</td>
                                                    <td>
                                                        {e.est_delegue ? (
                                                            <span className="pill pill-accent"><Icon name="user-shield" size={11} /> Délégué</span>
                                                        ) : (
                                                            <span className="pill pill-neutral"><Icon name="user" size={11} /> Étudiant</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        {!e.est_delegue && (
                                                            <button
                                                                onClick={() => handleNommerDelegue(e.id)}
                                                                className="btn btn-sm btn-secondary"
                                                                disabled={nbDelegues >= 2}
                                                            >
                                                                Promouvoir
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
                <div style={{ flex: '1 1 30%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Class Selector Widget */}
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 18 }}>Sélectionner une classe</h3>
                        <div className="field">
                            <select
                                value={selectedClasse?.id || ''}
                                onChange={(e) => handleClasseChange(e.target.value)}
                                className="select"
                            >
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nom} {c.annee_academique ? `(${c.annee_academique})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Add Student Widget */}
                    <div className="glass-card" style={{ padding: 24, background: 'var(--glass-bg-light)' }}>
                        <h3 className="section-title" style={{ fontSize: 15, marginBottom: 6 }}>Inscrire un étudiant</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Ajoutez un membre validé à cette classe.</p>
                        
                        <div className="field" style={{ marginBottom: 16 }}>
                            <label className="label">Étudiant disponible</label>
                            <select
                                value={selectedEtudiant}
                                onChange={(e) => setSelectedEtudiant(e.target.value)}
                                className="select"
                                disabled={etudiantsDisponibles.length === 0}
                            >
                                <option value="">Choisir...</option>
                                {etudiantsDisponibles.map(e => (
                                    <option key={e.id} value={e.id}>{e.nom_complet}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleAjouter}
                            disabled={!selectedEtudiant}
                            className="btn btn-primary btn-block"
                        >
                            <Icon name="plus" size={15} /> Ajouter
                        </button>

                        {etudiantsDisponibles.length === 0 && (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center', fontStyle: 'italic' }}>
                                Aucun autre étudiant disponible.
                            </p>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div className="glass-card" style={{ padding: 20, background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed var(--warning)' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--warning)' }}>Rappel des rôles</h4>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            Les <strong>délégués</strong> sont les seuls étudiants autorisés à remplir le cahier de texte pour leur classe respective. Vous pouvez en nommer jusqu'à 2 par classe.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default GestionClasse;
