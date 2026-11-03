import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Icon from '../components/Icon';
import AuthLayout from '../components/AuthLayout';

const ROLE = {
    titre: 'Espace Administration',
    description: 'Pilotez l\'ensemble de la plateforme : utilisateurs, classes, matières et tableaux de bord analytiques.',
    features: [
        { icon: 'users',     label: 'Gestion utilisateurs' },
        { icon: 'building',  label: 'Classes & matières'   },
        { icon: 'shield',    label: 'Accès sécurisé'       },
        { icon: 'chart-bar', label: 'Statistiques'         },
    ],
};

const BG_IMAGE = 'https://i.pinimg.com/1200x/36/f5/dc/36f5dce98ef9e379ec3cbc7a90bfbc26.jpg';

function AdminLogin() {
    const [email, setEmail]             = useState('');
    const [mdp, setMdp]                 = useState('');
    const [showPwd, setShowPwd]         = useState(false);
    const [erreur, setErreur]           = useState('');
    const [success, setSuccess]         = useState('');
    const [loading, setLoading]         = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true); setErreur(''); setSuccess('');
        try {
            const res = await api.post('/admin/login', { email, mot_de_passe: mdp });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.utilisateur));
            setSuccess('Connexion réussie. Redirection…');
            setTimeout(() => navigate('/admin/dashboard'), 800);
        } catch (err) {
            if (!err.response) {
                setErreur('Serveur injoignable. Vérifiez que le backend est bien démarré.');
            } else {
                setErreur(err.response.data?.erreur || 'Email ou mot de passe incorrect.');
            }
        } finally { setLoading(false); }
    }

    return (
        <AuthLayout
            backgroundImage={BG_IMAGE}
            role={ROLE}
        >
            {/* Badge */}
            <div style={{ marginBottom: 28 }}>
                <span style={badge('#111', '#fff')}>
                    <Icon name="shield" size={12} /> ADMINISTRATEUR
                </span>
                <h1 style={h1}>Accès Administration</h1>
                <p style={sub}>Réservé au personnel autorisé de la plateforme.</p>
            </div>

            {erreur  && <Alert type="error"   text={erreur}  />}
            {success && <Alert type="success" text={success} />}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <Field label="Adresse email">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="admin@wiico.com" required autoFocus style={inp} />
                </Field>
                <Field label="Mot de passe">
                    <div style={{ position:'relative' }}>
                        <input type={showPwd ? 'text' : 'password'} value={mdp}
                            onChange={e => setMdp(e.target.value)}
                            placeholder="Votre mot de passe" required style={{ ...inp, paddingRight:44 }} />
                        <EyeBtn show={showPwd} toggle={() => setShowPwd(v => !v)} />
                    </div>
                </Field>
                <SubmitBtn loading={loading} label="Se connecter" bg="#111" />
            </form>
        </AuthLayout>
    );
}

export default AdminLogin;

/* ── Helpers ── */
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
            {loading ? 'Connexion…' : label}
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
