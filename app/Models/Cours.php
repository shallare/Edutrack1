<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cours extends Model
{
    protected $table = 'cours';

    protected $fillable = [
        'matiere_id',
        'classe_id',
        'date',
        'heure_debut',
        'heure_fin',
        'titre_chapitre',
        'numero_chapitre',
        'resume',
        'statut',
        'cree_par',
        'valide_par',
        'signature_prof',
        'date_validation'
    ];

    protected $casts = [
        'date' => 'date',
        'date_validation' => 'datetime',
    ];

    // Relations
    public function matiere()
    {
        return $this->belongsTo(Matiere::class, 'matiere_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function createur()
    {
        return $this->belongsTo(Utilisateur::class, 'cree_par');
    }

    public function validateur()
    {
        return $this->belongsTo(Utilisateur::class, 'valide_par');
    }

    public function presences()
    {
        return $this->hasMany(Presence::class, 'cours_id');
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'cours_id');
    }

    // Vérifier si le cours est validé
    public function estValide()
    {
        return $this->statut === 'valide';
    }
}