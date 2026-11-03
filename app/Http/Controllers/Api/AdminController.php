<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Assignation;
use App\Models\Cours;
use App\Models\Evaluation;
use App\Models\Matiere;
use App\Models\Classe;
use App\Models\MesCoursPersonnel;
use App\Models\Presence;
use App\Models\Utilisateur;

class AdminController extends Controller
{
    /* ─────────────────────────── Helpers ─────────────────────────── */

    /** IDs des classes auxquelles appartient un étudiant/délégué. */
    private function classeIdsEtudiant(Utilisateur $u): array
    {
        return $u->classes()->pluck('classes.id')->all();
    }

    /* ─────────────────────────── Dashboard admin ─────────────────────────── */

    public function dashboard(Request $request)
    {
        return response()->json([
            'stats' => [
                'etudiants'   => Utilisateur::whereIn('role', ['etudiant', 'delegue'])->count(),
                'enseignants' => Utilisateur::where('role', 'enseignant')->count(),
                'classes'     => Classe::count(),
                'matieres'    => Matiere::count(),
            ],
            'etudiants_en_attente' => Utilisateur::whereIn('role', ['etudiant', 'delegue'])->where('est_valide', false)->count(),
            'derniers_inscrits'    => Utilisateur::whereIn('role', ['etudiant', 'delegue'])
                                        ->orderByDesc('created_at')->limit(6)->get(),
        ]);
    }

    /* ─────────────────────────── Gestion étudiants ─────────────────────────── */

    public function etudiants(Request $request)
    {
        $etudiants = Utilisateur::whereIn('role', ['etudiant', 'delegue'])->orderByDesc('created_at')->get();
        return response()->json($etudiants);
    }

    public function validerEtudiant(Request $request, $id)
    {
        $etudiant = Utilisateur::whereIn('role', ['etudiant', 'delegue'])->findOrFail($id);
        $etudiant->update(['est_valide' => true]);

        return response()->json(['message' => 'Étudiant validé', 'etudiant' => $etudiant]);
    }

    public function bloquerEtudiant(Request $request, $id)
    {
        $etudiant = Utilisateur::whereIn('role', ['etudiant', 'delegue'])->findOrFail($id);
        $etudiant->update(['est_valide' => false]);

        return response()->json(['message' => 'Étudiant bloqué', 'etudiant' => $etudiant]);
    }

    /* ─────────────────────────── Gestion enseignants ─────────────────────────── */

    public function enseignants(Request $request)
    {
        $enseignants = Utilisateur::where('role', 'enseignant')->orderBy('nom')->get();
        return response()->json($enseignants);
    }

    public function creerEnseignant(Request $request)
    {
        $validated = $request->validate([
            'nom_complet'  => 'required|string|max:255',
            'email'        => 'required|email|unique:utilisateurs,email',
            'mot_de_passe' => 'required|min:6',
            'telephone'    => 'nullable|string|max:30',
        ]);

        // "Prénom Nom" → prenom = premier mot, nom = le reste
        $parts  = preg_split('/\s+/', trim($validated['nom_complet']), 2);
        $prenom = $parts[0];
        $nom    = $parts[1] ?? $parts[0];

        $enseignant = Utilisateur::create([
            'nom'               => $nom,
            'prenom'            => $prenom,
            'email'             => $validated['email'],
            'mot_de_passe'      => Hash::make($validated['mot_de_passe']),
            'telephone'         => $validated['telephone'] ?? null,
            'role'              => 'enseignant',
            'est_valide'        => true,
            // Compte créé par l'admin : pas de vérification e-mail nécessaire
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message'    => 'Enseignant créé avec succès',
            'enseignant' => $enseignant,
        ], 201);
    }

    /* ─────────────────────────── Gestion classes ─────────────────────────── */

    public function classes(Request $request)
    {
        return response()->json(Classe::orderBy('nom')->get());
    }

    public function creerClasse(Request $request)
    {
        $validated = $request->validate([
            'nom'              => 'required|string|max:255',
            'annee_academique' => 'required|string|max:20',
        ]);

        $classe = Classe::create($validated);

        return response()->json([
            'message' => 'Classe créée avec succès',
            'classe'  => $classe
        ], 201);
    }

