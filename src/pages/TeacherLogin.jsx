import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Icon from '../components/Icon';
import AuthLayout from '../components/AuthLayout';

const BG_IMAGE = 'https://i.pinimg.com/1200x/36/f5/dc/36f5dce98ef9e379ec3cbc7a90bfbc26.jpg';

const ROLE = {
    titre: 'Espace Enseignant',
    description: 'Gérez votre cahier de texte, suivez les présences et recevez les évaluations de vos étudiants.',
    features: [
        { icon: 'book',        label: 'Cahier de texte' },
        { icon: 'users',       label: 'Suivi présences'  },
        { icon: 'edit',        label: 'Correction cours' },
        { icon: 'bar-chart-2', label: 'Statistiques'     },
    ],
};

const ACCENT = '#111';
const ACCENT_LIGHT = '#f5f5f5';

function TeacherLogin() {
    const [mode, setMode]           = useState('login'); // 'login' | 'register' | 'verify'
    const [showPwd, setShowPwd]     = useState(false);
    const [showPwd2, setShowPwd2]   = useState(false);
    const [form, setForm]           = useState({ nom:'', prenom:'', email:'', mot_de_passe:'', mot_de_passe_confirmation:'' });
    const [code, setCode]           = useState('');
    const [resetCode, setResetCode] = useState('');
    const [userId, setUserId]       = useState(null);
    const [erreur, setErreur]       = useState('');
    const [success, setSuccess]     = useState('');
    const [loading, setLoading]     = useState(false);
    const navigate = useNavigate();

    const ch = e => setForm({ ...form, [e.target.name]: e.target.value });
    const switchMode = m => { setMode(m); setErreur(''); setSuccess(''); };

    // ── Connexion ──
    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true); setErreur(''); setSuccess('');
        try {
            const res = await api.post('/enseignant/login', { email: form.email, mot_de_passe: form.mot_de_passe });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.utilisateur));
            setSuccess('Connexion réussie. Redirection…');
            setTimeout(() => navigate('/enseignant/dashboard'), 800);
        } catch (err) {
            if (!err.response) {
                setErreur('Serveur injoignable. Vérifiez que le backend est bien démarré.');
            } else if (err.response.data?.need_verification) {
                const data = err.response.data;
                setUserId(data.utilisateur_id);
                setMode('verify');
                setSuccess('Un code de vérification a été envoyé à votre e-mail.');
                setErreur('');
            } else {
                setErreur(err.response.data?.erreur || 'Email ou mot de passe incorrect.');
            }
        } finally { setLoading(false); }
    }

    // ── Inscription ──
    async function handleRegister(e) {
        e.preventDefault();
        setLoading(true); setErreur(''); setSuccess('');
        try {
            const res = await api.post('/enseignant/register', form);
            setUserId(res.data.utilisateur_id);
            setSuccess(res.data.message);
            setMode('verify');
        } catch (err) {
            const data = err.response?.data;
            let msg = "Erreur lors de l'inscription.";
            if (data?.erreur && typeof data.erreur === 'object') {
                msg = Object.values(data.erreur).flat().join(', ');
            } else if (data?.erreur) {
                msg = data.erreur;
            }
            setErreur(msg);
        } finally { setLoading(false); }
    }

    // ── Vérification du code ──
    async function handleVerify(e) {
        e.preventDefault();
        setLoading(true); setErreur(''); setSuccess('');
        try {
            const res = await api.post('/verify-email', { utilisateur_id: userId, code });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.utilisateur));
            setSuccess('E-mail vérifié ! Redirection…');
            setTimeout(() => navigate('/enseignant/dashboard'), 800);
        } catch (err) {
            setErreur(err.response?.data?.erreur || 'Code invalide.');
        } finally { setLoading(false); }
    }

    // ── Renvoyer le code ──
    async function resendCode() {
        setErreur(''); setSuccess('');
        try {
            await api.post('/resend-code', { utilisateur_id: userId });
            setSuccess('Un nouveau code a été envoyé.');
        } catch (err) {
            setErreur(err.response?.data?.erreur || 'Impossible de renvoyer le code.');
        }
    }

    // ── Mot de passe oublié ──
    async function handleForgot(e) {
        e.preventDefault();
        setLoading(true); setErreur(''); setSuccess('');
        try {
            const res = await api.post('/mot-de-passe-oublie', { email: form.email });
            setSuccess(res.data.message);
            setMode('reset');
        } catch (err) {
            setErreur(!err.response ? 'Serveur injoignable.' : 'Impossible d\'envoyer le code.');
        } finally { setLoading(false); }
    }

    async function handleReset(e) {
        e.preventDefault();
        setLoading(true); setErreur(''); setSuccess('');
        try {
            const res = await api.post('/mot-de-passe-reinitialiser', {
                email: form.email,
                code: resetCode,
                nouveau_mot_de_passe: form.mot_de_passe,
                nouveau_mot_de_passe_confirmation: form.mot_de_passe_confirmation,
            });
            setSuccess(res.data.message);
            setMode('login');
            setForm(f => ({ ...f, mot_de_passe: '', mot_de_passe_confirmation: '' }));
            setResetCode('');
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Erreur lors de la réinitialisation.';
            if (!err.response) msg = 'Serveur injoignable.';
            else if (data?.erreur && typeof data.erreur === 'object') msg = Object.values(data.erreur).flat().join(', ');
            else if (data?.erreur) msg = data.erreur;
            setErreur(msg);
        } finally { setLoading(false); }
    }

    return (
        <AuthLayout backgroundImage={BG_IMAGE} role={ROLE}>
            <div style={{ marginBottom: 24 }}>
                <span style={badge(ACCENT_LIGHT, ACCENT)}>
                    <Icon name="chalkboard" size={12} /> ENSEIGNANT
                </span>
                <h1 style={h1}>
                    {mode === 'login' ? 'Bon retour !' :
                     mode === 'register' ? 'Créer un compte' :
                     mode === 'forgot' ? 'Mot de passe oublié' :
                     mode === 'reset' ? 'Nouveau mot de passe' : 'Vérification'}
                </h1>
                <p style={sub}>
                    {mode === 'login' ? 'Connectez-vous à votre espace professeur.' :
                     mode === 'register' ? 'Inscrivez-vous pour accéder à la plateforme.' :
                     mode === 'forgot' ? 'Recevez un code de réinitialisation par e-mail.' :
                     mode === 'reset' ? 'Entrez le code reçu et choisissez un nouveau mot de passe.' :
                     'Entrez le code reçu par e-mail.'}
                </p>
            </div>

            {(mode === 'login' || mode === 'register') && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'#f1f5f9', borderRadius:12, padding:4, marginBottom:20, gap:4 }}>
                    {[{l:'Connexion', v:'login'}, {l:'Inscription', v:'register'}].map(t => (
                        <button key={t.l} onClick={() => switchMode(t.v)}
                            style={{ padding:'10px', borderRadius:9, border:'none', background: mode===t.v ? '#fff' : 'transparent', color: mode===t.v ? '#0f172a' : '#64748b', fontWeight:700, fontSize:13, cursor:'pointer', boxShadow: mode===t.v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition:'all .2s' }}>
                            {t.l}
                        </button>
                    ))}
                </div>
            )}

            {erreur  && <Alert type="error"   text={erreur}  />}
            {success && <Alert type="success" text={success} />}

            {mode === 'login' && (
                <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <Field label="Adresse email">
                        <input type="email" name="email" value={form.email} onChange={ch}
                            placeholder="prof@wiico.com" required autoFocus style={inp} />
                    </Field>
                    <Field label="Mot de passe">
                        <div style={{ position:'relative' }}>
                            <input type={showPwd ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe} onChange={ch}
                                placeholder="Votre mot de passe" required style={{ ...inp, paddingRight:44 }} />
                            <EyeBtn show={showPwd} toggle={() => setShowPwd(v => !v)} />
                        </div>
                    </Field>
                    <SubmitBtn loading={loading} label="Se connecter" bg={ACCENT} />
                    <button type="button" onClick={() => switchMode('forgot')}
                        style={{ background:'none', border:'none', color:'#64748b', fontSize:13, cursor:'pointer', textDecoration:'underline', padding:4, alignSelf:'center' }}>
                        Mot de passe oublié ?
                    </button>
                </form>
            )}

            {mode === 'forgot' && (
                <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:15 }}>
                    <Field label="Adresse email du compte">
                        <input type="email" name="email" value={form.email} onChange={ch}
                            placeholder="prof@wiico.com" required autoFocus style={inp} />
                    </Field>
                    <SubmitBtn loading={loading} label="Envoyer le code" bg={ACCENT} />
                    <button type="button" onClick={() => switchMode('login')}
                        style={{ background:'none', border:'none', color:'#64748b', fontSize:13, cursor:'pointer', textDecoration:'underline', padding:4 }}>
                        Retour à la connexion
                    </button>
                </form>
            )}

            {mode === 'reset' && (
                <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:15 }}>
                    <Field label="Code reçu par e-mail (6 chiffres)">
                        <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value)}
                            placeholder="000000" required maxLength={6} autoFocus
                            style={{ ...inp, textAlign:'center', fontSize:22, letterSpacing:8, fontWeight:700 }} />
                    </Field>
                    <Field label="Nouveau mot de passe">
                        <div style={{ position:'relative' }}>
                            <input type={showPwd ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe} onChange={ch}
                                placeholder="Min. 6 caractères" required minLength={6} style={{ ...inp, paddingRight:44 }} />
                            <EyeBtn show={showPwd} toggle={() => setShowPwd(v => !v)} />
                        </div>
                    </Field>
                    <Field label="Confirmer le nouveau mot de passe">
                        <div style={{ position:'relative' }}>
                            <input type={showPwd2 ? 'text' : 'password'} name="mot_de_passe_confirmation" value={form.mot_de_passe_confirmation} onChange={ch}
                                placeholder="Retapez le mot de passe" required minLength={6} style={{ ...inp, paddingRight:44 }} />
                            <EyeBtn show={showPwd2} toggle={() => setShowPwd2(v => !v)} />
                        </div>
                    </Field>
                    <SubmitBtn loading={loading} label="Réinitialiser" bg={ACCENT} />
                    <button type="button" onClick={handleForgot}
                        style={{ background:'none', border:'none', color:'#64748b', fontSize:13, cursor:'pointer', textDecoration:'underline', padding:4 }}>
                        Renvoyer le code
                    </button>
                </form>
            )}

            {mode === 'register' && (
                <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:13 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <Field label="Nom">
                            <input type="text" name="nom" value={form.nom} onChange={ch}
                                placeholder="Nom" required autoFocus style={inp} />
                        </Field>
                        <Field label="Prénom">
                            <input type="text" name="prenom" value={form.prenom} onChange={ch}
                                placeholder="Prénom" required style={inp} />
                        </Field>
                    </div>
                    <Field label="Adresse email">
                        <input type="email" name="email" value={form.email} onChange={ch}
                            placeholder="prof@wiico.com" required style={inp} />
                    </Field>
                    <Field label="Mot de passe">
                        <div style={{ position:'relative' }}>
                            <input type={showPwd ? 'text' : 'password'} name="mot_de_passe" value={form.mot_de_passe} onChange={ch}
                                placeholder="Min. 6 caractères" required minLength={6} style={{ ...inp, paddingRight:44 }} />
                            <EyeBtn show={showPwd} toggle={() => setShowPwd(v => !v)} />
                        </div>
                    </Field>
                    <Field label="Confirmer le mot de passe">
                        <div style={{ position:'relative' }}>
                            <input type={showPwd2 ? 'text' : 'password'} name="mot_de_passe_confirmation" value={form.mot_de_passe_confirmation} onChange={ch}
                                placeholder="Retapez votre mot de passe" required minLength={6} style={{ ...inp, paddingRight:44 }} />
                            <EyeBtn show={showPwd2} toggle={() => setShowPwd2(v => !v)} />
                        </div>
                    </Field>
                    <SubmitBtn loading={loading} label="Créer mon compte" bg={ACCENT} />
                </form>
            )}

            {mode === 'verify' && (
                <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <Field label="Code de vérification (6 chiffres)">
                        <input type="text" value={code} onChange={e => setCode(e.target.value)}
                            placeholder="000000" required maxLength={6} autoFocus
                            style={{ ...inp, textAlign:'center', fontSize:24, letterSpacing:8, fontWeight:700 }} />
                    </Field>
                    <SubmitBtn loading={loading} label="Vérifier" bg={ACCENT} />
                    <button type="button" onClick={resendCode}
                        style={{ background:'none', border:'none', color:'#64748b', fontSize:13, cursor:'pointer', textDecoration:'underline', padding:4 }}>
                        Renvoyer le code
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}

export default TeacherLogin;

function Field({ label, children }) {
    return (
        <div>
            <label style={{ display:'block', marginBottom:6, fontSize:13, fontWeight:600, color:'#374151' }}>{label}</label>
            {children}
        </div>
    );
}
function EyeBtn({ show, toggle }) {
    return (
        <button type="button" onClick={toggle}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:4 }}>
            <Icon name={show ? 'eye-off' : 'eye'} size={18} />
        </button>
    );
}
function Alert({ type, text }) {
    const err = type === 'error';
    return (
        <div style={{ display:'flex', gap:8, background: err ? '#fef2f2' : '#f0fdf4', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
            <Icon name={err ? 'x-circle' : 'check-circle'} size={15} style={{ color: err ? '#dc2626' : '#16a34a', flexShrink:0, marginTop:1 }} />
            <p style={{ margin:0, fontSize:13, color: err ? '#dc2626' : '#16a34a', fontWeight:500 }}>{text}</p>
        </div>
    );
}
function SubmitBtn({ loading, label, bg }) {
    return (
        <button type="submit" disabled={loading}
            style={{ width:'100%', padding:13, borderRadius:12, border:'none', background: loading ? '#94a3b8' : bg, color:'#fff', fontWeight:700, fontSize:15, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:4 }}>
            {loading && <Spinner />}
            {loading ? 'Chargement…' : label}
        </button>
    );
}
function Spinner() {
    return (
        <>
            <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'_spin .7s linear infinite' }} />
            <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
        </>
    );
}
const badge = (bg, color) => ({ display:'inline-flex', alignItems:'center', gap:6, background:bg, color, padding:'4px 14px', borderRadius:999, fontSize:12, fontWeight:700, marginBottom:14 });
const h1  = { margin:'0 0 6px', fontSize:26, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px' };
const sub = { margin:0, color:'#64748b', fontSize:14 };
const inp = { width:'100%', padding:'11px 14px', borderRadius:11, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', color:'#1e293b', background:'#f8fafc', boxSizing:'border-box', fontFamily:'inherit' };
