import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Icon from '../components/Icon';
import Mascot3D from '../components/Mascot3D';
import { StatCard } from '../components/Common';
import { mesCours } from '../services/api';
import { moyenneGenerale, fmt } from '../utils/grades';

// Jours JS (getDay: 0 = dimanche) → clés horaires
const JOURS_JS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function StudentDashboard() {
    const { user } = useOutletContext();
    const [mesCoursList, setMesCoursList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const res = await mesCours.lister();
                setMesCoursList(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const isDelegue = user?.role === 'delegue';
    const moyGenerale = moyenneGenerale(mesCoursList);

    // Derniers cours AJOUTÉS (création la plus récente en premier)
    const derniersAjoutes = [...mesCoursList]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);

    // Séances d'aujourd'hui, à partir des horaires des cours
    const jourActuel = JOURS_JS[new Date().getDay()];
    const seancesDuJour = mesCoursList
        .flatMap(c => (c.horaires || [])
            .filter(h => (h.jour || '').toLowerCase() === jourActuel)
            .map(h => ({ cours: c, ...h })))
        .sort((a, b) => (a.debut || '').localeCompare(b.debut || ''));

    const termine = mesCoursList.filter(c => c.statut === 'termine').length;

    // Conseils de la mascotte — contextuels d'abord, généraux ensuite
    const mascotTips = useMemo(() => {
        const tips = [];
        if (!loading) {
            if (mesCoursList.length === 0) {
                tips.push('Bienvenue ! Crée ton premier cours depuis « Mes cours » pour démarrer ton plan d\'étude.');
            }
            if (mesCoursList.length > 0 && mesCoursList.some(c => !(c.horaires || []).length)) {
                tips.push('Certains de tes cours n\'ont pas d\'horaires — ajoute-les pour remplir ton emploi du temps !');
            }
            if (mesCoursList.length > 0 && moyGenerale === null) {
                tips.push('Saisis au moins 1 interro et 1 devoir par cours : je calculerai ta moyenne automatiquement.');
            } else if (moyGenerale !== null && moyGenerale >= 10) {
                tips.push(`Belle moyenne de ${fmt(moyGenerale)}/20 — continue comme ça, champion !`);
            } else if (moyGenerale !== null) {
                tips.push('Ta moyenne est en dessous de 10 — planifie des révisions cette semaine, tu peux y arriver !');
            }
            if (seancesDuJour.length > 0) {
                tips.push(`Tu as ${seancesDuJour.length} séance${seancesDuJour.length > 1 ? 's' : ''} aujourd'hui — prépare tes affaires en avance !`);
            }
        }
        tips.push(
            'Révise tes notes dans les 24h après un cours : la mémorisation est deux fois meilleure.',
            'Utilise l\'atelier Schémas & Dessin pour illustrer tes cours, puis insère le dessin dans le texte.',
            'Partage un cours à un camarade avec le bouton Partager — réviser à deux, c\'est plus efficace.',
            'Technique Pomodoro : 25 minutes de concentration, 5 minutes de pause. Répète 4 fois.',
            'Clique sur moi pour un autre conseil !',
        );
        return tips;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, mesCoursList, moyGenerale, seancesDuJour.length]);

    const quickActions = [
        {
            icon: 'calendar', label: "Emploi du temps",
            desc: 'Consultez et organisez vos créneaux de la semaine',
            color: 'var(--info)', bg: 'var(--info-soft)',
            onClick: () => navigate('/etudiant/emploi-du-temps'),
        },
        {
            icon: 'plus-circle', label: 'Ajouter un cours / matière',
            desc: 'Créez une nouvelle fiche de cours',
            color: 'var(--primary)', bg: 'var(--primary-soft)',
            onClick: () => navigate('/etudiant/cours?new=1'),
        },
        {
            icon: 'star', label: 'Saisir des notes',
            desc: 'Interros et devoirs — moyennes automatiques',
            color: 'var(--warning)', bg: 'var(--warning-soft)',
            onClick: () => navigate('/etudiant/cours?notes=1'),
        },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>

            {/* ── Banner avec mascotte ── */}
            <div style={{
                flexShrink: 0, position: 'relative', overflow: 'visible',
                background: 'linear-gradient(135deg, var(--info) 0%, var(--primary) 100%)',
                borderRadius: 'var(--radius-xl)', padding: '18px 28px', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
                <div style={{ zIndex: 2, minWidth: 0 }}>
                    <h2 style={{ fontSize: 22, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        Bonjour {user?.nom_complet?.split(' ')[0] || 'Étudiant'}
                        {isDelegue && (
                            <span style={{ fontSize: 10.5, fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 999, letterSpacing: 0.5 }}>
                                DÉLÉGUÉ
                            </span>
                        )}
                    </h2>
                    <p style={{ opacity: 0.9, margin: '0 0 12px', fontSize: 13.5 }}>
                        {seancesDuJour.length > 0
                            ? `${seancesDuJour.length} séance${seancesDuJour.length > 1 ? 's' : ''} prévue${seancesDuJour.length > 1 ? 's' : ''} aujourd'hui.`
                            : 'Aucune séance prévue aujourd\'hui — bon moment pour réviser.'}
                    </p>
                    <button
                        onClick={() => navigate('/etudiant/cours')}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '9px 16px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                    >
                        <Icon name="book-open" size={16} />
                        Ouvrir mon plan d'étude
                    </button>
                </div>

                {/* Mascotte 3D Wiico + conseils (désactivable dans Paramètres → Apparence) */}
                {(() => {
                    try { return JSON.parse(localStorage.getItem('wiico_prefs'))?.conseilsMascotte !== false; }
                    catch { return true; }
                })() && (
                    <div style={{ zIndex: 2, flexShrink: 0 }}>
                        <Mascot3D tips={mascotTips} size={140} />
                    </div>
                )}

                <div style={{ position: 'absolute', right: '-4%', bottom: '-55%', width: 200, height: 200, background: 'rgba(255,255,255,0.08)', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }} />
            </div>

            {/* ── Actions rapides ── */}
            <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {quickActions.map(a => (
                    <button key={a.label} onClick={a.onClick} className="glass-card interactive"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'inherit', borderRadius: 'var(--radius-lg)', minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={a.icon} size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</p>
                            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Ligne basse : remplit la hauteur restante ── */}
            <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>

                {/* Aujourd'hui */}
                <div className="glass-card" style={{ padding: 20, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--info-soft)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="calendar" size={15} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{jourActuel}</h4>
                        <button onClick={() => navigate('/etudiant/emploi-du-temps')} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}>
                            Voir tout
                        </button>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                        {loading ? (
                            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>Chargement…</p>
                        ) : seancesDuJour.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                                Aucune séance aujourd'hui.<br />
                                <span style={{ fontSize: 11.5 }}>Ajoutez des horaires à vos cours depuis « Mes cours ».</span>
                            </p>
                        ) : seancesDuJour.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--glass-border)' : 'none' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)', fontFamily: 'monospace', flexShrink: 0 }}>
                                    {s.debut}–{s.fin}
                                </span>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {s.cours.titre}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Derniers cours ajoutés */}
                <div className="glass-card" style={{ padding: 20, borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="book-open" size={15} />
                        </div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Derniers cours ajoutés</h4>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{mesCoursList.length} cours</span>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                        {loading ? (
                            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>Chargement…</p>
                        ) : derniersAjoutes.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>
                                Aucun cours pour l'instant.<br />
                                <button onClick={() => navigate('/etudiant/cours?new=1')} className="btn btn-primary btn-sm" style={{ marginTop: 10, fontSize: 11.5, padding: '6px 12px' }}>
                                    <Icon name="plus" size={12} style={{ marginRight: 4 }} />
                                    Créer mon premier cours
                                </button>
                            </p>
                        ) : derniersAjoutes.map((c, i) => (
                            <div key={c.id} onClick={() => navigate(`/etudiant/cours/editeur?id=${c.id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--glass-border)' : 'none', cursor: 'pointer' }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: c.couleur && c.couleur !== '#ffffff' ? c.couleur : 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon name="file-text" size={13} style={{ color: c.couleur && c.couleur !== '#ffffff' ? '#1e1b4b' : 'var(--primary)' }} />
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titre}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                                        {c.nom_professeur ? `${c.nom_professeur} · ` : ''}
                                        {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                                <Icon name="arrow-right" size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Moyenne + progression */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
                    <StatCard
                        label="Moyenne générale"
                        value={moyGenerale !== null ? `${fmt(moyGenerale)} / 20` : '—'}
                        sub={moyGenerale !== null
                            ? `Calculée sur vos cours notés`
                            : 'Min. 1 interro et 1 devoir par cours'}
                        icon="bar-chart-2"
                        color={moyGenerale !== null && moyGenerale >= 10 ? 'success' : moyGenerale !== null ? 'danger' : 'accent'}
                    />
                    <div className="glass-card" style={{ padding: 20, borderRadius: 'var(--radius-xl)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <span>Progression</span>
                            <span>{termine}/{mesCoursList.length} terminés</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 999,
                                width: `${mesCoursList.length ? Math.round((termine / mesCoursList.length) * 100) : 0}%`,
                                background: 'linear-gradient(90deg, var(--primary), var(--info))',
                                transition: 'width .4s ease',
                            }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {mesCoursList.length === 0
                                ? 'Créez des cours pour suivre votre progression.'
                                : termine === mesCoursList.length
                                    ? 'Tous vos cours sont terminés, bravo !'
                                    : 'Continuez, vous êtes sur la bonne voie.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
