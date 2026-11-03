import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './styles/theme.css';
import { toggleTheme, getTheme } from './utils/theme';

import Icon from './components/Icon';

// Pages refondues
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EtudiantsList from './pages/EtudiantsList';
import CreerEnseignant from './pages/CreerEnseignant';
import CreerClasse from './pages/CreerClasse';
import CreerMatiere from './pages/CreerMatiere';
import AssignerEnseignant from './pages/AssignerEnseignant';
import GestionClasse from './pages/GestionClasse';
import CahierTexteForm from './pages/CahierTexteForm';
import ValidationCours from './pages/ValidationCours';

import MonQRCode from './pages/MonQRCode';
import ScannerPresence from './pages/ScannerPresence';
import TeacherLogin from './pages/TeacherLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentAuth from './pages/StudentAuth';
import StudentShell from './components/StudentShell';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentTimetable from './pages/StudentTimetable';
import StudyPlanEditor from './pages/StudyPlanEditor';
import StudentClassmates from './pages/StudentClassmates';
import StudentSettings from './pages/StudentSettings';
import SharedCourse from './pages/SharedCourse';

function App() {
    // Re-save for route update check
    return (
        <Router>
            <Routes>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/etudiants" element={<EtudiantsList />} />
                <Route path="/admin/enseignant/creer" element={<CreerEnseignant />} />
                <Route path="/admin/classe/creer" element={<CreerClasse />} />
                <Route path="/admin/classe/gerer" element={<GestionClasse />} />
                <Route path="/admin/matiere/creer" element={<CreerMatiere />} />
                <Route path="/admin/enseignant/assigner" element={<AssignerEnseignant />} />
                <Route path="/enseignant/login" element={<TeacherLogin />} />
                <Route path="/enseignant/dashboard" element={<TeacherDashboard />} />
                <Route path="/enseignant/validation" element={<ValidationCours />} />
                <Route path="/etudiant/login" element={<StudentAuth />} />
                {/* Espace étudiant : coquille persistante (sidebar/topbar fixes, contenu qui glisse) */}
                <Route element={<StudentShell />}>
                    <Route path="/etudiant/dashboard" element={<StudentDashboard />} />
                    <Route path="/etudiant/cours" element={<StudentCourses />} />
                    <Route path="/etudiant/cours/editeur" element={<StudyPlanEditor />} />
                    <Route path="/etudiant/emploi-du-temps" element={<StudentTimetable />} />
                    <Route path="/etudiant/camarades" element={<StudentClassmates />} />
                    <Route path="/etudiant/parametres" element={<StudentSettings />} />
                </Route>
                {/* Présences (pages autonomes : elles portent leur propre Layout) */}
                <Route path="/etudiant/qrcode" element={<MonQRCode />} />
                <Route path="/etudiant/scanner" element={<ScannerPresence />} />
                {/* Cours partagé — page publique, aucun compte requis */}
                <Route path="/partage/:token" element={<SharedCourse />} />
                {/* L'ancien plan d'étude est fusionné dans Mes cours */}
                <Route path="/etudiant/notes" element={<Navigate to="/etudiant/cours" replace />} />
                <Route path="/" element={<HomePage />} />
            </Routes>
        </Router>
    );
}

/* ============================================================
   Page d'accueil — choix du portail
   ============================================================ */
