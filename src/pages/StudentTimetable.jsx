import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { Empty } from '../components/Common';
import { mesCours } from '../services/api';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const JOURS_JS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const THUMB_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6'];

function StudentTimetable() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await mesCours.lister();
                setCourses(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const jourActuel = JOURS_JS[new Date().getDay()];

    // jour → [{cours, debut, fin, conflit}] triés par heure de début.
    // Un créneau est en conflit s'il commence avant la fin du précédent.
    const parJour = JOURS.reduce((acc, jour) => {
        const seances = courses
            .flatMap(c => (c.horaires || [])
                .filter(h => (h.jour || '').toLowerCase() === jour)
                .map(h => ({ cours: c, ...h })))
            .sort((a, b) => (a.debut || '').localeCompare(b.debut || ''));
        seances.forEach((s, i) => {
            if (i > 0 && s.debut < seances[i - 1].fin) {
                s.conflit = true;
                seances[i - 1].conflit = true;
            }
        });
        acc[jour] = seances;
        return acc;
    }, {});

    const nbConflits = Object.values(parJour).flat().filter(s => s.conflit).length;

    const totalSeances = Object.values(parJour).reduce((n, l) => n + l.length, 0);
    const sansHoraires = courses.filter(c => !(c.horaires || []).length);

    // ── Export iCalendar (.ics) : événements hebdomadaires récurrents ──
    const exportICS = () => {
        const BYDAY = { lundi: 'MO', mardi: 'TU', mercredi: 'WE', jeudi: 'TH', vendredi: 'FR', samedi: 'SA', dimanche: 'SU' };
        const pad = (n) => String(n).padStart(2, '0');
        const events = [];

        JOURS.forEach((jour, idx) => {
            parJour[jour].forEach((s, i) => {
                // Prochaine occurrence de ce jour de semaine (Lun=1 … Dim=7)
                const target = idx + 1;
                const now = new Date();
                const jsDow = now.getDay() === 0 ? 7 : now.getDay();
                const d = new Date(now);
                d.setDate(now.getDate() + ((target - jsDow + 7) % 7));
                const [dh, dm] = (s.debut || '08:00').split(':');
                const [fh, fm] = (s.fin || '10:00').split(':');
                const stamp = (h, m) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
                events.push([
                    'BEGIN:VEVENT',
                    `UID:wiico-${s.cours.id}-${jour}-${i}@wiico`,
                    `DTSTART:${stamp(dh, dm)}`,
                    `DTEND:${stamp(fh, fm)}`,
                    `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[jour]}`,
                    `SUMMARY:${(s.cours.titre || 'Cours').replace(/[,;\\]/g, ' ')}`,
                    s.cours.nom_professeur ? `DESCRIPTION:Professeur : ${s.cours.nom_professeur.replace(/[,;\\]/g, ' ')}` : null,
                    'END:VEVENT',
                ].filter(Boolean).join('\r\n'));
            });
        });

        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wii-Co//Emploi du temps//FR', ...events, 'END:VCALENDAR'].join('\r\n');
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'emploi-du-temps-wiico.ics';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chargement de votre emploi du temps…</p>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── En-tête ── */}
            <div className="glass-card" style={{ padding: '20px 26px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Semaine — {totalSeances} séance{totalSeances > 1 ? 's' : ''}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
                        Les créneaux proviennent de vos cours : modifiez-les depuis « Mes cours ».
                        {nbConflits > 0 && (
                            <span style={{ marginLeft: 8, color: 'var(--danger)', fontWeight: 700 }}>
                                <Icon name="alert-circle" size={12} style={{ marginRight: 4 }} />
                                {nbConflits} créneau{nbConflits > 1 ? 'x' : ''} en conflit
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {totalSeances > 0 && (
                        <button onClick={exportICS} className="btn btn-secondary" style={{ borderRadius: 12 }} title="Importable dans Google Agenda, Outlook, iPhone…">
                            <Icon name="download" size={15} />
                            Exporter (.ics)
                        </button>
                    )}
                    <button onClick={() => navigate('/etudiant/cours')} className="btn btn-primary" style={{ borderRadius: 12 }}>
                        <Icon name="edit-2" size={15} />
                        Gérer mes créneaux
                    </button>
                </div>
            </div>

            {totalSeances === 0 ? (
                <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)' }}>
                    <Empty
                        icon="calendar"
                        title="Emploi du temps vide"
                        description="Ajoutez des créneaux à vos cours (ex : jeudi 14h–19h) depuis la page Mes cours pour construire votre semaine."
                        action={
                            <button onClick={() => navigate(courses.length ? `/etudiant/cours?edit=${courses[0].id}` : '/etudiant/cours?new=1')} className="btn btn-primary">
                                <Icon name="plus" size={15} style={{ marginRight: 6 }} />
                                {courses.length ? 'Ajouter des horaires' : 'Créer un cours'}
                            </button>
                        }
                    />
                </div>
            ) : (
                /* ── Grille hebdomadaire ── */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    {JOURS.map(jour => {
                        const estAujourdhui = jour === jourActuel;
                        const seances = parJour[jour];
                        return (
                            <div key={jour} className="glass-card" style={{
                                padding: 14, borderRadius: 'var(--radius-lg)', minHeight: 220,
                                display: 'flex', flexDirection: 'column', gap: 10,
                                border: estAujourdhui ? '1.5px solid var(--primary)' : '1px solid var(--glass-border)',
                                boxShadow: estAujourdhui ? 'var(--shadow-glow-primary)' : undefined,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'capitalize', color: estAujourdhui ? 'var(--primary)' : 'var(--text-primary)' }}>
                                        {jour}
                                    </span>
                                    {estAujourdhui && (
                                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 999, letterSpacing: 0.5 }}>
                                            AUJOURD'HUI
                                        </span>
                                    )}
                                </div>

                                {seances.length === 0 ? (
                                    <p style={{ margin: 'auto 0', fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                                        Libre
                                    </p>
                                ) : seances.map((s, i) => {
                                    const color = THUMB_COLORS[s.cours.id % THUMB_COLORS.length];
                                    return (
                                        <div key={i}
                                            onClick={() => navigate(`/etudiant/cours?edit=${s.cours.id}`)}
                                            title={s.conflit ? `${s.cours.titre} — chevauche un autre créneau !` : `${s.cours.titre} — modifier`}
                                            style={{
                                                borderLeft: `3px solid ${s.conflit ? 'var(--danger)' : color}`,
                                                background: s.conflit ? 'var(--danger-soft)' : `${color}12`,
                                                borderRadius: '6px 10px 10px 6px',
                                                padding: '8px 10px', cursor: 'pointer',
                                            }}>
                                            <p style={{ margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {s.conflit && <Icon name="alert-circle" size={11} style={{ color: 'var(--danger)', marginRight: 4 }} />}
                                                {s.cours.titre}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: s.conflit ? 'var(--danger)' : color, fontFamily: 'monospace' }}>
                                                {s.debut} – {s.fin}
                                            </p>
                                            {s.cours.nom_professeur && (
                                                <p style={{ margin: '3px 0 0', fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {s.cours.nom_professeur}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Cours sans horaires ── */}
            {sansHoraires.length > 0 && totalSeances > 0 && (
                <div className="glass-card" style={{ padding: 18, borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Cours sans créneau ({sansHoraires.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {sansHoraires.map(c => (
                            <button key={c.id} onClick={() => navigate(`/etudiant/cours?edit=${c.id}`)}
                                className="btn btn-ghost"
                                style={{ fontSize: 12, padding: '6px 12px', border: '1px dashed var(--glass-border)' }}>
                                <Icon name="plus" size={11} style={{ marginRight: 5 }} />
                                {c.titre}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentTimetable;
