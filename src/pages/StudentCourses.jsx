import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { Empty, MessageBox } from '../components/Common';
import { mesCours } from '../services/api';
import { moyennesCours, fmt } from '../utils/grades';

// Palette de teintes pour les vignettes (choisie de façon stable par id)
const THUMB_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6'];

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const JOUR_COURT = { lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu', vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim' };

// Motif SVG abstrait déterministe (seed = id du cours)
const SvgPattern = ({ seed, color }) => {
    const variant = seed % 3;
    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
            <defs>
                <pattern id={`pattern-${seed}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    {variant === 0 && (<>
                        <circle cx="2" cy="2" r="2" fill={color} />
                        <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
                    </>)}
                    {variant === 1 && (<>
                        <rect x="2" y="2" width="6" height="6" rx="1" fill={color} opacity="0.6" />
                        <circle cx="15" cy="15" r="3" fill="none" stroke={color} strokeWidth="1" />
                    </>)}
                    {variant === 2 && (<>
                        <path d="M0 10 Q5 0 10 10 T20 10" fill="none" stroke={color} strokeWidth="1.2" />
                        <circle cx="10" cy="16" r="1.5" fill={color} />
                    </>)}
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pattern-${seed})`} />
        </svg>
    );
};

function StudentCourses() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [search, setSearch]   = useState('');

    // Modales
    const [showCreate, setShowCreate]   = useState(false);
    const [createForm, setCreateForm]   = useState({ titre: '', nom_professeur: '', description: '' });
    const [saving, setSaving]           = useState(false);
    const [gradeCourse, setGradeCourse] = useState(null);
    const [editCourse, setEditCourse]   = useState(null);
    const [confirmDel, setConfirmDel]   = useState(null);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await mesCours.lister();
            setCourses(res.data);
            return res.data;
        } catch (e) {
            setMessage({ text: 'Impossible de charger vos cours.', type: 'error' });
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses().then(data => {
            // Actions rapides depuis le tableau de bord / l'emploi du temps
            if (searchParams.get('new') === '1') setShowCreate(true);
            if (searchParams.get('notes') === '1') {
                if (data.length > 0) setGradeCourse(data[0]);
                else setShowCreate(true);
            }
            const editId = searchParams.get('edit');
            if (editId) {
                const c = data.find(x => String(x.id) === String(editId));
                if (c) setEditCourse(c);
            }
            if (searchParams.get('new') || searchParams.get('notes') || searchParams.get('edit')) {
                setSearchParams({}, { replace: true });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flash = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // ── Création ──
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.titre.trim()) return;
        setSaving(true);
        try {
            const res = await mesCours.creer(createForm);
            setCourses(p => [res.data.cours, ...p]);
            setShowCreate(false);
            setCreateForm({ titre: '', nom_professeur: '', description: '' });
            flash('Cours créé avec succès');
        } catch (err) {
            flash(err.response?.data?.message || 'Erreur lors de la création', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Mise à jour (infos ou notes) ──
    const applyUpdate = async (courseId, payload, successMsg) => {
        try {
            const res = await mesCours.modifier(courseId, payload);
            setCourses(p => p.map(c => c.id === courseId ? res.data.cours : c));
            flash(successMsg);
            return true;
        } catch (err) {
            flash(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
            return false;
        }
    };

    const handleSaveGrades = async (courseId, interros, devoirs) => {
        const ok = await applyUpdate(courseId, { notes_interrogation: interros, notes_devoir: devoirs }, 'Notes enregistrées');
        if (ok) setGradeCourse(null);
    };

    const handleSaveInfos = async (courseId, infos) => {
        const ok = await applyUpdate(courseId, infos, 'Cours mis à jour');
        if (ok) setEditCourse(null);
    };

    // ── Suppression ──
    const handleDelete = async (courseId) => {
        try {
            await mesCours.supprimer(courseId);
            setCourses(p => p.filter(c => c.id !== courseId));
            flash('Cours supprimé');
        } catch {
            flash('Erreur lors de la suppression', 'error');
        }
        setConfirmDel(null);
    };

    // ── Partage : lien PUBLIC (lisible sans compte, lecture seule) ──
    const handleShare = async (course) => {
        try {
            const res = await mesCours.lienPartage(course.id);
            const link = `${window.location.origin}/partage/${res.data.share_token}`;
            await navigator.clipboard.writeText(link).catch(() => {});
            flash(`Lien public de "${course.titre}" copié — lisible même sans compte Wii-Co !`);
        } catch {
            flash('Impossible de générer le lien de partage.', 'error');
        }
    };

    const filtered = courses.filter(c =>
        c.titre.toLowerCase().includes(search.toLowerCase()) ||
        (c.nom_professeur || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <MessageBox message={message} />

            {/* ── En-tête : accès éditeur global + recherche + nouveau ── */}
            <div className="glass-card" style={{ padding: '20px 26px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)', border: '1px solid var(--glass-border-hover)' }}>
                <div style={{ minWidth: 220 }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>Mon Plan d'Étude</h3>
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 560 }}>
                        Votre carnet unique : rédigez vos cours, suivez vos notes et organisez vos créneaux.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text" placeholder="Rechercher un cours..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="input"
                            style={{ padding: '9px 14px 9px 34px', borderRadius: 999, width: 190, fontSize: 13 }}
                        />
                    </div>
                    <button onClick={() => navigate('/etudiant/cours/editeur')} className="btn btn-secondary" style={{ borderRadius: 12 }}>
                        <Icon name="edit-3" size={16} />
                        Éditeur libre
                    </button>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ borderRadius: 12 }}>
                        <Icon name="plus" size={16} />
                        Nouveau cours
                    </button>
                </div>
            </div>

            {/* ── Statistiques rapides ── */}
            {courses.length > 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                    <MiniStat value={courses.length} label="Total" />
                    <MiniStat value={courses.filter(c => c.statut === 'termine').length} label="Terminés" color="var(--success)" bg="var(--success-soft)" />
                    <MiniStat value={courses.filter(c => c.statut === 'en_cours').length} label="En cours" color="var(--info)" bg="var(--info-soft)" />
                    <MiniStat value={courses.filter(c => c.statut === 'a_venir').length} label="À venir" color="var(--text-muted)" dashed />
                </div>
            )}

            {/* ── Liste des Cours (Grille) ── */}
            {loading ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chargement de vos cours…</p>
            ) : courses.length === 0 ? (
                <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)' }}>
                    <Empty
                        icon="book-open"
                        title="Aucun cours pour l'instant"
                        description="Créez votre premier cours pour commencer à rédiger vos notes et suivre vos moyennes."
                        action={
                            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                                <Icon name="plus" size={16} style={{ marginRight: 6 }} />
                                Créer mon premier cours
                            </button>
                        }
                    />
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {filtered.map(course => {
                        const color = THUMB_COLORS[course.id % THUMB_COLORS.length];
                        const interros = course.notes_interrogation || [];
                        const devoirs  = course.notes_devoir || [];
                        const horaires = course.horaires || [];
                        const { interro, devoir, generale } = moyennesCours(course);
                        const done = generale !== null;

                        return (
                            <div key={course.id} className="glass-card interactive" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                                {/* Thumbnail (SVG Pattern) + boutons modifier/supprimer */}
                                <div style={{ height: 110, position: 'relative', background: `${color}15`, borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-end', padding: '16px 20px' }}>
                                    <SvgPattern seed={course.id} color={color} />
                                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 2 }}>
                                        <button onClick={() => setEditCourse(course)} className="btn btn-ghost" title="Modifier les infos du cours"
                                            style={{ width: 30, height: 30, padding: 0, borderRadius: 9, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(8px)' }}>
                                            <Icon name="edit-2" size={13} />
                                        </button>
                                        <button onClick={() => setConfirmDel(course)} className="btn btn-ghost" title="Supprimer le cours"
                                            style={{ width: 30, height: 30, padding: 0, borderRadius: 9, background: 'var(--glass-bg-strong)', backdropFilter: 'blur(8px)', color: 'var(--danger)' }}>
                                            <Icon name="trash-2" size={13} />
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative', zIndex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.titre}</h4>
                                        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                                            <Icon name="user" size={11} style={{ marginRight: 5 }} />
                                            {course.nom_professeur || 'Professeur non renseigné'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                                    {/* Horaires */}
                                    {horaires.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {horaires.map((h, i) => (
                                                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--info)', background: 'var(--info-soft)', padding: '3px 10px', borderRadius: 999 }}>
                                                    <Icon name="clock" size={10} />
                                                    {JOUR_COURT[h.jour] || h.jour} {h.debut}–{h.fin}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <button onClick={() => setEditCourse(course)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--glass-border)', padding: '3px 10px', borderRadius: 999, cursor: 'pointer' }}>
                                            <Icon name="plus" size={10} />
                                            Ajouter des horaires
                                        </button>
                                    )}

                                    {/* Résumé des notes */}
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <div style={{ flex: 1, background: 'var(--glass-bg-light)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                            <p style={{ margin: '0 0 2px', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Interros ({interros.length})</p>
                                            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(interro)}</p>
                                        </div>
                                        <div style={{ flex: 1, background: 'var(--glass-bg-light)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                                            <p style={{ margin: '0 0 2px', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Devoirs ({devoirs.length})</p>
                                            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(devoir)}</p>
                                        </div>
                                        <div onClick={() => setGradeCourse(course)} title="Saisir des notes" style={{ flex: 1, background: done ? 'var(--success-soft)' : 'var(--glass-bg-light)', padding: '10px 12px', borderRadius: 12, border: `1px solid ${done ? 'rgba(14,165,233,0.3)' : 'var(--glass-border)'}`, cursor: 'pointer' }}>
                                            <p style={{ margin: '0 0 2px', fontSize: 10.5, textTransform: 'uppercase', color: done ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>Moyenne</p>
                                            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: done ? 'var(--success)' : 'var(--text-secondary)' }}>{done ? fmt(generale) : '—'}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                                        <button onClick={() => navigate(`/etudiant/cours/editeur?id=${course.id}`)} className="btn btn-secondary" style={{ flex: 1, fontSize: 12, padding: '9px' }}>
                                            <Icon name="edit-2" size={13} />
                                            Écrire
                                        </button>
                                        <button onClick={() => navigate(`/etudiant/cours/editeur?id=${course.id}&read=1`)} className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '9px', background: 'var(--glass-bg-light)' }}>
                                            <Icon name="book-open" size={13} />
                                            Lire
                                        </button>
                                        <button onClick={() => setGradeCourse(course)} className="btn btn-ghost" style={{ width: 38, padding: 0, background: 'var(--glass-bg-light)' }} title="Saisir des notes">
                                            <Icon name="star" size={15} />
                                        </button>
                                        <button onClick={() => handleShare(course)} className="btn btn-ghost" style={{ width: 38, padding: 0, background: 'var(--glass-bg-light)' }} title="Partager à un camarade">
                                            <Icon name="share-2" size={15} />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                    {/* Carte "Ajouter" */}
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{ minHeight: 240, border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all .2s', color: 'var(--text-muted)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-soft)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="plus" size={22} style={{ color: 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Ajouter un cours</span>
                    </button>
                </div>
            )}

            {/* ── Modal : Nouveau cours ── */}
            {showCreate && (
                <Modal onClose={() => setShowCreate(false)} title="Nouveau cours">
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label>Nom du cours / matière *</label>
                            <input autoFocus type="text" className="input" value={createForm.titre} required
                                onChange={e => setCreateForm(f => ({ ...f, titre: e.target.value }))}
                                placeholder="Ex : Mathématiques" />
                        </div>
                        <div className="form-group">
                            <label>Nom du professeur</label>
                            <input type="text" className="input" value={createForm.nom_professeur}
                                onChange={e => setCreateForm(f => ({ ...f, nom_professeur: e.target.value }))}
                                placeholder="Ex : M. Dupont" />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <input type="text" className="input" value={createForm.description}
                                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Courte description..." />
                        </div>
                        <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 4 }}>
                            {saving ? 'Création…' : 'Créer le cours'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* ── Modal : Modifier les infos ── */}
            {editCourse && (
                <EditCourseModal
                    course={editCourse}
                    onClose={() => setEditCourse(null)}
                    onSave={handleSaveInfos}
                />
            )}

            {/* ── Modal : Saisie de notes ── */}
            {gradeCourse && (
                <GradeModal
                    course={gradeCourse}
                    onClose={() => setGradeCourse(null)}
                    onSave={handleSaveGrades}
                />
            )}

            {/* ── Confirmation suppression ── */}
            {confirmDel && (
                <Modal title="Supprimer ce cours ?" onClose={() => setConfirmDel(null)}>
                    <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)' }}>
                        « {confirmDel.titre} » et toutes ses notes seront définitivement supprimés.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setConfirmDel(null)} className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
                        <button onClick={() => handleDelete(confirmDel.id)} className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff', fontWeight: 700 }}>
                            <Icon name="trash-2" size={14} style={{ marginRight: 6 }} />
                            Supprimer
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

/* ============================================================
   Mini statistique
   ============================================================ */
function MiniStat({ value, label, color = 'var(--text-primary)', bg = 'var(--glass-bg-light)', dashed }) {
    return (
        <div style={{ flex: 1, background: bg, borderRadius: 14, padding: '12px 16px', border: dashed ? '2px dashed var(--glass-border)' : '1px solid var(--glass-border)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color, opacity: 0.7 }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color }}>{value}</p>
        </div>
    );
}

/* ============================================================
   Modal générique
   ============================================================ */
function Modal({ title, onClose, children, wide }) {
    return (
        <div onClick={e => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)' }}>
            <div className="glass-card" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 28, width: '100%', maxWidth: wide ? 560 : 460, maxHeight: '88vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h2>
                    <button onClick={onClose} className="btn btn-ghost" style={{ padding: 8, borderRadius: 10 }}>
                        <Icon name="x" size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* ============================================================
   Modal : modifier les infos d'un cours
   (prof, description, emploi du temps du cours)
   ============================================================ */
function EditCourseModal({ course, onClose, onSave }) {
    const [form, setForm] = useState({
        titre: course.titre || '',
        nom_professeur: course.nom_professeur || '',
        description: course.description || '',
    });
    const [horaires, setHoraires] = useState(course.horaires || []);
    const [saving, setSaving] = useState(false);

    const setSlot = (i, key, value) => {
        setHoraires(h => h.map((s, j) => j === i ? { ...s, [key]: value } : s));
    };

    const addSlot = () => setHoraires(h => [...h, { jour: 'lundi', debut: '08:00', fin: '10:00' }]);
    const removeSlot = (i) => setHoraires(h => h.filter((_, j) => j !== i));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.titre.trim()) return;
        setSaving(true);
        await onSave(course.id, { ...form, horaires });
        setSaving(false);
    };

    return (
        <Modal title={`Modifier — ${course.titre}`} onClose={onClose} wide>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                    <label>Nom du cours / matière *</label>
                    <input type="text" className="input" value={form.titre} required
                        onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
                </div>
                <div className="form-group">
                    <label>Nom du professeur</label>
                    <input type="text" className="input" value={form.nom_professeur}
                        onChange={e => setForm(f => ({ ...f, nom_professeur: e.target.value }))}
                        placeholder="Ex : M. Dupont" />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <input type="text" className="input" value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Courte description..." />
                </div>

                {/* Emploi du temps du cours */}
                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Emploi du temps du cours
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {horaires.length === 0 && (
                            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Aucun créneau — ajoutez par ex. « jeudi 14:00 – 19:00 ».
                            </p>
                        )}
                        {horaires.map((h, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <select className="select" value={h.jour} onChange={e => setSlot(i, 'jour', e.target.value)} style={{ flex: 1.4, padding: '8px 10px', fontSize: 13, textTransform: 'capitalize' }}>
                                    {JOURS.map(j => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
                                </select>
                                <input type="time" className="input" value={h.debut} onChange={e => setSlot(i, 'debut', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: 13 }} />
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                                <input type="time" className="input" value={h.fin} onChange={e => setSlot(i, 'fin', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: 13 }} />
                                <button type="button" onClick={() => removeSlot(i)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0, color: 'var(--danger)', flexShrink: 0 }}>
                                    <Icon name="x" size={14} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addSlot} className="btn btn-ghost" style={{ alignSelf: 'flex-start', fontSize: 12.5, padding: '7px 14px', border: '1px dashed var(--glass-border)' }}>
                            <Icon name="plus" size={13} style={{ marginRight: 6 }} />
                            Ajouter un créneau
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 4 }}>
                    <Icon name="save" size={15} style={{ marginRight: 6 }} />
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
            </form>
        </Modal>
    );
}

/* ============================================================
   Modal de saisie des notes (interros + devoirs)
   ============================================================ */
function GradeModal({ course, onClose, onSave }) {
    const [interros, setInterros] = useState(course.notes_interrogation || []);
    const [devoirs, setDevoirs]   = useState(course.notes_devoir || []);
    const [newInterro, setNewInterro] = useState('');
    const [newDevoir, setNewDevoir]   = useState('');
    const [saving, setSaving] = useState(false);

    const addNote = (value, setter, list, resetInput) => {
        const n = parseFloat(String(value).replace(',', '.'));
        if (Number.isNaN(n) || n < 0 || n > 20) return;
        setter([...list, n]);
        resetInput('');
    };

    const { interro, devoir, generale } = moyennesCours({ notes_interrogation: interros, notes_devoir: devoirs });

    // Appelées comme fonctions (pas comme composants JSX) pour éviter
    // le re-montage des inputs à chaque frappe (perte de focus).
    const renderChips = (notes, onRemove) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 30 }}>
            {notes.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Aucune note saisie</span>}
            {notes.map((n, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--primary-soft)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                    {n}
                    <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
                        <Icon name="x" size={11} />
                    </button>
                </span>
            ))}
        </div>
    );

    const renderInput = (value, onChange, onAdd, placeholder) => (
        <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min="0" max="20" step="0.25" className="input" value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
                placeholder={placeholder} style={{ flex: 1 }} />
            <button type="button" onClick={onAdd} className="btn btn-secondary" style={{ padding: '0 16px' }}>
                <Icon name="plus" size={15} />
            </button>
        </div>
    );

    return (
        <Modal title={`Notes — ${course.titre}`} onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Interrogations {interro !== null && <span style={{ color: 'var(--primary)' }}>· moy. {fmt(interro)}</span>}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {renderChips(interros, i => setInterros(interros.filter((_, j) => j !== i)))}
                        {renderInput(newInterro, setNewInterro,
                            () => addNote(newInterro, setInterros, interros, setNewInterro),
                            'Note /20')}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                        Devoirs {devoir !== null && <span style={{ color: 'var(--primary)' }}>· moy. {fmt(devoir)}</span>}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {renderChips(devoirs, i => setDevoirs(devoirs.filter((_, j) => j !== i)))}
                        {renderInput(newDevoir, setNewDevoir,
                            () => addNote(newDevoir, setDevoirs, devoirs, setNewDevoir),
                            'Note /20')}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: generale !== null ? 'var(--success-soft)' : 'var(--glass-bg-light)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: generale !== null ? 'var(--success)' : 'var(--text-secondary)' }}>Moyenne de la matière</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: generale !== null ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {generale !== null ? `${fmt(generale)} / 20` : 'Min. 1 interro + 1 devoir'}
                    </span>
                </div>

                <button
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={async () => { setSaving(true); await onSave(course.id, interros, devoirs); setSaving(false); }}
                >
                    <Icon name="save" size={15} style={{ marginRight: 6 }} />
                    {saving ? 'Enregistrement…' : 'Enregistrer les notes'}
                </button>
            </div>
        </Modal>
    );
}

export default StudentCourses;
