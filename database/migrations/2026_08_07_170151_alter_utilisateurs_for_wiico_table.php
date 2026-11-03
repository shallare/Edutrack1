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
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn('nom_complet');
            $table->string('nom')->after('id');
            $table->string('prenom')->after('nom');
            $table->string('verification_code')->nullable()->after('telephone');
            $table->timestamp('email_verified_at')->nullable()->after('verification_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['nom', 'prenom', 'verification_code', 'email_verified_at']);
            $table->string('nom_complet')->after('id');
        });
    }
};
