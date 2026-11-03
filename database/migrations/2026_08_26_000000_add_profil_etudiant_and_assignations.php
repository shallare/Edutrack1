<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Profil académique de l'étudiant (page Paramètres)
        Schema::table('utilisateurs', function (Blueprint $table) {
            if (!Schema::hasColumn('utilisateurs', 'universite')) {
                $table->string('universite')->nullable()->after('telephone');
            }
            if (!Schema::hasColumn('utilisateurs', 'filiere')) {
                $table->string('filiere')->nullable()->after('universite');
            }
            if (!Schema::hasColumn('utilisateurs', 'classe_nom')) {
                $table->string('classe_nom')->nullable()->after('filiere');
            }
            if (!Schema::hasColumn('utilisateurs', 'visualisation_parentale')) {
                $table->boolean('visualisation_parentale')->default(false)->after('classe_nom');
            }
        });

        // Assignations enseignant ↔ matière ↔ classe
        if (!Schema::hasTable('assignations')) {
            Schema::create('assignations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('enseignant_id')->constrained('utilisateurs')->cascadeOnDelete();
                $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
                $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['enseignant_id', 'matiere_id', 'classe_id'], 'assignation_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignations');
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['universite', 'filiere', 'classe_nom', 'visualisation_parentale']);
        });
    }
};
