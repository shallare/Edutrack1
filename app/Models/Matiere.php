<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    protected $table = 'matieres';

    protected $fillable = [
        'nom',
        'code',
        'description',
        'total_chapitres'
    ];

    // Relations
    public function cours()
    {
        return $this->hasMany(Cours::class, 'matiere_id');
    }

    public function classes()
    {
        return $this->belongsToMany(Classe::class, 'enseignant_matiere_classe', 'matiere_id', 'classe_id');
    }

    public function enseignants()
    {
        return $this->belongsToMany(Utilisateur::class, 'enseignant_matiere_classe', 'matiere_id', 'enseignant_id');
    }
}