function HomePage() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(getTheme());

    useEffect(() => {
        const handleThemeChange = () => setTheme(getTheme());
        window.addEventListener('themechange', handleThemeChange);
        return () => window.removeEventListener('themechange', handleThemeChange);
    }, []);

    const portals = [
        {
            href: '/enseignant/login',
            icon: 'chalkboard',
            label: 'Espace Enseignant',
            description: 'Validez le cahier de texte et consultez les evaluations',
            tag: 'ENSEIGNANT',
            color: 'var(--text-primary)',
            bg: 'var(--glass-bg-light)',
        },
        {
            href: '/etudiant/login',
            icon: 'graduation-cap',
            label: 'Espace Etudiant',
            description: 'Cours, evaluations, presence et QR code de classe',
            tag: 'ETUDIANT',
            color: 'var(--text-primary)',
            bg: 'var(--glass-bg-light)',
        },
    ];

    const features = [
        { icon: 'book-open', label: 'Cahier numerique' },
        { icon: 'qr-code', label: 'Presence par QR Code' },
        { icon: 'star', label: 'Evaluation pedagogique' },
        { icon: 'shield', label: 'Securite et integrite' },
    ];

    return (
        <div className="home-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', isolation: 'isolate' }}>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'url("https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&q=80&w=2560")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: 'var(--bg-image-opacity)',
                zIndex: -1,
            }} />
            <button
                className="btn btn-ghost"
                onClick={toggleTheme}
                aria-label="Changer de thème"
                style={{ position: 'absolute', top: 20, right: 20, padding: 10, borderRadius: '50%' }}
            >
                <Icon name={theme === 'light' ? 'moon' : 'sun'} size={24} />
            </button>
            {/* Hero */}
            <div className="home-hero" style={{
                padding: '72px 20px 36px',
                textAlign: 'center',
                position: 'relative',
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    background: 'var(--accent-soft)',
                    border: '1px solid rgba(244, 184, 96, 0.25)',
                    borderRadius: 999,
                    marginBottom: 22,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: 'var(--accent)',
                }}>
                    <Icon name="medal" size={13} />
                    PLATEFORME ACADEMIQUE
                </div>
                <h1 style={{
                    fontSize: 'clamp(40px, 7vw, 72px)',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    margin: '0 0 16px',
                    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: -1,
                }}>
                    Wii-Co
                </h1>
                <p style={{
                    fontSize: 17,
                    color: 'var(--text-secondary)',
                    maxWidth: 600,
                    margin: '0 auto 8px',
                    lineHeight: 1.6,
                }}>
                    Suivi academique collaboratif, presence par QR Code,
                    cahier de texte numerique et evaluation pedagogique.
                </p>
            </div>

            {/* Portals */}
            <div style={{ padding: '20px 20px 36px', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 22,
                    maxWidth: 1100,
                    width: '100%',
                }}>
                    {portals.map(p => (
                        <button
                            key={p.href}
                            className="glass-card interactive"
                            style={{
                                padding: 30,
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 16,
                                border: '1px solid var(--glass-border)',
                                background: 'var(--glass-bg)',
                                color: 'inherit',
                            }}
                            onClick={() => navigate(p.href)}
                        >
                            <div style={{
                                width: 56, height: 56,
                                borderRadius: 16,
                                background: p.bg,
                                color: p.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon name={p.icon} size={28} />
                            </div>
                            <div style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                letterSpacing: 1.5,
                                color: p.color,
                                padding: '4px 10px',
                                background: p.bg,
                                borderRadius: 999,
                            }}>{p.tag}</div>
                            <h3 style={{
                                fontSize: 22,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0,
                                fontFamily: 'var(--font-display)',
                            }}>{p.label}</h3>
                            <p style={{
                                fontSize: 13.5,
                                color: 'var(--text-muted)',
                                margin: 0,
                                lineHeight: 1.6,
                            }}>{p.description}</p>
                            <div style={{
                                marginTop: 'auto',
                                paddingTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: 'var(--accent)',
                                fontSize: 13,
                                fontWeight: 600,
                            }}>
                                <span>Acceder au portail</span>
                                <Icon name="arrow-right" size={15} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Features strip */}
            <div style={{ padding: '12px 20px 60px', display: 'flex', justifyContent: 'center' }}>
                <div className="glass-card" style={{
                    padding: '20px 24px',
                    maxWidth: 1100,
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 18,
                }}>
                    {features.map(f => (
                        <div key={f.label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}>
                            <div style={{
                                width: 36, height: 36,
                                borderRadius: 10,
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Icon name={f.icon} size={17} />
                            </div>
                            <span style={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                            }}>{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#ffffff',
                fontSize: 12,
                borderTop: '1px solid var(--glass-border)',
                marginTop: 'auto',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                fontWeight: 500,
            }}>
                Wii-Co - Vers une education plus transparente, plus juste et plus moderne
            </div>
        </div>
    );
}

export default App;