    public function ajouterEtudiantClasse(Request $request)
    {
        $validated = $request->validate([
            'etudiant_id' => 'required|exists:utilisateurs,id',
            'classe_id'   => 'required|exists:classes,id',
        ]);

        $classe = Classe::findOrFail($validated['classe_id']);

        if ($classe->etudiants()->where('utilisateurs.id', $validated['etudiant_id'])->exists()) {
            return response()->json(['erreur' => 'Cet étudiant est déjà dans la classe.'], 422);
        }

        $classe->etudiants()->attach($validated['etudiant_id'], ['est_delegue' => false]);

        return response()->json(['message' => 'Étudiant ajouté à la classe']);
    }

    public function nommerDelegue(Request $request)
    {
        $validated = $request->validate([
            'etudiant_id' => 'required|exists:utilisateurs,id',
            'classe_id'   => 'required|exists:classes,id',
        ]);

        $classe   = Classe::findOrFail($validated['classe_id']);
        $etudiant = Utilisateur::findOrFail($validated['etudiant_id']);

        if (!$classe->etudiants()->where('utilisateurs.id', $etudiant->id)->exists()) {
            return response()->json(['erreur' => "Cet étudiant n'appartient pas à la classe."], 422);
        }

        // Un seul délégué par classe : on rétrograde l'ancien
        $ancienIds = $classe->etudiants()->wherePivot('est_delegue', true)->pluck('utilisateurs.id');
        foreach ($ancienIds as $ancienId) {
            $classe->etudiants()->updateExistingPivot($ancienId, ['est_delegue' => false]);
            Utilisateur::where('id', $ancienId)->update(['role' => 'etudiant']);
        }

        $classe->etudiants()->updateExistingPivot($etudiant->id, ['est_delegue' => true]);
        $etudiant->update(['role' => 'delegue']);

        return response()->json(['message' => 'Délégué nommé avec succès']);
    }

    public function etudiantsClasse(Request $request, $id)
    {
        $classe = Classe::findOrFail($id);

        $etudiants = $classe->etudiants()->get()->map(function ($e) {
            $e->est_delegue = (bool) $e->pivot->est_delegue;
            unset($e->pivot);
            return $e;
        });

        return response()->json($etudiants);
    }

    /* ─────────────────────────── Gestion matières ─────────────────────────── */

    public function matieres(Request $request)
    {
        return response()->json(Matiere::orderBy('nom')->get());
    }

