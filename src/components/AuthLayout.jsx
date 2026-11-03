import Logo from './Logo';
import Icon from './Icon';

/* ─────────────────────────────────────────────────────────────────────────────
   AuthLayout — Split-screen pour toutes les pages de connexion.

   Le panneau gauche affiche une image de fond en plein écran.
   Le panneau droit contient le formulaire.
───────────────────────────────────────────────────────────────────────────── */

const FONT = "'Lexend', 'Segoe UI', system-ui, sans-serif";

export default function AuthLayout({ backgroundImage, role, children }) {
    return (
        <div className="auth-split" style={{ display:'flex', minHeight:'100vh', fontFamily:FONT }}>

            {/* ══ PANNEAU GAUCHE — Image de fond ══ */}
            <div className="auth-panel-left" style={{
                flex: '0 0 48%',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '36px 32px 40px',
            }}>
                {/* Image de fond */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url("${backgroundImage}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0,
                }} />
                {/* Overlay sombre pour lisibilité */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.35) 100%)',
                    zIndex: 1,
                }} />

                {/* Logo en haut à gauche */}
                <div style={{ position:'absolute', top:28, left:28, zIndex:2, display:'flex', alignItems:'center', gap:10 }}>
                    <Logo size={24} color="#fff" />
                </div>

                {/* Titre + description + badges en bas */}
                <div style={{ zIndex:2, position:'relative' }}>
                    <h2 style={{
                        margin: '0 0 8px',
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: 28,
                        color: '#fff',
                        letterSpacing: '-0.5px',
                        lineHeight: 1.2,
                    }}>
                        {role.titre}
                    </h2>
                    <p style={{
                        margin: '0 0 20px',
                        fontFamily: FONT,
                        fontSize: 14,
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1.65,
                        maxWidth: 380,
                    }}>
                        {role.description}
                    </p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {role.features.map((f, i) => (
                            <span key={i} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: 'rgba(255,255,255,0.14)',
                                backdropFilter: 'blur(6px)',
                                padding: '5px 13px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: FONT,
                                color: '#fff',
                            }}>
                                <Icon name={f.icon} size={12} />
                                {f.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ PANNEAU DROIT : Formulaire ══ */}
            <div className="auth-panel-right" style={{
                flex: 1,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
                overflowY: 'auto',
                fontFamily: FONT,
            }}>
                <div className="auth-form-inner" style={{ width:'100%', maxWidth:400 }}>
                    {children}
                    <div style={{ marginTop:28, textAlign:'center' }}>
                        <a href="/" style={{ fontFamily:FONT, fontSize:13, color:'#94a3b8', display:'inline-flex', alignItems:'center', gap:6, textDecoration:'none' }}>
                            <Icon name="arrow-left" size={14} />
                            Retour à l'accueil
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
