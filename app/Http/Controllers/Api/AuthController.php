<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Mail\VerificationCodeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /** Durée de validité des codes envoyés par e-mail (minutes). */
    private const CODE_TTL_MINUTES = 15;

    /** Génère un code à 6 chiffres et l'enregistre avec son expiration. */
    private function genererCode(Utilisateur $utilisateur): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $utilisateur->update([
            'verification_code' => $code,
            'code_expire_le'    => now()->addMinutes(self::CODE_TTL_MINUTES),
        ]);
        return $code;
    }

    /** Envoie le code par e-mail sans faire échouer la requête si le SMTP est indisponible. */
    private function envoyerCode(Utilisateur $utilisateur, string $code): void
    {
        try {
            Mail::to($utilisateur->email)->send(new VerificationCodeMail($code));
        } catch (\Throwable $e) {
            report($e); // loggé, mais l'inscription/réinitialisation n'échoue pas
        }
    }

    // Connexion Admin
    public function loginAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'mot_de_passe' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::where('email', $request->email)
                                  ->where('role', 'admin')
                                  ->first();

        if (!$utilisateur || !Hash::check($request->mot_de_passe, $utilisateur->mot_de_passe)) {
            return response()->json(['erreur' => 'Email ou mot de passe incorrect'], 401);
        }

        $token = $utilisateur->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'utilisateur' => $utilisateur,
            'token' => $token
        ]);
    }

    // Inscription Enseignant
    public function registerEnseignant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'mot_de_passe' => 'required|min:6',
            'mot_de_passe_confirmation' => 'required|same:mot_de_passe'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'mot_de_passe' => Hash::make($request->mot_de_passe),
            'role' => 'enseignant',
            'est_valide' => false,
        ]);

        $this->envoyerCode($utilisateur, $this->genererCode($utilisateur));

        return response()->json([
            'message' => 'Inscription réussie. Un code de vérification a été envoyé à votre adresse e-mail.',
            'utilisateur_id' => $utilisateur->id
        ], 201);
    }

    // Connexion Enseignant
    public function loginEnseignant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'mot_de_passe' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::where('email', $request->email)
                                  ->whereIn('role', ['enseignant', 'admin'])
                                  ->first();

        if (!$utilisateur || !Hash::check($request->mot_de_passe, $utilisateur->mot_de_passe)) {
            return response()->json(['erreur' => 'Email ou mot de passe incorrect'], 401);
        }

        // Connexion : email + mot de passe suffisent.
        // (La vérification par code n'est exigée qu'à l'inscription.)
        $token = $utilisateur->createToken('enseignant-token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'utilisateur' => $utilisateur,
            'token' => $token
        ]);
    }

    // Inscription Étudiant
    public function registerEtudiant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'mot_de_passe' => 'required|min:6',
            'mot_de_passe_confirmation' => 'required|same:mot_de_passe'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'mot_de_passe' => Hash::make($request->mot_de_passe),
            'role' => 'etudiant',
            'est_valide' => false,
        ]);

        $this->envoyerCode($utilisateur, $this->genererCode($utilisateur));

        return response()->json([
            'message' => 'Inscription réussie. Un code de vérification a été envoyé à votre adresse e-mail.',
            'utilisateur_id' => $utilisateur->id
        ], 201);
    }

    // Connexion Étudiant/Délégué
    public function loginEtudiant(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'mot_de_passe' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::where('email', $request->email)
                                  ->whereIn('role', ['etudiant', 'delegue'])
                                  ->first();

        if (!$utilisateur || !Hash::check($request->mot_de_passe, $utilisateur->mot_de_passe)) {
            return response()->json(['erreur' => 'Email ou mot de passe incorrect'], 401);
        }

        // Connexion : email + mot de passe suffisent.
        // (La vérification par code n'est exigée qu'à l'inscription.)
        $token = $utilisateur->createToken('etudiant-token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'utilisateur' => $utilisateur,
            'token' => $token
        ]);
    }

    // Vérification du code e-mail
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'utilisateur_id' => 'required|integer',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::find($request->utilisateur_id);

        if (!$utilisateur) {
            return response()->json(['erreur' => 'Utilisateur introuvable.'], 404);
        }

        if ($utilisateur->verification_code !== $request->code) {
            return response()->json(['erreur' => 'Code de vérification incorrect.'], 422);
        }

        if ($utilisateur->code_expire_le && now()->greaterThan($utilisateur->code_expire_le)) {
            return response()->json(['erreur' => 'Ce code a expiré. Demandez un nouveau code.'], 422);
        }

        $utilisateur->update([
            'email_verified_at' => now(),
            'est_valide' => true,
            'verification_code' => null,
            'code_expire_le' => null,
        ]);

        $token = $utilisateur->createToken($utilisateur->role . '-token')->plainTextToken;

        return response()->json([
            'message' => 'E-mail vérifié avec succès.',
            'utilisateur' => $utilisateur,
            'token' => $token
        ]);
    }

    // Renvoyer le code de vérification
    public function resendCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'utilisateur_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::find($request->utilisateur_id);

        if (!$utilisateur) {
            return response()->json(['erreur' => 'Utilisateur introuvable.'], 404);
        }

        $this->envoyerCode($utilisateur, $this->genererCode($utilisateur));

        return response()->json(['message' => 'Un nouveau code a été envoyé.']);
    }

    // Déconnexion
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    // Profil utilisateur connecté
    public function profil(Request $request)
    {
        return response()->json($request->user());
    }

    // Mise à jour du profil académique (page Paramètres étudiant)
    public function updateProfil(Request $request)
    {
        $validated = $request->validate([
            'universite'              => 'nullable|string|max:255',
            'filiere'                 => 'nullable|string|max:255',
            'classe_nom'              => 'nullable|string|max:255',
            'telephone'               => 'nullable|string|max:30',
            'visualisation_parentale' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'message'     => 'Profil mis à jour',
            'utilisateur' => $user->fresh(),
        ]);
    }

    // Mot de passe oublié : envoi d'un code de réinitialisation
    public function motDePasseOublie(Request $request)
    {
        $validator = Validator::make($request->all(), ['email' => 'required|email']);
        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::where('email', $request->email)->first();

        // Réponse identique que le compte existe ou non (anti-énumération d'e-mails)
        if ($utilisateur) {
            $this->envoyerCode($utilisateur, $this->genererCode($utilisateur));
        }

        return response()->json([
            'message' => 'Si un compte existe pour cette adresse, un code de réinitialisation vient d\'être envoyé.',
        ]);
    }

    // Réinitialisation du mot de passe avec le code reçu par e-mail
    public function reinitialiserMotDePasse(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'                             => 'required|email',
            'code'                              => 'required|string|size:6',
            'nouveau_mot_de_passe'              => 'required|min:6',
            'nouveau_mot_de_passe_confirmation' => 'required|same:nouveau_mot_de_passe',
        ]);
        if ($validator->fails()) {
            return response()->json(['erreur' => $validator->errors()], 422);
        }

        $utilisateur = Utilisateur::where('email', $request->email)->first();

        if (!$utilisateur || $utilisateur->verification_code !== $request->code) {
            return response()->json(['erreur' => 'Code de réinitialisation incorrect.'], 422);
        }

        if ($utilisateur->code_expire_le && now()->greaterThan($utilisateur->code_expire_le)) {
            return response()->json(['erreur' => 'Ce code a expiré. Demandez un nouveau code.'], 422);
        }

        $utilisateur->update([
            'mot_de_passe'      => Hash::make($request->nouveau_mot_de_passe),
            'verification_code' => null,
            'code_expire_le'    => null,
        ]);

        // Sécurité : on révoque toutes les sessions existantes
        $utilisateur->tokens()->delete();

        return response()->json(['message' => 'Mot de passe réinitialisé. Vous pouvez vous connecter.']);
    }

    // Changement de mot de passe (utilisateur connecté)
    public function changerMotDePasse(Request $request)
    {
        $validated = $request->validate([
            'ancien_mot_de_passe'                => 'required',
            'nouveau_mot_de_passe'               => 'required|min:6',
            'nouveau_mot_de_passe_confirmation'  => 'required|same:nouveau_mot_de_passe',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['ancien_mot_de_passe'], $user->mot_de_passe)) {
            return response()->json(['erreur' => 'L\'ancien mot de passe est incorrect.'], 422);
        }

        $user->update(['mot_de_passe' => Hash::make($validated['nouveau_mot_de_passe'])]);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }
}