<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $table = 'evaluations';

    protected $fillable = [
        'cours_id',
        'etudiant_id',
        'note_clarte',
        'note_contenu',
        'note_supports',
        'commentaire',
        'est_anonyme'
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

    // Calculer la note moyenne
    public function noteMoyenne()
    {
        return round(($this->note_clarte + $this->note_contenu + $this->note_supports) / 3, 1);
    }
}