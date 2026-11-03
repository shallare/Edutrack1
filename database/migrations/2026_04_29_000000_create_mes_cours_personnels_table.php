<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mes_cours_personnels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('etudiant_id')->index();
            $table->string('titre');
            $table->string('description')->nullable();
            $table->longText('contenu')->nullable();
            $table->enum('statut', ['a_venir', 'en_cours', 'termine'])->default('a_venir');
            $table->string('couleur', 20)->default('#ffffff');
            $table->string('icone', 50)->default('book-open');
            $table->integer('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mes_cours_personnels');
    }
};
