/**
 * Menus de navigation par rôle.
 * Utilisé par toutes les pages internes.
 */

export function adminMenu(enAttente = 0) {
    return [
        { label: 'Tableau de bord', icon: 'dashboard',  href: '/admin/dashboard' },
        { label: 'Etudiants',       icon: 'users',      href: '/admin/etudiants', alert: enAttente },
        { label: 'Classes',         icon: 'building',   href: '/admin/classe/gerer' },
        { label: 'Matieres',        icon: 'book',       href: '/admin/matiere/creer' },
        { label: 'Enseignants',     icon: 'chalkboard', href: '/admin/enseignant/creer' },
        { label: 'Assignations',    icon: 'flag',       href: '/admin/enseignant/assigner' },
    ];
}

export function teacherMenu() {
    return [
        { label: 'Tableau de bord',   icon: 'dashboard',       href: '/enseignant/dashboard' },
        { label: 'Cahier de texte',   icon: 'clipboard-check', href: '/enseignant/validation' },
    ];
}

export function studentMenu(isDelegue = false) {
    return [
        { label: 'Tableau de bord', icon: 'dashboard', href: '/etudiant/dashboard' },
        { label: 'Mes cours',       icon: 'book-open', href: '/etudiant/cours' },
        { label: 'Emploi du temps', icon: 'calendar',  href: '/etudiant/emploi-du-temps' },
        { label: 'Mon QR Code',     icon: 'qr-code',   href: '/etudiant/qrcode' },
        ...(isDelegue ? [{ label: 'Scanner présences', icon: 'scan', href: '/etudiant/scanner' }] : []),
        { label: 'Mes camarades',   icon: 'users',     href: '/etudiant/camarades' },
        { label: 'Paramètres',      icon: 'settings',  href: '/etudiant/parametres' },
    ];
}
