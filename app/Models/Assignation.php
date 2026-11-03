<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assignation extends Model
{
    protected $table = 'assignations';

    protected $fillable = [
        'enseignant_id',
        'matiere_id',
        'classe_id',
    ];

    // Relations
    public function enseignant()
    {
        return $this->belongsTo(Utilisateur::class, 'enseignant_id');
    }

    public function matiere()
    {
        return $this->belongsTo(Matiere::class, 'matiere_id');
    }

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }
}
