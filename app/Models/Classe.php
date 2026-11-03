<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    protected $table = 'classes';

    protected $fillable = [
        'nom',
        'annee_academique'
    ];

    // Relations
    public function etudiants()
    {
        return $this->belongsToMany(Utilisateur::class, 'etudiant_classe', 'classe_id', 'etudiant_id')
                    ->withPivot('est_delegue');
    }

    public function cours()
    {
        return $this->hasMany(Cours::class, 'classe_id');
    }

    public function matieres()
    {
        return $this->belongsToMany(Matiere::class, 'enseignant_matiere_classe', 'classe_id', 'matiere_id');
    }
}