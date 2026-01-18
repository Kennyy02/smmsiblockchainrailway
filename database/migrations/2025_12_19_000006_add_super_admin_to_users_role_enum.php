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
        // For MySQL/MariaDB: Modify enum to include 'super_admin'
        // We need to use raw SQL as Laravel doesn't support modifying enums directly
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'teacher', 'student', 'parent') DEFAULT 'student'");
        } elseif (DB::getDriverName() === 'pgsql') {
            // For PostgreSQL: Add the new value to the enum type
            // Note: PostgreSQL requires a transaction and cannot add enum values in a transaction block
            // This is a limitation - we may need to handle this differently
            DB::statement("ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'super_admin'");
        } else {
            // For SQLite or other databases, modify the column
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('student')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // For MySQL/MariaDB: Remove 'super_admin' from enum
        if (DB::getDriverName() === 'mysql') {
            // First, update any users with 'super_admin' role to 'admin'
            DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
            
            // Then modify the enum back
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'teacher', 'student', 'parent') DEFAULT 'student'");
        } elseif (DB::getDriverName() === 'pgsql') {
            // PostgreSQL doesn't support removing enum values easily
            // We'll just update users instead
            DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
        } else {
            // For SQLite, no change needed
        }
    }
};