    public function creerMatiere(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'description' => 'nullable|string',
            'total_chapitres' => 'nullable|integer',
        ]);

        $matiere = Matiere::create($validated);

        return response()->json([
            'message' => 'Matière créée avec succès',
            'matiere' => $matiere
        ], 201);
    }

    /* ─────────────────────────── Assignations ─────────────────────────── */

    public function assignerEnseignant(Request $request)
    {
        $validated = $request->validate([
            'enseignant_id' => 'required|exists:utilisateurs,id',
            'matiere_id'    => 'required|exists:matieres,id',
            'classe_id'     => 'required|exists:classes,id',
        ]);

        $deja = Assignation::where($validated)->exists();
        if ($deja) {
            return response()->json(['erreur' => 'Cette assignation existe déjà.'], 422);
        }

        $assignation = Assignation::create($validated)->load(['enseignant', 'matiere', 'classe']);

        return response()->json([
            'message'     => 'Enseignant assigné avec succès',
            'assignation' => $assignation,
        ], 201);
    }

    public function assignations(Request $request)
    {
        return response()->json(
            Assignation::with(['enseignant', 'matiere', 'classe'])->orderByDesc('created_at')->get()
        );
    }

    /* ─────────────────────────── Cahier de texte ─────────────────────────── */

    // Cours visibles par l'enseignant : ceux de ses assignations + ceux qu'il a créés/validés.
    public function coursEnseignant(Request $request)
    {
        $user  = $request->user();
        $query = Cours::with(['matiere', 'classe', 'createur']);

        if ($user->role === 'enseignant') {
            $assignations = Assignation::where('enseignant_id', $user->id)->get(['matiere_id', 'classe_id']);
            $query->where(function ($q) use ($user, $assignations) {
                $q->where('cree_par', $user->id)->orWhere('valide_par', $user->id);
                foreach ($assignations as $a) {
                    $q->orWhere(function ($qq) use ($a) {
                        $qq->where('matiere_id', $a->matiere_id)->where('classe_id', $a->classe_id);
                    });
                }
            });
        }
        // admin : voit tout

        return response()->json($query->orderByDesc('date')->get());
    }

    // Cours visibles par l'étudiant : uniquement ceux de ses classes.
    public function coursEtudiant(Request $request)
    {
        $user  = $request->user();
        $query = Cours::with(['matiere', 'classe']);

        if (in_array($user->role, ['etudiant', 'delegue'])) {
            $classeIds = $this->classeIdsEtudiant($user);
            if (empty($classeIds)) {
                return response()->json([]);
            }
            $query->whereIn('classe_id', $classeIds);
        }

        return response()->json($query->orderByDesc('date')->get());
    }

    public function creerCours(Request $request)
    {
        $validated = $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'classe_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'titre_chapitre' => 'required|string|max:255',
            'numero_chapitre' => 'required|integer',
            'resume' => 'required|string',
        ]);

        $validated['cree_par'] = $request->user()->id;
        $validated['statut'] = 'en_attente';

        $cours = Cours::create($validated);

        return response()->json([
            'message' => 'Cours créé avec succès',
            'cours' => $cours
        ], 201);
    }

    public function validerCours(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['enseignant', 'admin'])) {
            return response()->json(['erreur' => 'Seul un enseignant peut valider un cours.'], 403);
        }

        $cours = Cours::findOrFail($id);
        $cours->update([
            'statut'          => 'valide',
            'valide_par'      => $user->id,
            'date_validation' => now(),
            'signature_prof'  => $user->nom_complet,
        ]);

        return response()->json(['message' => 'Cours validé', 'cours' => $cours->load(['matiere', 'classe'])]);
    }

    public function corrigerCours(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['enseignant', 'admin'])) {
            return response()->json(['erreur' => 'Seul un enseignant peut corriger un cours.'], 403);
        }

        $validated = $request->validate([
            'titre_chapitre'  => 'sometimes|string|max:255',
            'numero_chapitre' => 'sometimes|integer',
            'resume'          => 'sometimes|string',
            'commentaire'     => 'nullable|string',
        ]);

        $cours = Cours::findOrFail($id);
        $cours->update(array_merge(
            array_intersect_key($validated, array_flip(['titre_chapitre', 'numero_chapitre', 'resume'])),
            ['statut' => 'corrige', 'valide_par' => $user->id]
        ));

        return response()->json(['message' => 'Cours corrigé', 'cours' => $cours->load(['matiere', 'classe'])]);
    }

    /* ─────────────────────────── Évaluations ─────────────────────────── */

    public function noterCours(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['etudiant', 'delegue'])) {
            return response()->json(['erreur' => 'Seul un étudiant peut évaluer un cours.'], 403);
        }

        $validated = $request->validate([
            'cours_id'      => 'required|exists:cours,id',
            'note_clarte'   => 'required|integer|min:1|max:5',
            'note_contenu'  => 'required|integer|min:1|max:5',
            'note_supports' => 'required|integer|min:1|max:5',
            'commentaire'   => 'nullable|string',
        ]);

        $evaluation = Evaluation::updateOrCreate(
            ['cours_id' => $validated['cours_id'], 'etudiant_id' => $user->id],
            [
                'note_clarte'   => $validated['note_clarte'],
                'note_contenu'  => $validated['note_contenu'],
                'note_supports' => $validated['note_supports'],
                'commentaire'   => $validated['commentaire'] ?? null,
                'est_anonyme'   => true,
            ]
        );

        return response()->json(['message' => 'Évaluation enregistrée', 'evaluation' => $evaluation], 201);
    }

    public function evaluationsCours(Request $request, $id)
    {
        Cours::findOrFail($id);
        $evaluations = Evaluation::where('cours_id', $id)->get();

        return response()->json([
            'moyennes' => [
                'clarte'            => round($evaluations->avg('note_clarte') ?? 0, 1),
                'contenu'           => round($evaluations->avg('note_contenu') ?? 0, 1),
                'supports'          => round($evaluations->avg('note_supports') ?? 0, 1),
                'total_evaluations' => $evaluations->count(),
            ],
            // Anonyme : on n'expose jamais etudiant_id
            'evaluations' => $evaluations->map(fn ($e) => [
                'note_clarte'   => $e->note_clarte,
                'note_contenu'  => $e->note_contenu,
                'note_supports' => $e->note_supports,
                'commentaire'   => $e->commentaire,
            ])->values(),
        ]);
    }

    /* ─────────────────────────── Mes Cours Personnels ─────────────────────────── */

    public function mesCours(Request $request)
    {
        return response()->json(
            MesCoursPersonnel::where('etudiant_id', $request->user()->id)
                ->orderByDesc('updated_at')->get()
        );
    }

    public function creerMonCours(Request $request)
    {
        $validated = $request->validate([
            'titre'            => 'required|string|max:255',
            'description'      => 'nullable|string|max:255',
            'contenu'          => 'nullable|string',
            'statut'           => 'nullable|in:a_venir,en_cours,termine',
            'couleur'          => 'nullable|string|max:20',
            'icone'            => 'nullable|string|max:50',
            'nom_professeur'   => 'nullable|string|max:255',
            'annee_academique' => 'nullable|string|max:255',
            'horaires'         => 'nullable|array',
            'horaires.*.jour'  => 'required_with:horaires|string|max:20',
            'horaires.*.debut' => 'required_with:horaires|string|max:5',
            'horaires.*.fin'   => 'required_with:horaires|string|max:5',
        ]);

        $cours = MesCoursPersonnel::create(array_merge($validated, [
            'etudiant_id' => $request->user()->id,
            'statut'      => $validated['statut'] ?? 'a_venir',
            'couleur'     => $validated['couleur'] ?? '#ffffff',
            'icone'       => $validated['icone'] ?? 'book',
            'ordre'       => (MesCoursPersonnel::where('etudiant_id', $request->user()->id)->max('ordre') ?? 0) + 1,
            'share_token' => Str::random(32),
        ]));

        return response()->json(['message' => 'Cours créé', 'cours' => $cours], 201);
    }

    public function modifierMonCours(Request $request, $id)
    {
        $cours = MesCoursPersonnel::where('etudiant_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'titre'               => 'sometimes|string|max:255',
            'description'         => 'nullable|string|max:255',
            'contenu'             => 'nullable|string',
            'statut'              => 'nullable|in:a_venir,en_cours,termine',
            'couleur'             => 'nullable|string|max:20',
            'icone'               => 'nullable|string|max:50',
            'nom_professeur'      => 'nullable|string|max:255',
            'annee_academique'    => 'nullable|string|max:255',
            'horaires'            => 'nullable|array',
            'horaires.*.jour'     => 'required_with:horaires|string|max:20',
            'horaires.*.debut'    => 'required_with:horaires|string|max:5',
            'horaires.*.fin'      => 'required_with:horaires|string|max:5',
            'notes_interrogation' => 'nullable|array',
            'notes_interrogation.*' => 'numeric|min:0|max:20',
            'notes_devoir'        => 'nullable|array',
            'notes_devoir.*'      => 'numeric|min:0|max:20',
        ]);

        // Moyennes recalculées côté serveur pour rester cohérent avec le front
        if (array_key_exists('notes_interrogation', $validated) || array_key_exists('notes_devoir', $validated)) {
            $interros = $validated['notes_interrogation'] ?? $cours->notes_interrogation ?? [];
            $devoirs  = $validated['notes_devoir'] ?? $cours->notes_devoir ?? [];
            $validated['moyenne_interro'] = count($interros) >= 1 ? round(array_sum($interros) / count($interros), 2) : null;
            $moyDevoir = count($devoirs) >= 1 ? round(array_sum($devoirs) / count($devoirs), 2) : null;
            $validated['moyenne_matiere'] = ($validated['moyenne_interro'] !== null && $moyDevoir !== null)
                ? round(($validated['moyenne_interro'] + $moyDevoir) / 2, 2)
                : null;
        }

        $cours->update($validated);

        return response()->json(['message' => 'Cours mis à jour', 'cours' => $cours->fresh()]);
    }

    public function supprimerMonCours(Request $request, $id)
    {
        $cours = MesCoursPersonnel::where('etudiant_id', $request->user()->id)->findOrFail($id);
        $cours->delete();

        return response()->json(['message' => 'Cours supprimé']);
    }

    // Lien de partage public d'un cours (génère le token s'il n'existe pas)
    public function lienPartage(Request $request, $id)
    {
        $cours = MesCoursPersonnel::where('etudiant_id', $request->user()->id)->findOrFail($id);

        if (!$cours->share_token) {
            $cours->update(['share_token' => Str::random(32)]);
        }

        return response()->json(['share_token' => $cours->share_token]);
    }

    // Consultation publique d'un cours partagé (lecture seule, sans compte)
    public function coursPartage($token)
    {
        $cours = MesCoursPersonnel::where('share_token', $token)->first();

        if (!$cours) {
            return response()->json(['erreur' => 'Ce lien de partage est invalide ou a été révoqué.'], 404);
        }

        return response()->json([
            'titre'          => $cours->titre,
            'description'    => $cours->description,
            'contenu'        => $cours->contenu,
            'nom_professeur' => $cours->nom_professeur,
            'updated_at'     => $cours->updated_at,
            'auteur'         => $cours->etudiant ? $cours->etudiant->prenom : 'Un étudiant',
        ]);
    }

    /* ─────────────────────────── Camarades ─────────────────────────── */

    public function camarades(Request $request)
    {
        $user = $request->user();
        $classeIds = $this->classeIdsEtudiant($user);

        if (!empty($classeIds)) {
            // Camarades = étudiants partageant au moins une classe
            $camarades = Utilisateur::whereIn('role', ['etudiant', 'delegue'])
                ->where('id', '!=', $user->id)
                ->whereHas('classes', fn ($q) => $q->whereIn('classes.id', $classeIds))
                ->orderBy('prenom')->get();
        } else {
            // Pas encore de classe : on montre les autres étudiants validés de la plateforme
            $camarades = Utilisateur::whereIn('role', ['etudiant', 'delegue'])
                ->where('id', '!=', $user->id)
                ->where('est_valide', true)
                ->orderBy('prenom')->get();
        }

        return response()->json($camarades->map(fn ($c) => [
            'id'          => $c->id,
            'nom'         => $c->nom_complet,
            'role'        => $c->role,
            'est_delegue' => $c->role === 'delegue',
            'enLigne'     => false, // pas de présence temps réel pour l'instant
        ])->values());
    }

    /* ─────────────────────────── QR Code & Présences ─────────────────────────── */

    public function genererQRCode(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['etudiant', 'delegue'])) {
            return response()->json(['erreur' => 'Réservé aux étudiants.'], 403);
        }

        // Un code stable par étudiant (regénéré uniquement s'il n'existe pas)
        if (!$user->code_qr) {
            $user->update(['code_qr' => 'WIICO-ETU-' . $user->id . '-' . Str::upper(Str::random(16))]);
        }

        return response()->json(['qr_code' => $user->code_qr]);
    }

    public function scannerPresence(Request $request)
    {
        $validated = $request->validate([
            'cours_id' => 'required|exists:cours,id',
            'qr_data'  => 'required|string',
        ]);

        $etudiant = Utilisateur::where('code_qr', $validated['qr_data'])
            ->whereIn('role', ['etudiant', 'delegue'])->first();

        if (!$etudiant) {
            return response()->json(['erreur' => 'QR Code inconnu.'], 404);
        }

        $cours = Cours::findOrFail($validated['cours_id']);

        // L'étudiant doit appartenir à la classe du cours
        $dansLaClasse = $etudiant->classes()->where('classes.id', $cours->classe_id)->exists();
        if (!$dansLaClasse) {
            return response()->json(['erreur' => "Cet étudiant n'appartient pas à la classe du cours."], 422);
        }

        $deja = Presence::where('cours_id', $cours->id)->where('etudiant_id', $etudiant->id)->first();
        if ($deja && $deja->statut === 'present') {
            return response()->json(['erreur' => 'Présence déjà enregistrée pour cet étudiant.'], 422);
        }

        Presence::updateOrCreate(
            ['cours_id' => $cours->id, 'etudiant_id' => $etudiant->id],
            [
                'statut'     => 'present',
                'heure_scan' => now(),
                'scanne_par' => $request->user()->id,
                'est_valide' => true,
            ]
        );

        return response()->json(['message' => 'Présence enregistrée', 'etudiant' => $etudiant->nom_complet]);
    }

    public function presencesCours(Request $request, $id)
    {
        Cours::findOrFail($id);

        return response()->json(
            Presence::with('etudiant')->where('cours_id', $id)->orderByDesc('heure_scan')->get()
        );
    }

    public function marquerAbsents(Request $request, $id)
    {
        $cours = Cours::findOrFail($id);

        $etudiantIds = $cours->classe
            ? $cours->classe->etudiants()->pluck('utilisateurs.id')
            : collect();

        $presents = Presence::where('cours_id', $cours->id)->pluck('etudiant_id');
        $absents  = $etudiantIds->diff($presents);

        foreach ($absents as $etudiantId) {
            Presence::create([
                'cours_id'    => $cours->id,
                'etudiant_id' => $etudiantId,
                'statut'      => 'absent',
                'scanne_par'  => $request->user()->id,
                'est_valide'  => true,
            ]);
        }

        return response()->json(['message' => $absents->count() . ' étudiant(s) marqué(s) absent(s)']);
    }
}
