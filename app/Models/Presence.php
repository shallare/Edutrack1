<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presence extends Model
{
    protected $table = 'presences';

    protected $fillable = [
        'cours_id',
        'etudiant_id',
        'statut',
        'heure_scan',
        'scanne_par',
        'est_valide'
    ];

    protected $casts = [
        'heure_scan' => 'datetime',
    ];

    // Relations
    public function cours()
    {
        return $this->belongsTo(Cours::class, 'cours_id');
    }

    public function etudiant()
    {
        return $this->belongsTo(Utilisateur::class, 'etudiant_id');
    }

    public function scanneur()
    {
        return $this->belongsTo(Utilisateur::class, 'scanne_par');
    }

    // Vérifier si présent
    public function estPresent()
    {
        return $this->statut === 'present';
    }
}