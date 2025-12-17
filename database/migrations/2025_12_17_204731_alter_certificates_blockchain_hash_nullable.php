<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Make blockchain_hash nullable using raw SQL to avoid constraint issues
        DB::statement('ALTER TABLE certificates MODIFY blockchain_hash VARCHAR(255) NULL');
        DB::statement('ALTER TABLE certificates MODIFY blockchain_timestamp TIMESTAMP NULL');
        
        // Ensure unique constraint exists (it should already exist)
        // Only add if it doesn't exist
        $indexes = DB::select("SHOW INDEXES FROM certificates WHERE Key_name = 'certificates_blockchain_hash_unique'");
        if (empty($indexes)) {
            Schema::table('certificates', function (Blueprint $table) {
                $table->unique('blockchain_hash');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: We can't easily reverse this without losing data
        // If blockchain_hash has null values, we can't make it non-nullable
        Schema::table('certificates', function (Blueprint $table) {
            // Only change if there are no null values
            DB::statement('ALTER TABLE certificates MODIFY blockchain_hash VARCHAR(255) NOT NULL UNIQUE');
            DB::statement('ALTER TABLE certificates MODIFY blockchain_timestamp TIMESTAMP NOT NULL');
        });
    }
};
