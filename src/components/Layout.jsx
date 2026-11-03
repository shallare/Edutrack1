import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Icon from './Icon';
import Logo from './Logo';
import './Layout.css';
import { toggleTheme, getTheme } from '../utils/theme';

/**
 * Layout — sidebar fixe + topbar + zone de contenu.
 * Utilisé par tous les dashboards et pages internes.
 *
 * Props:
 *  - user: { nom_complet, role, email }
 *  - role: 'admin' | 'enseignant' | 'etudiant' | 'delegue'
 *  - menuItems: [{ label, icon, href, alert?, active? }]
 *  - title, subtitle, actions (à droite du topbar)
 *  - children
 */
function Layout({ user, role, menuItems = [], title, subtitle, actions, children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [theme, setTheme] = useState(getTheme());
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const handleThemeChange = () => setTheme(getTheme());
        window.addEventListener('themechange', handleThemeChange);
        
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        return () => {
            window.removeEventListener('themechange', handleThemeChange);
            clearInterval(timer);
        };
    }, []);

    const formattedDate = currentTime.toLocaleDateString('fr-FR', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });
    const formattedTime = currentTime.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });

    const handleLogout = async () => {
        // Déconnexion côté serveur (on ne bloque pas l'UI si ça échoue ou si c'est lent)
        api.post('/logout').catch(() => {});

        // Nettoyage immédiat du stockage local
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Détermination du chemin de redirection
        const loginPath = 
            role === 'admin' ? '/admin/login' : 
            role === 'enseignant' ? '/enseignant/login' : 
            '/etudiant/login';

        // Redirection forcée pour nettoyer tout état React résiduel
        window.location.href = loginPath;
    };

    const roleLabel = {
        admin: 'Administrateur',
        enseignant: 'Enseignant',
        etudiant: 'Etudiant',
        delegue: 'Delegue de classe'
    }[role] || role;

    const initials = (user?.nom_complet || '?')
        .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className={`layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            {/* Backdrop mobile */}
            <div
                className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <button 
                    className="sidebar-collapse-btn" 
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    aria-label="Réduire/Agrandir le menu"
                >
                    <Icon name={sidebarCollapsed ? "chevron-right" : "chevron-left"} size={16} />
                </button>

                <div className="sidebar-brand">
                    <Logo size={22} noLink color="var(--text-primary)" />
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item, i) => {
                        const active = item.active ?? (item.href && location.pathname === item.href);
                        return (
                            <button
                                key={i}
                                className={`nav-item ${active ? 'active' : ''}`}
                                onClick={() => {
                                    if (item.onClick) item.onClick();
                                    else if (item.href && item.href !== '#') navigate(item.href);
                                    setSidebarOpen(false);
                                }}
                            >
                                <Icon name={item.icon} size={18} />
                                <span className="nav-label">{item.label}</span>
                                {item.alert > 0 && (
                                    <span className="nav-badge">{item.alert}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="avatar avatar-md accent">{initials}</div>
                        <div className="sidebar-user-info">
                            <p className="sidebar-user-name">{user?.nom_complet || '...'}</p>
                            <p className="sidebar-user-role">{roleLabel}</p>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="logout-btn" aria-label="Déconnexion">
                        <Icon name="log-out" size={16} />
                        <span className="nav-label">Deconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="main">
                <header className="topbar">
                    <button
                        className="menu-toggle"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Menu"
                    >
                        <Icon name="menu" size={22} />
                    </button>

                    <div className="topbar-titles" style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
                    </div>

                    <div className="topbar-clock" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-end', 
                        marginRight: '24px',
                        padding: '0 16px',
                        borderRight: '1px solid var(--glass-border)',
                        minWidth: '140px'
                    }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                            {formattedTime}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {formattedDate}
                        </span>
                    </div>

                    <div className="topbar-actions">
                        <button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label="Changer de thème" style={{ padding: '8px', borderRadius: '50%' }}>
                            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={20} />
                        </button>
                        {actions}
                        <div className="topbar-user">
                            <div className="topbar-user-info">
                                <p className="user-name">{user?.nom_complet}</p>
                                <p className="user-role">{roleLabel}</p>
                            </div>
                            <div className="topbar-avatar avatar avatar-sm accent">{initials}</div>
                        </div>
                    </div>
                </header>

                <main className="content fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;
