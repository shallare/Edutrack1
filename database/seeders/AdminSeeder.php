<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \DB::table('utilisateurs')->insert([
            'nom' => 'Admin',
            'prenom' => 'Wii-Co',
            'email' => 'admin@wiico.com',
            'mot_de_passe' => \Hash::make('95512435'),
            'role' => 'admin',
            'est_valide' => true,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
