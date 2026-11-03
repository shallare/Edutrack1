import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Icon from '../components/Icon';
import { MessageBox } from '../components/Common';
import api from '../services/api';
import { toggleTheme, getTheme } from '../utils/theme';

/**
 * Paramètres — mise en page aérée :
 * bandeau d'identité, navigation en pastilles, sections empilées et spacieuses.
 */

const SECTIONS = [
    { id: 'profil',          icon: 'user',   label: 'Profil' },
    { id: 'securite',        icon: 'lock',   label: 'Sécurité' },
    { id: 'apparence',       icon: 'sun',    label: 'Apparence' },
    { id: 'confidentialite', icon: 'shield', label: 'Confidentialité' },
    { id: 'reseau',          icon: 'users',  label: 'Réseau' },
];

// Préférences locales (stockées sur cet appareil)
const PREFS_KEY = 'wiico_prefs';
const loadPrefs = () => {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
};
const savePrefs = (p) => localStorage.setItem(PREFS_KEY, JSON.stringify(p));

function StudentSettings() {
    const { user } = useOutletContext();

    const [active, setActive]   = useState('profil');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profil
    const [profile, setProfile] = useState({ universite: '', filiere: '', classe_nom: '', telephone: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Sécurité
    const [pwd, setPwd] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', nouveau_mot_de_passe_confirmation: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);

    // Confidentialité / préférences
    const [parentalControl, setParentalControl] = useState(false);
    const [prefs, setPrefs] = useState({ conseilsMascotte: true, ...loadPrefs() });

    // Apparence
    const [theme, setTheme] = useState(getTheme());

    // Réseau
    const [classmates, setClassmates] = useState([]);
    const [removed, setRemoved] = useState([]);

    /* ── Chargement initial ── */
    useEffect(() => {
        (async () => {
            try {
                const [profil, cam] = await Promise.allSettled([
                    api.get('/profil'),
                    api.get('/etudiant/camarades'),
                ]);
                if (profil.status === 'fulfilled') {
                    const u = profil.value.data;
                    setProfile({
                        universite: u.universite || '',
                        filiere:    u.filiere || '',
                        classe_nom: u.classe_nom || '',
                        telephone:  u.telephone || '',
                    });
                    setParentalControl(!!u.visualisation_parentale);
                    localStorage.setItem('user', JSON.stringify(u));
                }
                if (cam.status === 'fulfilled') setClassmates(cam.value.data || []);
            } catch (e) { console.error(e); }
        })();

        const onTheme = () => setTheme(getTheme());
        window.addEventListener('themechange', onTheme);
        return () => window.removeEventListener('themechange', onTheme);
    }, []);

    const flash = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    };

    const goTo = (id) => {
        setActive(id);
        document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ── Actions ── */
    const persistProfil = async (payload, successMsg) => {
        try {
            const res = await api.put('/etudiant/profil', payload);
            localStorage.setItem('user', JSON.stringify(res.data.utilisateur));
            flash(successMsg);
            return true;
        } catch (err) {
            flash(!err.response ? 'Serveur injoignable — modifications non enregistrées.' : 'Erreur lors de l\'enregistrement.', 'error');
            return false;
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        await persistProfil(profile, 'Profil mis à jour !');
        setSavingProfile(false);
    };

    const handleChangePwd = async (e) => {
        e.preventDefault();
        setSavingPwd(true);
        try {
            await api.put('/mot-de-passe', pwd);
            setPwd({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', nouveau_mot_de_passe_confirmation: '' });
            flash('Mot de passe modifié avec succès.');
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Erreur lors du changement de mot de passe.';
            if (!err.response) msg = 'Serveur injoignable.';
            else if (data?.erreur && typeof data.erreur === 'object') msg = Object.values(data.erreur).flat().join(', ');
            else if (data?.erreur) msg = data.erreur;
            flash(msg, 'error');
        } finally {
            setSavingPwd(false);
        }
    };

    const toggleParental = async () => {
        const next = !parentalControl;
        setParentalControl(next);
        const ok = await persistProfil(
            { visualisation_parentale: next },
            next ? 'Visualisation parentale activée.' : 'Visualisation parentale désactivée.'
        );
        if (!ok) setParentalControl(!next);
    };

    const togglePref = (key) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        savePrefs(next);
        flash('Préférence enregistrée sur cet appareil.');
    };

    const handleInvite = async () => {
        const inviteLink = `${window.location.origin}/etudiant/login`;
        try {
            await navigator.clipboard.writeText(inviteLink);
            flash('Lien d\'invitation copié !');
        } catch {
            flash(`Lien d'invitation : ${inviteLink}`);
        }
    };

    const handleDeleteClassmate = (c) => {
        if (window.confirm(`Voulez-vous vraiment retirer ${c.nom} de vos contacts ?`)) {
            setRemoved(r => [...r, c.id]);
            flash(`${c.nom} a été retiré de votre liste.`);
        }
    };

    const visibles = classmates.filter(c => !removed.includes(c.id));
    const initials = (user?.nom_complet || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    const roleLabel = user?.role === 'delegue' ? 'Délégué de classe' : 'Étudiant';

    /* ── Rendu ── */
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 1000, margin: '0 auto' }}>
            <MessageBox message={message} />

            {/* ═══ Bandeau d'identité ═══ */}
            <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', padding: '30px 36px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
                <div className="avatar accent" style={{ width: 72, height: 72, fontSize: 26, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {initials}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{user?.nom_complet}</h2>
                    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>{user?.email}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="pill pill-accent" style={{ padding: '7px 16px', fontSize: 12 }}>
                        <Icon name="graduation-cap" size={13} style={{ marginRight: 6 }} />
                        {roleLabel}
                    </span>
                    {profile.classe_nom && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', fontSize: 12, fontWeight: 600, borderRadius: 999, background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                            <Icon name="building" size={13} />
                            {profile.classe_nom}
                        </span>
                    )}
                </div>
            </div>

            {/* ═══ Navigation en pastilles (collante) ═══ */}
            <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="glass-card" style={{ borderRadius: 999, padding: 6, display: 'flex', gap: 4, flexWrap: 'wrap', backdropFilter: 'var(--glass-blur)' }}>
                    {SECTIONS.map(s => (
                        <button key={s.id} onClick={() => goTo(s.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center',
                                padding: '11px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                                background: active === s.id ? 'linear-gradient(135deg, var(--primary), var(--primary-strong))' : 'transparent',
                                color: active === s.id ? '#fff' : 'var(--text-secondary)',
                                fontWeight: active === s.id ? 700 : 500, fontSize: 13.5, whiteSpace: 'nowrap',
                                transition: 'all .18s',
                            }}>
                            <Icon name={s.icon} size={15} />
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ PROFIL ═══ */}
            <Section id="profil" icon="user" title="Profil académique"
                desc="Ces informations personnalisent votre espace : classe affichée, invitations, relevés.">
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    <Row2>
                        <FieldBlock label="Université / École">
                            <input type="text" className="input" value={profile.universite}
                                placeholder="Ex : Université de Technologie"
                                onChange={e => setProfile({ ...profile, universite: e.target.value })} />
                        </FieldBlock>
                        <FieldBlock label="Filière d'étude">
                            <input type="text" className="input" value={profile.filiere}
                                placeholder="Ex : Génie Logiciel"
                                onChange={e => setProfile({ ...profile, filiere: e.target.value })} />
                        </FieldBlock>
                    </Row2>
                    <Row2>
                        <FieldBlock label="Classe / Niveau">
                            <input type="text" className="input" value={profile.classe_nom}
                                placeholder="Ex : B3 Informatique"
                                onChange={e => setProfile({ ...profile, classe_nom: e.target.value })} />
                        </FieldBlock>
                        <FieldBlock label="Téléphone">
                            <input type="tel" className="input" value={profile.telephone}
                                placeholder="Ex : +229 01 23 45 67"
                                onChange={e => setProfile({ ...profile, telephone: e.target.value })} />
                        </FieldBlock>
                    </Row2>
                    <FieldBlock label="Adresse e-mail" hint="C'est votre identifiant de connexion — non modifiable.">
                        <input type="email" className="input" value={user?.email || ''} disabled style={{ opacity: 0.55, cursor: 'not-allowed', maxWidth: 420 }} />
                    </FieldBlock>
                    <button type="submit" disabled={savingProfile} className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start', padding: '12px 26px' }}>
                        <Icon name="save" size={16} style={{ marginRight: 8 }} />
                        {savingProfile ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </button>
                </form>
            </Section>

            {/* ═══ SÉCURITÉ ═══ */}
            <Section id="securite" icon="lock" title="Compte & Sécurité"
                desc="Changez votre mot de passe régulièrement. En cas d'oubli, utilisez « Mot de passe oublié » sur la page de connexion.">
                <form onSubmit={handleChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    <Row2>
                        <FieldBlock label="Ancien mot de passe">
                            <PwdInput value={pwd.ancien_mot_de_passe} show={showPwd}
                                onChange={v => setPwd(p => ({ ...p, ancien_mot_de_passe: v }))}
                                onToggle={() => setShowPwd(s => !s)} />
                        </FieldBlock>
                        <div />
                    </Row2>
                    <Row2>
                        <FieldBlock label="Nouveau mot de passe" hint="Minimum 6 caractères.">
                            <PwdInput value={pwd.nouveau_mot_de_passe} show={showPwd}
                                onChange={v => setPwd(p => ({ ...p, nouveau_mot_de_passe: v }))}
                                onToggle={() => setShowPwd(s => !s)} />
                        </FieldBlock>
                        <FieldBlock label="Confirmer le nouveau mot de passe">
                            <PwdInput value={pwd.nouveau_mot_de_passe_confirmation} show={showPwd}
                                onChange={v => setPwd(p => ({ ...p, nouveau_mot_de_passe_confirmation: v }))}
                                onToggle={() => setShowPwd(s => !s)} />
                        </FieldBlock>
                    </Row2>
                    {pwd.nouveau_mot_de_passe && pwd.nouveau_mot_de_passe_confirmation && pwd.nouveau_mot_de_passe !== pwd.nouveau_mot_de_passe_confirmation && (
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
                            <Icon name="alert-circle" size={14} style={{ marginRight: 6 }} />
                            Les deux mots de passe ne correspondent pas.
                        </p>
                    )}
                    <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start', padding: '12px 26px' }}
                        disabled={savingPwd || !pwd.ancien_mot_de_passe || pwd.nouveau_mot_de_passe.length < 6 || pwd.nouveau_mot_de_passe !== pwd.nouveau_mot_de_passe_confirmation}>
                        <Icon name="lock" size={16} style={{ marginRight: 8 }} />
                        {savingPwd ? 'Modification…' : 'Changer le mot de passe'}
                    </button>
                </form>
            </Section>

            {/* ═══ APPARENCE ═══ */}
            <Section id="apparence" icon="sun" title="Apparence"
                desc="Choisissez votre thème et ce qui s'affiche sur votre tableau de bord.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 300px))', gap: 18 }}>
                    {[
                        { id: 'dark',  label: 'Mode sombre', icon: 'moon', bg: '#16181d', border: '#2c3140' },
                        { id: 'light', label: 'Mode clair',  icon: 'sun',  bg: '#f8fafc', border: '#e2e8f0' },
                    ].map(t => (
                        <button key={t.id}
                            onClick={() => { if (theme !== t.id) toggleTheme(); }}
                            style={{
                                borderRadius: 18, padding: 0, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
                                border: theme === t.id ? '2.5px solid var(--primary)' : '1.5px solid var(--glass-border)',
                                boxShadow: theme === t.id ? 'var(--shadow-glow-primary)' : 'none',
                                background: 'transparent', transition: 'all .2s',
                            }}>
                            <div style={{ background: t.bg, padding: 18, display: 'flex', gap: 10 }}>
                                <div style={{ width: 44, borderRadius: 8, background: t.id === 'dark' ? '#22263055' : '#e6eaf2', border: `1px solid ${t.border}` }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    <div style={{ height: 10, width: '65%', borderRadius: 5, background: '#6366f1' }} />
                                    <div style={{ height: 7, width: '90%', borderRadius: 4, background: t.id === 'dark' ? '#333a4d' : '#cbd5e1' }} />
                                    <div style={{ height: 7, width: '75%', borderRadius: 4, background: t.id === 'dark' ? '#333a4d' : '#cbd5e1' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', background: 'var(--glass-bg-light)' }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Icon name={t.icon} size={15} />
                                    {t.label}
                                </span>
                                {theme === t.id && <Icon name="check-circle" size={18} style={{ color: 'var(--primary)' }} />}
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 24 }}>
                    <ToggleRow
                        title="Conseils de la mascotte"
                        desc="Wiico affiche des astuces animées sur le tableau de bord."
                        checked={prefs.conseilsMascotte}
                        onToggle={() => togglePref('conseilsMascotte')}
                    />
                </div>
            </Section>

            {/* ═══ CONFIDENTIALITÉ ═══ */}
            <Section id="confidentialite" icon="shield" title="Confidentialité"
                desc="Contrôlez qui peut voir vos informations.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <ToggleRow
                        title="Visualisation Parentale"
                        desc="Autoriser un parent à voir mes notes et présences."
                        checked={parentalControl}
                        onToggle={toggleParental}
                    />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px 18px', background: 'var(--info-soft)', borderRadius: 14, border: '1px solid var(--glass-border)' }}>
                        <Icon name="info" size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                            Vos cours partagés sont visibles <strong>en lecture seule</strong> par toute personne ayant le lien, même sans compte.
                            Supprimer un cours révoque immédiatement son lien de partage.
                        </p>
                    </div>
                </div>
            </Section>

            {/* ═══ RÉSEAU ═══ */}
            <Section id="reseau" icon="users" title="Réseau & Contacts"
                desc="Invitez des amis et gérez vos camarades.">
                <button onClick={handleInvite} className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: '18px 20px', background: 'var(--glass-bg-light)', border: '1px solid var(--glass-border)', width: '100%', marginBottom: 18, borderRadius: 14 }}>
                    <Icon name="link" size={20} style={{ marginRight: 14, color: 'var(--primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)' }}>Générer un lien d'invitation</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invitez vos amis à rejoindre Wii-Co — parfait pour les groupes WhatsApp de classe</div>
                    </div>
                </button>

                <div style={{ border: '1px solid var(--glass-border)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--glass-border)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        Mes contacts ({visibles.length})
                    </div>
                    {visibles.length === 0 ? (
                        <p style={{ margin: 0, padding: '20px', fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun contact pour l'instant.</p>
                    ) : visibles.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                    {(c.nom || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.nom}</span>
                            </div>
                            <button onClick={() => handleDeleteClassmate(c)} className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '7px 14px' }}>
                                <Icon name="trash-2" size={14} style={{ marginRight: 6 }} />
                                Retirer
                            </button>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}

/* ============================================================
   Sous-composants
   ============================================================ */
function Section({ id, icon, title, desc, children }) {
    return (
        <section id={`section-${id}`} className="glass-card" style={{ padding: '34px 38px', borderRadius: 'var(--radius-xl)', scrollMarginTop: 76 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={icon} size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            <p style={{ margin: '0 0 26px 53px', fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 560 }}>{desc}</p>
            {children}
        </section>
    );
}

function Row2({ children }) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>{children}</div>;
}

function FieldBlock({ label, hint, children }) {
    return (
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</label>
            {children}
            {hint && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{hint}</span>}
        </div>
    );
}

function PwdInput({ value, onChange, show, onToggle }) {
    return (
        <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} className="input" value={value} required
                onChange={e => onChange(e.target.value)} style={{ paddingRight: 42 }} />
            <button type="button" onClick={onToggle}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
                <Icon name={show ? 'eye-off' : 'eye'} size={16} />
            </button>
        </div>
    );
}

function ToggleRow({ title, desc, checked, onToggle }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--glass-bg-light)', borderRadius: 14, border: '1px solid var(--glass-border)' }}>
            <div>
                <h4 style={{ margin: '0 0 3px', fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted)' }}>{desc}</p>
            </div>
            <div onClick={onToggle} role="switch" aria-checked={checked} tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
                style={{
                    width: 50, height: 27, borderRadius: 27, flexShrink: 0,
                    background: checked ? 'var(--success)' : 'var(--glass-border)',
                    position: 'relative', cursor: 'pointer', transition: '0.3s',
                }}>
                <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 2.5, left: checked ? 25 : 2.5,
                    transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
            </div>
        </div>
    );
}

export default StudentSettings;
