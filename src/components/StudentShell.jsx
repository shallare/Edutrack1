import { Outlet, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { useAuth, LoadingScreen } from './Common';
import { studentMenu } from '../utils/menus';

/**
 * StudentShell — coquille persistante de l'espace étudiant.
 * La sidebar et la topbar restent montées : seul le contenu change
 * (avec une transition de glissement), plus de "rechargement" à chaque clic.
 */

const PAGE_META = {
    '/etudiant/dashboard':      { title: 'Tableau de bord', subtitle: (u) => `Bienvenue, ${u?.nom_complet || ''}` },
    '/etudiant/cours':          { title: 'Mes cours',        subtitle: () => 'Votre plan d\'étude : cours, notes et révisions.' },
    '/etudiant/cours/editeur':  { title: 'Plan d\'Étude',    subtitle: () => 'Rédigez, dessinez et structurez vos révisions.' },
    '/etudiant/emploi-du-temps':{ title: 'Emploi du temps',  subtitle: () => 'Vos créneaux de cours de la semaine.' },
    '/etudiant/camarades':      { title: 'Mes camarades',    subtitle: () => 'Collaborez et discutez avec votre classe.' },
    '/etudiant/parametres':     { title: 'Paramètres',       subtitle: () => 'Gérez votre profil, vos préférences et vos contacts.' },
};

function StudentShell() {
    const { user, ready } = useAuth(['etudiant', 'delegue'], '/etudiant/login');
    const location = useLocation();

    if (!ready) return <LoadingScreen text="Chargement de votre espace..." />;

    const meta = PAGE_META[location.pathname] || { title: 'Wii-Co', subtitle: () => '' };
    // Le tableau de bord occupe exactement la hauteur visible (pas de scroll)
    const isDashboard = location.pathname === '/etudiant/dashboard';

    return (
        <Layout
            user={user}
            role={user?.role}
            menuItems={studentMenu(user?.role === 'delegue')}
            title={meta.title}
            subtitle={meta.subtitle(user)}
        >
            <div
                key={location.pathname}
                className="page-slide"
                style={isDashboard ? { height: '100%', overflow: 'hidden' } : undefined}
            >
                <Outlet context={{ user }} />
            </div>
        </Layout>
    );
}

export default StudentShell;
