<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom_complet');
            $table->string('email')->unique();
            $table->string('mot_de_passe');
            $table->enum('role', ['admin', 'enseignant', 'etudiant', 'delegue'])->default('etudiant');
            $table->string('matricule')->nullable()->unique();
            $table->text('code_qr')->nullable();
            $table->boolean('est_valide')->default(false);
            $table->string('telephone')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique();
            $table->string('annee_academique')->nullable();
            $table->timestamps();
        });

        Schema::create('matieres', function (Blueprint $table) {
            $table->id();
            $table->string('nom')->unique();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->integer('total_chapitres')->nullable();
            $table->timestamps();
        });

        Schema::create('etudiant_classe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etudiant_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('classe_id')->constrained('classes')->onDelete('cascade');
            $table->boolean('est_delegue')->default(false);
            $table->timestamps();
            $table->unique(['etudiant_id', 'classe_id']);
        });

        Schema::create('enseignant_matiere_classe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enseignant_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('matiere_id')->constrained('matieres')->onDelete('cascade');
            $table->foreignId('classe_id')->constrained('classes')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['enseignant_id', 'matiere_id', 'classe_id'], 'emc_unique');
        });

        Schema::create('cours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matiere_id')->constrained('matieres')->onDelete('cascade');
            $table->foreignId('classe_id')->constrained('classes')->onDelete('cascade');
            $table->date('date');
            $table->time('heure_debut')->nullable();
            $table->time('heure_fin')->nullable();
            $table->string('titre_chapitre');
            $table->integer('numero_chapitre')->nullable();
            $table->text('resume')->nullable();
            $table->enum('statut', ['brouillon', 'soumis', 'valide', 'corrige'])->default('soumis');
            $table->foreignId('cree_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->foreignId('valide_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->text('signature_prof')->nullable();
            $table->timestamp('date_validation')->nullable();
            $table->timestamps();
        });

        Schema::create('presences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cours_id')->constrained('cours')->onDelete('cascade');
            $table->foreignId('etudiant_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->enum('statut', ['present', 'absent'])->default('absent');
            $table->timestamp('heure_scan')->nullable();
            $table->foreignId('scanne_par')->nullable()->constrained('utilisateurs')->nullOnDelete();
            $table->boolean('est_valide')->default(false);
            $table->timestamps();
        });

        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cours_id')->constrained('cours')->onDelete('cascade');
            $table->foreignId('etudiant_id')->constrained('utilisateurs')->onDelete('cascade');
            $table->unsignedTinyInteger('note_clarte');
            $table->unsignedTinyInteger('note_contenu');
            $table->unsignedTinyInteger('note_supports');
            $table->text('commentaire')->nullable();
            $table->boolean('est_anonyme')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('presences');
        Schema::dropIfExists('cours');
        Schema::dropIfExists('enseignant_matiere_classe');
        Schema::dropIfExists('etudiant_classe');
        Schema::dropIfExists('matieres');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('utilisateurs');
    }
};
