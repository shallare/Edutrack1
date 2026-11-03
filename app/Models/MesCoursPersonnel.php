<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MesCoursPersonnel extends Model
{
    protected $table = 'mes_cours_personnels';

    protected $fillable = [
        'etudiant_id',
        'titre',
        'description',
        'contenu',
        'statut',
        'couleur',
        'icone',
        'ordre',
        'nom_professeur',
        'annee_academique',
        'horaires',
        'notes_interrogation',
        'notes_devoir',
        'moyenne_interro',
        'moyenne_matiere',
        'share_token',
    ];

    protected $casts = [
        'notes_interrogation' => 'array',
        'notes_devoir'        => 'array',
        'horaires'            => 'array',
    ];

    public function etudiant()
    {
        return $this->belongsTo(Utilisateur::class, 'etudiant_id');
    }
}
