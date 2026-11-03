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
        Schema::table('mes_cours_personnels', function (Blueprint $table) {
            if (!Schema::hasColumn('mes_cours_personnels', 'horaires')) {
                // [{jour: "lundi", debut: "14:00", fin: "19:00"}, ...]
                $table->longText('horaires')->nullable()->after('nom_professeur');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mes_cours_personnels', function (Blueprint $table) {
            $table->dropColumn('horaires');
        });
    }
};
