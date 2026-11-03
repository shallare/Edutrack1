import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import axios from 'axios';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { API_URL } from '../services/api';
import '../pages/StudyPlanEditor.css';

/**
 * SharedCourse — page PUBLIQUE d'un cours partagé (lecture seule, sans compte).
 * Le HTML du cours est assaini avec DOMPurify avant affichage.
 * Sert aussi de porte d'entrée : bandeau d'invitation à rejoindre Wii-Co.
 */
function SharedCourse() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [cours, setCours] = useState(null);
    const [erreur, setErreur] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API_URL}/partage/${token}`);
                setCours(res.data);
            } catch (err) {
                setErreur(err.response?.data?.erreur ||
                    (!err.response ? 'Serveur injoignable.' : 'Ce lien de partage est invalide.'));
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

            {/* ── Bandeau Wii-Co ── */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                padding: '14px 26px', background: 'var(--glass-bg-strong)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap',
            }}>
                <Logo size={20} color="var(--text-primary)" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                        Cours partagé via Wii-Co
                    </span>
                    <button onClick={() => navigate('/etudiant/login')} className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: 12.5 }}>
                        <Icon name="user-plus" size={14} style={{ marginRight: 6 }} />
                        Rejoindre Wii-Co gratuitement
                    </button>
                </div>
            </header>

            {/* ── Contenu ── */}
            <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '28px 16px' }}>
                <div style={{ width: '100%', maxWidth: 860 }}>
                    {loading ? (
                        <div className="glass-card" style={{ padding: 40, borderRadius: 'var(--radius-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Chargement du cours…
                        </div>
                    ) : erreur ? (
                        <div className="glass-card" style={{ padding: 48, borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
                            <Icon name="alert-circle" size={40} style={{ color: 'var(--danger)', marginBottom: 14 }} />
                            <h2 style={{ margin: '0 0 8px', fontSize: 19, color: 'var(--text-primary)' }}>Lien indisponible</h2>
                            <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-muted)' }}>{erreur}</p>
                            <button onClick={() => navigate('/')} className="btn btn-primary">Découvrir Wii-Co</button>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                            {/* Cahier ligné, même langage visuel que l'éditeur */}
                            <div className="notebook-paper editor-content-wrapper">
                                <h1 className="notebook-title" style={{ pointerEvents: 'none' }}>{cours.titre}</h1>
                                {cours.description && (
                                    <p className="notebook-subtitle" style={{ margin: 0 }}>{cours.description}</p>
                                )}
                                <div className="notebook-rule" />
                                <div
                                    className="ProseMirror"
                                    style={{ minHeight: '40vh' }}
                                    // Assaini avec DOMPurify : aucun script/attribut dangereux ne passe
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cours.contenu || '<p><em>Ce cours ne contient pas encore de notes.</em></p>') }}
                                />
                            </div>
                            <div className="notebook-footer">
                                <span>
                                    Partagé par {cours.auteur}{cours.nom_professeur ? ` · Professeur : ${cours.nom_professeur}` : ''}
                                </span>
                                <span>
                                    {cours.updated_at ? `Mis à jour le ${new Date(cours.updated_at).toLocaleDateString('fr-FR')}` : ''}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SharedCourse;
