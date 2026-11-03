<?php

namespace Database\Seeders;

use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Crée ou met à jour l'admin avec un mot de passe correctement hashé
        Utilisateur::updateOrCreate(
            ['email' => 'admin@edutrack.com'],
            [
                'nom_complet'  => 'Administrateur',
                'mot_de_passe' => Hash::make('12345678'),
                'role'         => 'admin',
                'est_valide'   => true,
            ]
        );
    }
}
