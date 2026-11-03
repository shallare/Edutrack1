<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('expediteur_id')->constrained('utilisateurs')->cascadeOnDelete();
                $table->foreignId('destinataire_id')->constrained('utilisateurs')->cascadeOnDelete();
                $table->text('contenu');
                $table->timestamp('lu_le')->nullable();
                $table->timestamps();
                $table->index(['expediteur_id', 'destinataire_id']);
                $table->index(['destinataire_id', 'lu_le']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
