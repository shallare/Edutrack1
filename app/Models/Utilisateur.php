<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'mot_de_passe',
        'role',
        'matricule',
        'code_qr',
        'est_valide',
        'telephone',
        'universite',
        'filiere',
        'classe_nom',
        'visualisation_parentale',
        'verification_code',
        'code_expire_le',
        'email_verified_at'
    ];

    public function getNomCompletAttribute()
    {
        return $this->prenom . ' ' . $this->nom;
    }

    protected $appends = ['nom_complet'];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
        'verification_code',
    ];

    public function getAuthPassword(): string
    {
        return $this->mot_de_passe;
    }

    // Relations
    public function classes()
    {
        return $this->belongsToMany(Classe::class, 'etudiant_classe', 'etudiant_id', 'classe_id')
                    ->withPivot('est_delegue');
    }

    public function cours_crees()
    {
        return $this->hasMany(Cours::class, 'cree_par');
    }

    public function cours_valides()
    {
        return $this->hasMany(Cours::class, 'valide_par');
    }

    public function presences()
    {
        return $this->hasMany(Presence::class, 'etudiant_id');
    }
}