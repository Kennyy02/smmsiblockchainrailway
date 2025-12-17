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
        // Add address to teachers table if it doesn't exist
        if (!Schema::hasColumn('teachers', 'address')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->string('address', 500)->nullable()->after('phone');
            });
        }

        // Add address to parents table if it doesn't exist
        if (!Schema::hasColumn('parents', 'address')) {
            Schema::table('parents', function (Blueprint $table) {
                $table->string('address', 500)->nullable()->after('phone');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('teachers', 'address')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->dropColumn('address');
            });
        }

        if (Schema::hasColumn('parents', 'address')) {
            Schema::table('parents', function (Blueprint $table) {
                $table->dropColumn('address');
            });
        }
    }
};


