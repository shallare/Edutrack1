<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ── Routes publiques (limitées : 10 requêtes / minute contre la force brute) ──
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/enseignant/register', [AuthController::class, 'registerEnseignant']);
    Route::post('/enseignant/login', [AuthController::class, 'loginEnseignant']);
    Route::post('/etudiant/register', [AuthController::class, 'registerEtudiant']);
    Route::post('/etudiant/login', [AuthController::class, 'loginEtudiant']);
    Route::post('/admin/login', [AuthController::class, 'loginAdmin']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-code', [AuthController::class, 'resendCode']);
    Route::post('/mot-de-passe-oublie', [AuthController::class, 'motDePasseOublie']);
    Route::post('/mot-de-passe-reinitialiser', [AuthController::class, 'reinitialiserMotDePasse']);
});

// Cours partagé en lecture seule (lien public, pas de compte requis)
Route::get('/partage/{token}', [AdminController::class, 'coursPartage'])->middleware('throttle:30,1');

// ── Routes protégées ──
Route::middleware('auth:sanctum')->group(function () {

    // Commun à tous les rôles connectés
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profil', [AuthController::class, 'profil']);
    Route::put('/mot-de-passe', [AuthController::class, 'changerMotDePasse']);
    Route::post('/upload-image', [UploadController::class, 'image'])->middleware('throttle:30,1');

    // ── Administration (rôle admin uniquement) ──
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);

        Route::get('/admin/etudiants', [AdminController::class, 'etudiants']);
        Route::put('/admin/etudiant/{id}/valider', [AdminController::class, 'validerEtudiant']);
        Route::put('/admin/etudiant/{id}/bloquer', [AdminController::class, 'bloquerEtudiant']);

        Route::get('/admin/enseignants', [AdminController::class, 'enseignants']);
        Route::post('/admin/enseignant/creer', [AdminController::class, 'creerEnseignant']);

        Route::get('/admin/classes', [AdminController::class, 'classes']);
        Route::post('/admin/classe/creer', [AdminController::class, 'creerClasse']);

        Route::post('/admin/etudiant/ajouter-classe', [AdminController::class, 'ajouterEtudiantClasse']);
        Route::post('/admin/etudiant/nommer-delegue', [AdminController::class, 'nommerDelegue']);
        Route::get('/admin/classe/{id}/etudiants', [AdminController::class, 'etudiantsClasse']);

        Route::get('/admin/matieres', [AdminController::class, 'matieres']);
        Route::post('/admin/matiere/creer', [AdminController::class, 'creerMatiere']);

        Route::post('/admin/enseignant/assigner', [AdminController::class, 'assignerEnseignant']);
        Route::get('/admin/assignations', [AdminController::class, 'assignations']);
    });

    // ── Enseignant (cahier de texte : validation, correction, évaluations) ──
    Route::middleware('role:enseignant,admin')->group(function () {
        Route::get('/enseignant/cours', [AdminController::class, 'coursEnseignant']);
        Route::put('/cours/{id}/valider', [AdminController::class, 'validerCours']);
        Route::put('/cours/{id}/corriger', [AdminController::class, 'corrigerCours']);
        Route::get('/cours/{id}/evaluations', [AdminController::class, 'evaluationsCours']);
    });

    // ── Cahier de texte : saisie par le délégué (ou enseignant/admin) ──
    Route::middleware('role:delegue,enseignant,admin')->group(function () {
        Route::post('/cours/creer', [AdminController::class, 'creerCours']);
        Route::post('/presence/scanner', [AdminController::class, 'scannerPresence']);
        Route::get('/cours/{id}/presences', [AdminController::class, 'presencesCours']);
        Route::post('/cours/{id}/absents', [AdminController::class, 'marquerAbsents']);
    });

    // ── Espace étudiant / délégué ──
    Route::middleware('role:etudiant,delegue')->group(function () {
        Route::get('/etudiant/cours', [AdminController::class, 'coursEtudiant']);
        Route::get('/etudiant/camarades', [AdminController::class, 'camarades']);
        Route::put('/etudiant/profil', [AuthController::class, 'updateProfil']);
        Route::post('/cours/noter', [AdminController::class, 'noterCours']);
        Route::get('/etudiant/qrcode', [AdminController::class, 'genererQRCode']);

        // Mes Cours Personnels (carnet personnel de l'étudiant)
        Route::get('/etudiant/mes-cours', [AdminController::class, 'mesCours']);
        Route::post('/etudiant/mes-cours', [AdminController::class, 'creerMonCours']);
        Route::put('/etudiant/mes-cours/{id}', [AdminController::class, 'modifierMonCours']);
        Route::delete('/etudiant/mes-cours/{id}', [AdminController::class, 'supprimerMonCours']);
        Route::get('/etudiant/mes-cours/{id}/partage', [AdminController::class, 'lienPartage']);

        // Messagerie entre camarades (polling)
        Route::get('/etudiant/messages-non-lus', [MessageController::class, 'nonLus']);
        Route::get('/etudiant/messages/{id}', [MessageController::class, 'conversation']);
        Route::post('/etudiant/messages/{id}', [MessageController::class, 'envoyer']);
    });
});
