/**
 * Calculs de moyennes — côté frontend.
 * Règle métier : une moyenne n'est calculable qu'avec au minimum 1 note.
 * La moyenne générale d'une matière exige min. 1 interro ET min. 1 devoir.
 */

/** Moyenne d'une liste de notes ; null si aucune note. */
export function moyenne(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return null;
    const valides = notes.map(Number).filter(n => !Number.isNaN(n));
    if (valides.length === 0) return null;
    return valides.reduce((a, b) => a + b, 0) / valides.length;
}

/** Moyennes d'un cours personnel { interro, devoir, generale } (null = pas calculable). */
export function moyennesCours(cours) {
    const interro = moyenne(cours?.notes_interrogation);
    const devoir  = moyenne(cours?.notes_devoir);
    const generale = interro !== null && devoir !== null ? (interro + devoir) / 2 : null;
    return { interro, devoir, generale };
}

/** Moyenne générale de l'étudiant sur tous ses cours (cours calculables uniquement). */
export function moyenneGenerale(listeCours) {
    const generales = (listeCours || [])
        .map(c => moyennesCours(c).generale)
        .filter(g => g !== null);
    return moyenne(generales);
}

/** Formatage : "14.5" ou fallback. */
export function fmt(note, fallback = '—') {
    return note === null || note === undefined ? fallback : note.toFixed(1);
}
