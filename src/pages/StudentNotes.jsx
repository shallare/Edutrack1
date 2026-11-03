import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../components/Common';
import api, { mesCours } from '../services/api';

// ─── Palettes ──────────────────────────────────────────────────────────────────
const COULEURS = [
    '#ffffff', '#f3e8ff', '#dcfce7', '#dbeafe',
    '#fef3c7', '#fce7f3', '#ffedd5', '#e0f2fe',
];

const STATUTS = {
    a_venir:  { label: 'À venir',   bg: 'transparent', border: '#cbd5e1', color: '#64748b',  icon: 'clock'       },
    en_cours: { label: 'En cours',  bg: '#dbeafe',     border: '#93c5fd', color: '#1d4ed8',  icon: 'book-open'   },
    termine:  { label: 'Terminé',   bg: '#dcfce7',     border: '#86efac', color: '#166534',  icon: 'check-circle'},
};

// ─── Composant principal ───────────────────────────────────────────────────────
export default function StudentNotes() {
    const { user, ready } = useAuth(['etudiant', 'delegue'], '/etudiant/login');
    const navigate      = useNavigate();
    const [searchParams] = useSearchParams();

    const [cours, setCours]                   = useState([]);
    const [coursAcad, setCoursAcad]           = useState([]);
    const [loading, setLoading]               = useState(true);
    const [search, setSearch]                 = useState('');
    const [showDropdown, setShowDropdown]     = useState(false);
    const [showModal, setShowModal]           = useState(false);
    const [form, setForm]                     = useState({ titre: '', description: '', couleur: '#ffffff', statut: 'a_venir' });
    const [formErr, setFormErr]               = useState('');
    const [saving, setSaving]                 = useState(false);
    const [coursActif, setCoursActif]         = useState(null);
    const [editData, setEditData]             = useState({});
    const [saveStatus, setSaveStatus]         = useState('');   // '' | 'saving' | 'saved'
    const [confirmDel, setConfirmDel]         = useState(null);
    const timerRef                            = useRef(null);
    const dropdownRef                         = useRef(null);

    // ── Chargement ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!ready || !user) return;
        (async () => {
            setLoading(true);
            try {
                const [r1, r2] = await Promise.all([mesCours.lister(), api.get('/etudiant/cours')]);
                setCours(r1.data);
                setCoursAcad(r2.data.slice(0, 6));
            } catch (_) {}
            finally { setLoading(false); }
        })();
    }, [ready, user]);

    // Fermer dropdown au clic extérieur
    useEffect(() => {
        function handle(e) { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Ouvrir le modal si on arrive depuis le dashboard avec ?new=1
    useEffect(() => {
        if (searchParams.get('new') === '1') {
            setShowModal(true);
            setFormErr('');
        }
    }, [searchParams]);

    // ── Dérivés ─────────────────────────────────────────────────────────────────
    const filtered  = cours.filter(c =>
        c.titre.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );
    const total     = cours.length;
    const termine   = cours.filter(c => c.statut === 'termine').length;
    const aVenir    = cours.filter(c => c.statut === 'a_venir').length;

    // ── Auth / Logout ───────────────────────────────────────────────────────────
    async function logout() {
        try { await api.post('/logout'); } catch (_) {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    }

    // ── CRUD ────────────────────────────────────────────────────────────────────
    async function creer(e) {
        e.preventDefault();
        if (!form.titre.trim()) { setFormErr('Le titre est obligatoire.'); return; }
        setSaving(true); setFormErr('');
        try {
            const res = await mesCours.creer(form);
            const c   = res.data.cours;
            setCours(p => [c, ...p]);
            setShowModal(false);
            setForm({ titre: '', description: '', couleur: '#ffffff', statut: 'a_venir' });
            ouvrir(c);
        } catch (e) { setFormErr(e.response?.data?.message || 'Erreur.'); }
        finally { setSaving(false); }
    }

    async function supprimer(id) {
        try {
            await mesCours.supprimer(id);
            setCours(p => p.filter(c => c.id !== id));
            if (coursActif?.id === id) fermer();
        } catch (_) {}
        setConfirmDel(null);
    }

    // ── Éditeur ─────────────────────────────────────────────────────────────────
    function ouvrir(c) {
        setCoursActif(c);
        setEditData({ titre: c.titre, description: c.description || '', contenu: c.contenu || '', statut: c.statut, couleur: c.couleur });
        setSaveStatus('');
    }
    function fermer() {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCoursActif(null); setEditData({}); setSaveStatus('');
    }

    async function sauvegarder(data) {
        if (!coursActif) return;
        try {
            const res = await mesCours.modifier(coursActif.id, data);
            const mis  = res.data.cours;
            setCours(p => p.map(c => c.id === coursActif.id ? mis : c));
            setCoursActif(mis);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2500);
        } catch (_) { setSaveStatus(''); }
    }

    const autoSave = useCallback((data) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setSaveStatus('saving');
        timerRef.current = setTimeout(() => sauvegarder(data), 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coursActif]);

    function onChange(k, v) {
        const d = { ...editData, [k]: v };
        setEditData(d);
        autoSave(d);
    }

    async function saveNow() {
        if (timerRef.current) clearTimeout(timerRef.current);
        await sauvegarder(editData);
    }

    // ── Statut rapide depuis la carte ────────────────────────────────────────────
    async function toggleStatut(c, e) {
        e.stopPropagation();
        const next = c.statut === 'termine' ? 'a_venir' : c.statut === 'a_venir' ? 'en_cours' : 'termine';
        try {
            const res = await mesCours.modifier(c.id, { ...c, statut: next });
            setCours(p => p.map(x => x.id === c.id ? res.data.cours : x));
            if (coursActif?.id === c.id) setCoursActif(res.data.cours);
        } catch (_) {}
    }

    // ─────────────────────────────────────────────────────────────────────────────
    if (!ready) return (
        <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f6fc' }}>
            <div style={{ width:44, height:44, border:'3px solid #6d28d9', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight:'100vh', background:'#e8f4fb', fontFamily:"'Inter',system-ui,sans-serif" }}>

            {/* ══ TOPBAR SOMBRE ══════════════════════════════════════════════ */}
            <header className="notes-topbar-header" style={{
                height:64, background:'#111111',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'0 28px', position:'sticky', top:0, zIndex:200,
            }}>
                {/* Bouton retour + titre */}
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <button
                        onClick={() => navigate('/etudiant/dashboard')}
                        style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'8px 16px', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                    >
                        <Icon name="arrow-left" size={15} style={{ color:'#fff' }} />
                        <span className="notes-back-label">Retour au tableau de bord</span>
                    </button>
                </div>

                {/* Titre centré */}
                <div className="notes-title-bar" style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Icon name="book-open" size={18} style={{ color:'rgba(255,255,255,0.7)' }} />
                    <span style={{ color:'#fff', fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>Mon Plan d'Étude</span>
                </div>

                {/* Profil + Déconnexion (dropdown) */}
                <div ref={dropdownRef} style={{ position:'relative' }}>
                    <button
                        onClick={() => setShowDropdown(v => !v)}
                        style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:'6px 10px', borderRadius:12 }}
                    >
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'#6d28d9', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                            {user?.nom_complet?.[0]?.toUpperCase() || 'E'}
                        </div>
                        <div style={{ textAlign:'left' }}>
                            <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#fff', lineHeight:1.2 }}>{user?.nom_complet}</p>
                            <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.2 }}>{user?.email}</p>
                        </div>
                        <Icon name="chevron-down" size={14} style={{ color:'rgba(255,255,255,0.5)', marginLeft:4 }} />
                    </button>
                    {showDropdown && (
                        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'#fff', borderRadius:14, boxShadow:'0 12px 40px rgba(0,0,0,0.15)', border:'1px solid #f1f5f9', minWidth:180, overflow:'hidden', zIndex:300 }}>
                            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f1f5f9' }}>
                                <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#0f172a' }}>{user?.nom_complet}</p>
                                <p style={{ margin:0, fontSize:11, color:'#94a3b8' }}>{user?.matricule}</p>
                            </div>
                            <button onClick={logout} style={{ width:'100%', padding:'12px 16px', border:'none', background:'none', display:'flex', alignItems:'center', gap:10, color:'#dc2626', fontWeight:600, fontSize:13, cursor:'pointer', textAlign:'left' }}
                                onMouseEnter={e => e.currentTarget.style.background='#fff5f5'}
                                onMouseLeave={e => e.currentTarget.style.background='none'}
                            >
                                <Icon name="log-out" size={15} />
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ══ CORPS ══════════════════════════════════════════════════════ */}
            <div className="notes-body-wrap" style={{ display:'flex', gap:0, padding:'24px 20px', maxWidth:1440, margin:'0 auto' }}>

                {/* ── Bande icônes gauche ─────────────────────────────────── */}
                <aside className="notes-strip-left" style={{ width:56, display:'flex', flexDirection:'column', alignItems:'center', gap:8, paddingTop:4, marginRight:16, flexShrink:0 }}>
                    {/* Avatar */}
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'#1e1b4b', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:15, marginBottom:4 }}>
                        {user?.nom_complet?.[0]?.toUpperCase() || 'E'}
                    </div>
                    {[
                        { icon:'menu',  title:'Menu'  },
                        { icon:'grid',  title:'Vue'   },
                    ].map(b => (
                        <IconBtn key={b.icon} icon={b.icon} title={b.title} />
                    ))}
                    <div style={{ flexGrow:1 }} />
                    {/* Cloche avec badge */}
                    <div style={{ position:'relative' }}>
                        <IconBtn icon="bell" title="Notifications" />
                        <span style={{ position:'absolute', top:2, right:2, width:14, height:14, borderRadius:'50%', background:'#f59e0b', color:'#fff', fontSize:8, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #e8f4fb' }}>
                            {cours.filter(c => c.statut === 'a_venir').length || 0}
                        </span>
                    </div>
                    <IconBtn icon="plus"  title="Ajouter"   onClick={() => { setShowModal(true); setFormErr(''); }} filled />
                    <IconBtn icon="minus" title="Réduire" />
                </aside>

                {/* ── Panneau principal ───────────────────────────────────── */}
                <main className="notes-main-panel" style={{ flex:1, background:'#fff', borderRadius:24, padding:'28px 28px 100px', minHeight:'calc(100vh - 112px)', position:'relative', overflow:'hidden' }}>

                    {/* En-tête */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Icon name="book-open" size={22} style={{ color:'#1e1b4b' }} />
                            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#0f172a' }}>Mon Plan d'Étude</h1>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            {/* Barre de recherche */}
                            <div style={{ position:'relative' }}>
                                <Icon name="search" size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                                <input
                                    type="text" placeholder="Rechercher..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    style={{ padding:'9px 14px 9px 36px', borderRadius:999, border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:13, outline:'none', width:200, color:'#1e293b' }}
                                />
                            </div>
                            {/* Bouton ajouter */}
                            <button
                                onClick={() => { setShowModal(true); setFormErr(''); }}
                                style={{ width:38, height:38, borderRadius:'50%', background:'#22c55e', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 12px rgba(34,197,94,0.35)', flexShrink:0 }}
                                title="Ajouter un cours"
                            >
                                <Icon name="plus" size={20} style={{ color:'#fff' }} />
                            </button>
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div style={{ display:'flex', gap:12, marginBottom:28 }}>
                        <StatBox value={total}  label="Total"   bg="#f1f5f9" color="#475569" />
                        <StatBox value={termine} label="Terminés" bg="#dcfce7" color="#166534" icon="check-circle" highlight />
                        <StatBox value={aVenir}  label="À venir"  bg="transparent" color="#64748b" dashed />
                    </div>

                    {/* Grille de cours */}
                    {loading ? (
                        <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
                            <div style={{ width:40, height:40, border:'3px solid #6d28d9', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                        </div>
                    ) : (
                        <div className="notes-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20, position:'relative' }}>
                            {/* Ligne pointillée décorative */}
                            <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} preserveAspectRatio="none">
                                <path d="M 60 80 Q 200 40 340 120 Q 480 200 340 300 Q 200 400 400 480" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 6" fill="none" opacity=".35" />
                            </svg>

                            {filtered.map((c, i) => (
                                <CourseCard
                                    key={c.id}
                                    cours={c}
                                    featured={c.statut === 'en_cours' && i === filtered.findIndex(x => x.statut === 'en_cours')}
                                    onClick={() => ouvrir(c)}
                                    onDelete={e => { e.stopPropagation(); setConfirmDel(c.id); }}
                                    onToggle={e => toggleStatut(c, e)}
                                />
                            ))}

                            {/* Carte "Ajouter" */}
                            <button
                                onClick={() => { setShowModal(true); setFormErr(''); }}
                                style={{ minHeight:200, border:'2px dashed #e2e8f0', borderRadius:20, background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', transition:'all .2s', zIndex:1 }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor='#6d28d9'; e.currentTarget.style.background='#faf5ff'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.background='transparent'; }}
                            >
                                <div style={{ width:44, height:44, borderRadius:'50%', background:'#ede9fe', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                    <Icon name="plus" size={22} style={{ color:'#6d28d9' }} />
                                </div>
                                <span style={{ fontSize:13, fontWeight:600, color:'#94a3b8' }}>Ajouter un cours</span>
                            </button>

                            {cours.length === 0 && !loading && (
                                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'#94a3b8' }}>
                                    <Icon name="book-open" size={48} style={{ color:'#e2e8f0', display:'block', margin:'0 auto 16px' }} />
                                    <p style={{ fontWeight:600, fontSize:15, color:'#475569', margin:'0 0 4px' }}>Aucun cours pour l'instant</p>
                                    <p style={{ fontSize:13, margin:0 }}>Cliquez sur le bouton + pour commencer</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Barre flottante bas ──── */}
                    <div style={{
                        position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
                        background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)',
                        borderRadius:999, padding:'8px 12px',
                        display:'flex', alignItems:'center', gap:6,
                        boxShadow:'0 8px 32px rgba(0,0,0,0.12)', border:'1px solid rgba(255,255,255,0.8)',
                        zIndex:10,
                    }}>
                        {/* Ouvrir le premier cours en édition */}
                        <button onClick={() => filtered[0] && ouvrir(filtered[0])} title="Ouvrir un cours"
                            style={{ width:40, height:40, borderRadius:'50%', border:'none', background:'#dbeafe', color:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform .15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                        >
                            <Icon name="edit" size={17} />
                        </button>
                        <button onClick={() => { setShowModal(true); setFormErr(''); }} title="Nouveau cours"
                            style={{ width:40, height:40, borderRadius:'50%', border:'none', background:'#dcfce7', color:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform .15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                        >
                            <Icon name="book-open" size={17} />
                        </button>
                        <button title="Rechercher" onClick={() => document.querySelector('input[placeholder="Rechercher..."]')?.focus()}
                            style={{ width:40, height:40, borderRadius:'50%', border:'none', background:'#f3e8ff', color:'#7c3aed', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'transform .15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
                            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                        >
                            <Icon name="search" size={16} />
                        </button>
                        <div style={{ width:1, height:24, background:'#e2e8f0', margin:'0 2px' }} />
                        <button style={{ width:40, height:40, borderRadius:'50%', border:'none', background:'#111', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                            onClick={() => { setShowModal(true); setFormErr(''); }} title="Nouveau cours">
                            <Icon name="plus" size={18} />
                        </button>
                        <button style={{ width:38, height:38, borderRadius:'50%', border:'1.5px solid #e2e8f0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'default' }} title="Page privée">
                            <Icon name="lock" size={14} style={{ color:'#94a3b8' }} />
                        </button>
                    </div>
                </main>

                {/* ── Panneau événements (droite) ─────────────────────────── */}
                <aside className="notes-aside-panel" style={{ width:300, marginLeft:16, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                        <Icon name="calendar" size={18} style={{ color:'#1e1b4b' }} />
                        <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#0f172a' }}>Mes Événements</h2>
                    </div>

                    {coursAcad.length === 0 ? (
                        <div style={{ background:'#fff', borderRadius:18, padding:20, textAlign:'center', color:'#94a3b8', border:'1px solid #f1f5f9' }}>
                            <Icon name="book" size={32} style={{ color:'#e2e8f0', display:'block', margin:'0 auto 8px' }} />
                            <p style={{ fontSize:13, margin:0, fontWeight:500 }}>Aucun cours académique</p>
                        </div>
                    ) : coursAcad.map((c, i) => {
                        const palettes = [
                            { bg:'#eff6ff', icon:'graduation-cap', badge:'Cours',    badgeBg:'#bfdbfe', badgeColor:'#1d4ed8' },
                            { bg:'#f5f3ff', icon:'book-open',      badge:'Leçon',    badgeBg:'#ddd6fe', badgeColor:'#6d28d9' },
                            { bg:'#fef3c7', icon:'edit',           badge:'Exercice', badgeBg:'#fde68a', badgeColor:'#d97706' },
                            { bg:'#dcfce7', icon:'check-circle',   badge:'Validé',   badgeBg:'#bbf7d0', badgeColor:'#16a34a' },
                            { bg:'#fce7f3', icon:'star',           badge:'Éval',     badgeBg:'#fbcfe8', badgeColor:'#db2777' },
                            { bg:'#f0fdf4', icon:'clipboard-check',badge:'Cours',    badgeBg:'#bbf7d0', badgeColor:'#15803d' },
                        ];
                        const pal = palettes[i % palettes.length];
                        return (
                            <div key={c.id} style={{ background:pal.bg, borderRadius:18, padding:16, border:'1px solid rgba(0,0,0,0.04)' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <div style={{ width:30, height:30, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
                                            <Icon name={pal.icon} size={14} style={{ color:pal.badgeColor }} />
                                        </div>
                                        <span style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>{pal.badge}</span>
                                    </div>
                                    <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>
                                        {c.date ? new Date(c.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : ''}
                                    </span>
                                </div>
                                <p style={{ margin:'0 0 8px', fontSize:13, fontWeight:700, color:'#0f172a', lineHeight:1.3 }}>{c.titre_chapitre}</p>
                                {c.resume && (
                                    <p style={{ margin:'0 0 10px', fontSize:11, color:'#64748b', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{c.resume}</p>
                                )}
                                {c.heure_debut && (
                                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:700, color:'#475569', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                                        <Icon name="clock" size={11} />
                                        Début à {c.heure_debut}
                                    </div>
                                )}
                                <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:4, background:pal.badgeBg, padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700, color:pal.badgeColor }}>
                                    <Icon name="book" size={9} />
                                    {c.classe?.nom}
                                </div>
                            </div>
                        );
                    })}

                    {/* Conseil */}
                    <div style={{ marginTop:4, background:'#f5f3ff', borderRadius:16, padding:16, border:'1px dashed #c4b5fd' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                            <Icon name="info" size={14} style={{ color:'#6d28d9' }} />
                            <span style={{ fontSize:12, fontWeight:700, color:'#6d28d9' }}>Conseil</span>
                        </div>
                        <p style={{ margin:0, fontSize:12, color:'#5b21b6', lineHeight:1.5 }}>
                            Révisez régulièrement vos notes après chaque cours pour une meilleure mémorisation.
                        </p>
                    </div>
                </aside>
            </div>

            {/* ══ MODAL AJOUT ════════════════════════════════════════════════ */}
            {showModal && (
                <div onClick={e => e.target===e.currentTarget && setShowModal(false)}
                    style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
                    <div style={{ background:'#fff', borderRadius:24, padding:32, width:'100%', maxWidth:460, boxShadow:'0 24px 60px rgba(0,0,0,0.15)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                            <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:'#0f172a' }}>Nouveau cours</h2>
                            <button onClick={() => setShowModal(false)} style={{ width:32, height:32, borderRadius:8, border:'none', background:'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon name="x" size={15} style={{ color:'#64748b' }} />
                            </button>
                        </div>
                        <form onSubmit={creer} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                            {formErr && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', color:'#dc2626', fontSize:13 }}>{formErr}</div>}
                            <Field label="Titre *">
                                <input autoFocus type="text" value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))} placeholder="Ex: Mathématiques — Chapitre 3"
                                    style={inputStyle} />
                            </Field>
                            <Field label="Description">
                                <input type="text" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Courte description..."
                                    style={inputStyle} />
                            </Field>
                            <Field label="Couleur de la carte">
                                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                    {COULEURS.map(h => (
                                        <button type="button" key={h} onClick={()=>setForm(f=>({...f,couleur:h}))}
                                            style={{ width:30, height:30, borderRadius:8, background:h, border: form.couleur===h ? '2.5px solid #6d28d9' : '1.5px solid #e2e8f0', cursor:'pointer', boxShadow: form.couleur===h ? '0 0 0 3px #ede9fe' : 'none' }} />
                                    ))}
                                </div>
                            </Field>
                            <Field label="Statut">
                                <div style={{ display:'flex', gap:8 }}>
                                    {Object.entries(STATUTS).map(([k,s]) => (
                                        <button type="button" key={k} onClick={()=>setForm(f=>({...f,statut:k}))}
                                            style={{ flex:1, padding:'8px', borderRadius:10, border: form.statut===k ? `2px solid ${s.color}` : '1.5px solid #e2e8f0', background: form.statut===k ? s.bg : '#fff', color: form.statut===k ? s.color : '#64748b', fontWeight:600, fontSize:12, cursor:'pointer' }}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <button type="submit" disabled={saving}
                                style={{ padding:'13px', borderRadius:12, border:'none', background: saving ? '#c4b5fd' : '#6d28d9', color:'#fff', fontWeight:700, fontSize:15, cursor: saving ? 'not-allowed' : 'pointer', marginTop:4 }}>
                                {saving ? 'Création...' : 'Créer le cours'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ══ ÉDITEUR CAHIER ═════════════════════════════════════════════ */}
            {coursActif && (
                <div style={{ position:'fixed', inset:0, zIndex:400, display:'flex' }}>
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} onClick={fermer} />
                    <div style={{ position:'relative', marginLeft:'auto', width:'100%', maxWidth:760, height:'100%', background:'#fdf8f0', display:'flex', flexDirection:'column', boxShadow:'-20px 0 60px rgba(0,0,0,0.2)', animation:'slideIn .25s ease' }}>

                        {/* En-tête éditeur */}
                        <div style={{ padding:'18px 28px', borderBottom:'1px solid #e8d5b7', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:14, height:14, borderRadius:'50%', background:editData.couleur||'#fff', border:'2px solid rgba(0,0,0,0.1)' }} />
                                <div style={{ display:'flex', gap:6 }}>
                                    {Object.entries(STATUTS).map(([k,s]) => (
                                        <button key={k} onClick={()=>onChange('statut',k)}
                                            style={{ padding:'4px 12px', borderRadius:999, border: editData.statut===k ? `1.5px solid ${s.color}` : '1px solid #d6c4a0', background: editData.statut===k ? s.bg : 'transparent', color: editData.statut===k ? s.color : '#92400e', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                {saveStatus==='saving' && <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Enregistrement…</span>}
                                {saveStatus==='saved'  && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>Enregistré</span>}
                                <button onClick={saveNow} style={{ padding:'7px 18px', borderRadius:8, border:'none', background:'#1e1b4b', color:'#fff', fontWeight:600, fontSize:12, cursor:'pointer' }}>
                                    Enregistrer
                                </button>
                                <button onClick={()=>setConfirmDel(coursActif.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff5f5', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                                    <Icon name="trash" size={13} style={{ color:'#dc2626' }} />
                                </button>
                                <button onClick={fermer} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e8d5b7', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                                    <Icon name="x" size={14} style={{ color:'#64748b' }} />
                                </button>
                            </div>
                        </div>

                        {/* Couleurs dans l'éditeur */}
                        <div style={{ padding:'10px 28px', borderBottom:'1px solid #f0e6cc', display:'flex', gap:6, flexShrink:0 }}>
                            {COULEURS.map(h => (
                                <button key={h} onClick={()=>onChange('couleur',h)}
                                    style={{ width:20, height:20, borderRadius:6, background:h, border: editData.couleur===h ? '2px solid #6d28d9' : '1px solid #d6c4a0', cursor:'pointer' }} />
                            ))}
                        </div>

                        {/* Corps cahier ligné */}
                        <div style={{ flex:1, overflow:'auto', padding:'28px 48px', backgroundImage:'repeating-linear-gradient(transparent,transparent 31px,#e8d5b7 31px,#e8d5b7 32px)', backgroundSize:'100% 32px' }}>
                            <input type="text" value={editData.titre||''} onChange={e=>onChange('titre',e.target.value)} placeholder="Titre du cours…"
                                style={{ width:'100%', border:'none', background:'transparent', fontSize:24, fontWeight:800, color:'#1e1b4b', outline:'none', fontFamily:'Georgia,serif', lineHeight:'32px', boxSizing:'border-box' }} />
                            <input type="text" value={editData.description||''} onChange={e=>onChange('description',e.target.value)} placeholder="Sous-titre ou description courte…"
                                style={{ width:'100%', border:'none', background:'transparent', fontSize:14, color:'#92400e', outline:'none', fontFamily:'Georgia,serif', fontStyle:'italic', lineHeight:'32px', boxSizing:'border-box' }} />
                            <div style={{ borderBottom:'2px solid #d6c4a0', width:'55%', marginBottom:0 }} />
                            <textarea value={editData.contenu||''} onChange={e=>onChange('contenu',e.target.value)}
                                placeholder={'Rédigez vos notes ici…\n\nChapitre, résumé, formules, définitions, tout ce dont vous avez besoin pour réviser.'}
                                style={{ width:'100%', minHeight:'calc(100vh - 340px)', border:'none', background:'transparent', fontSize:15, color:'#1e1b4b', outline:'none', resize:'none', fontFamily:'Georgia,serif', lineHeight:'32px', boxSizing:'border-box', paddingTop:8 }} />
                        </div>

                        {/* Pied éditeur */}
                        <div style={{ padding:'10px 28px', borderTop:'1px solid #e8d5b7', display:'flex', justifyContent:'space-between', flexShrink:0 }}>
                            <span style={{ fontSize:11, color:'#a78665' }}>
                                {coursActif.updated_at ? new Date(coursActif.updated_at).toLocaleString('fr-FR') : 'À l\'instant'}
                            </span>
                            <span style={{ fontSize:11, color:'#a78665' }}>
                                {(editData.contenu||'').split(/\s+/).filter(Boolean).length} mots
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ CONFIRMATION SUPPRESSION ═══════════════════════════════════ */}
            {confirmDel && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ background:'#fff', borderRadius:20, padding:32, maxWidth:360, width:'90%', boxShadow:'0 20px 50px rgba(0,0,0,0.2)', textAlign:'center' }}>
                        <div style={{ width:52, height:52, borderRadius:'50%', background:'#fef2f2', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Icon name="trash" size={24} style={{ color:'#dc2626' }} />
                        </div>
                        <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#0f172a' }}>Supprimer ce cours ?</h3>
                        <p style={{ margin:'0 0 24px', color:'#64748b', fontSize:14 }}>Action irréversible. Toutes les notes seront perdues.</p>
                        <div style={{ display:'flex', gap:10 }}>
                            <button onClick={()=>setConfirmDel(null)} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontWeight:600, cursor:'pointer' }}>Annuler</button>
                            <button onClick={()=>supprimer(confirmDel)} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, cursor:'pointer' }}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                * { box-sizing: border-box; }
                input::placeholder, textarea::placeholder { color: #c4a882; }
                input[type="text"] { box-sizing: border-box; }
            `}</style>
        </div>
    );
}

// ─── Sous-composants ───────────────────────────────────────────────────────────

function StatBox({ value, label, bg, color, icon, highlight, dashed }) {
    return (
        <div style={{ flex:1, background:bg, borderRadius:16, padding:'14px 18px', border: dashed ? '2px dashed #cbd5e1' : '1px solid rgba(0,0,0,0.04)', position:'relative' }}>
            <p style={{ margin:0, fontSize:11, fontWeight:600, color, opacity:.75 }}>{label}</p>
            <p style={{ margin:'4px 0 0', fontSize:26, fontWeight:800, color }}>{value}</p>
            {icon && (
                <div style={{ position:'absolute', top:12, right:12 }}>
                    <Icon name={icon} size={18} style={{ color }} />
                </div>
            )}
        </div>
    );
}

function CourseCard({ cours, featured, onClick, onDelete, onToggle }) {
    const [hovered, setHovered] = useState(false);
    const s = STATUTS[cours.statut] || STATUTS.a_venir;
    const isLocked = cours.statut === 'a_venir';

    if (featured) {
        return (
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={onClick}
                style={{
                    gridColumn: 'span 1',
                    background: cours.couleur && cours.couleur !== '#ffffff' ? cours.couleur : '#f3e8ff',
                    borderRadius:24, padding:24, cursor:'pointer', position:'relative', zIndex:1,
                    transition:'transform .2s, box-shadow .2s',
                    transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: hovered ? '0 16px 40px rgba(109,40,217,.18)' : '0 4px 12px rgba(0,0,0,.06)',
                    minHeight:220,
                    border:'1px solid rgba(0,0,0,.05)',
                }}>
                {/* Icône play centrale */}
                <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,.35)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', margin:'20px auto 14px', border:'2px solid rgba(255,255,255,.6)' }}>
                    <Icon name="book-open" size={24} style={{ color:'#6d28d9' }} />
                </div>
                <h3 style={{ margin:'0 0 6px', fontSize:17, fontWeight:800, color:'#1e1b4b', textAlign:'center' }}>{cours.titre}</h3>
                {cours.description && <p style={{ margin:'0 0 16px', fontSize:12, color:'rgba(30,27,75,.6)', textAlign:'center', lineHeight:1.5 }}>{cours.description}</p>}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <div style={{ padding:'5px 14px', borderRadius:999, background:'rgba(255,255,255,.5)', fontSize:11, fontWeight:700, color:'#6d28d9', display:'flex', alignItems:'center', gap:5 }}>
                        <Icon name="clock" size={11} />
                        En cours
                    </div>
                </div>
                {hovered && <DeleteBtn onClick={onDelete} />}
            </div>
        );
    }

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                background: cours.couleur || '#fff', borderRadius:20, padding:22, cursor:'pointer',
                position:'relative', zIndex:1,
                transition:'transform .2s, box-shadow .2s',
                transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
                boxShadow: hovered ? '0 12px 32px rgba(0,0,0,.1)' : '0 2px 8px rgba(0,0,0,.04)',
                border:'1px solid rgba(0,0,0,.05)',
                minHeight:190, display:'flex', flexDirection:'column',
            }}>
            {/* Icône top-left / lock top-right */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="book-open" size={18} style={{ color:'#fff' }} />
                </div>
                {isLocked && (
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon name="lock" size={13} style={{ color:'#94a3b8' }} />
                    </div>
                )}
            </div>

            <h3 style={{ margin:'0 0 6px', fontSize:16, fontWeight:700, color:'#0f172a', lineHeight:1.3 }}>{cours.titre}</h3>
            {cours.description && (
                <p style={{ margin:'0 0 auto', fontSize:12, color:'rgba(0,0,0,.5)', lineHeight:1.5, paddingBottom:12 }}>{cours.description}</p>
            )}

            {/* Barre bas : statut + actions */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:10, borderTop:'1px solid rgba(0,0,0,.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:999, background:s.bg, border:`1px solid ${s.border}`, fontSize:11, fontWeight:700, color:s.color }}>
                    <Icon name={s.icon} size={11} />
                    {s.label}
                </div>
                <div style={{ display:'flex', gap:4 }}>
                    {/* Bouton "..." */}
                    <CardBtn icon="more-vertical" onClick={e=>{e.stopPropagation();}} />
                    {/* Bouton × */}
                    <CardBtn icon="x" onClick={onDelete} danger />
                    {/* Bouton ✓ */}
                    <CardBtn icon="check" onClick={onToggle} success />
                </div>
            </div>

            {cours.contenu && (
                <p style={{ margin:'6px 0 0', fontSize:10, color:'rgba(0,0,0,.3)', fontWeight:500 }}>
                    {cours.contenu.split(/\s+/).filter(Boolean).length} mots de notes
                </p>
            )}
        </div>
    );
}

function CardBtn({ icon, onClick, danger, success }) {
    const [h, setH] = useState(false);
    const bg = h ? (danger ? '#fef2f2' : success ? '#f0fdf4' : '#f8fafc') : '#fff';
    const color = danger ? '#ef4444' : success ? '#22c55e' : '#94a3b8';
    return (
        <button onClick={onClick}
            onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
            style={{ width:26, height:26, borderRadius:8, border:'1px solid #e2e8f0', background:bg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s' }}>
            <Icon name={icon} size={12} style={{ color }} />
        </button>
    );
}

function DeleteBtn({ onClick }) {
    return (
        <button onClick={onClick}
            style={{ position:'absolute', top:14, right:14, width:28, height:28, borderRadius:8, border:'1px solid rgba(255,255,255,.5)', background:'rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Icon name="trash" size={13} style={{ color:'#dc2626' }} />
        </button>
    );
}

function IconBtn({ icon, title, onClick, filled }) {
    const [h, setH] = useState(false);
    return (
        <button onClick={onClick} title={title}
            onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
            style={{ width:40, height:40, borderRadius:12, border:'none', background: filled ? '#6d28d9' : h ? '#f1f5f9' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .15s', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <Icon name={icon} size={18} style={{ color: filled ? '#fff' : '#64748b' }} />
        </button>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>{label}</label>
            {children}
        </div>
    );
}

const inputStyle = { width:'100%', padding:'11px 14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', color:'#1e293b', transition:'border .15s' };

