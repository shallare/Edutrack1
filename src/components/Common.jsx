import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

/* ============================================================
   LoadingScreen — plein écran avec spinner
   ============================================================ */
export function LoadingScreen({ text = 'Chargement...' }) {
    return (
        <div className="loading-screen">
            <div className="spinner" />
            <p>{text}</p>
        </div>
    );
}

/* ============================================================
   MessageBox — alertes succès / erreur
   ============================================================ */
export function MessageBox({ message }) {
    if (!message?.text) return null;
    const isSuccess = message.type === 'success';
    return (
        <div className={`message-box ${isSuccess ? 'success' : 'error'}`}>
            <Icon name={isSuccess ? 'check-circle' : 'alert'} size={18} />
            <span>{message.text}</span>
        </div>
    );
}

/* ============================================================
   BackButton — bouton retour
   ============================================================ */
export function BackButton({ to }) {
    const navigate = useNavigate();
    return (
        <button
            className="btn btn-ghost btn-sm"
            onClick={() => to ? navigate(to) : navigate(-1)}
            style={{ padding: '6px 12px', marginBottom: 8 }}
        >
            <Icon name="arrow-left" size={14} />
            <span>Retour</span>
        </button>
    );
}

/* ============================================================
   useAuth — hook qui charge l'utilisateur depuis localStorage
   et redirige si pas de token ou mauvais rôle
   ============================================================ */
export function useAuth(allowedRoles, loginPath) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            navigate(loginPath);
            return;
        }
        try {
            const parsedUser = JSON.parse(userData);
            const allowed = Array.isArray(allowedRoles)
                ? allowedRoles.includes(parsedUser.role)
                : parsedUser.role === allowedRoles;
            if (!allowed) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate(loginPath);
                return;
            }
            setUser(parsedUser);
            setReady(true);
        } catch (e) {
            navigate(loginPath);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { user, ready };
}

/* ============================================================
   StatCard — carte de statistique
   ============================================================ */
export function StatCard({ label, value, sub, icon, color = 'accent' }) {
    const colorMap = {
        accent:  'var(--accent)',
        primary: 'var(--primary)',
        success: 'var(--success)',
        danger:  'var(--danger)',
        warning: 'var(--warning)',
        info:    'var(--info)',
    };
    const colorBgMap = {
        accent:  'var(--accent-soft)',
        primary: 'var(--primary-soft)',
        success: 'var(--success-soft)',
        danger:  'var(--danger-soft)',
        warning: 'var(--warning-soft)',
        info:    'var(--info-soft)',
    };
    const c = colorMap[color] || colorMap.accent;
    const bg = colorBgMap[color] || colorBgMap.accent;

    return (
        <div className="stat-card" style={{ '--accent': c }}>
            <div className="stat-head">
                <p className="stat-label">{label}</p>
                {icon && (
                    <div className="stat-icon" style={{ background: bg, color: c }}>
                        <Icon name={icon} size={18} />
                    </div>
                )}
            </div>
            <h2 className="stat-value">{value}</h2>
            {sub && <p className="stat-sub">{sub}</p>}
        </div>
    );
}

/* ============================================================
   Empty — état vide (pas de données)
   ============================================================ */
export function Empty({ icon = 'info', title, description, action }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
        }}>
            <div style={{
                width: 72, height: 72,
                borderRadius: '50%',
                background: 'var(--glass-bg-light)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                color: 'var(--text-muted)'
            }}>
                <Icon name={icon} size={32} />
            </div>
            <h3 style={{ fontSize: 17, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</h3>
            {description && (
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 18px', maxWidth: 380 }}>
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
