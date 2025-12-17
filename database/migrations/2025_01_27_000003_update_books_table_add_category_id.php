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
        Schema::table('books', function (Blueprint $table) {
            // Add category_id column
            $table->foreignId('category_id')->nullable()->after('description')->constrained()->onDelete('set null');
        });

        // Migrate existing enum values to categories if they don't exist
        $defaultCategories = [
            ['name' => 'Fiction', 'slug' => 'fiction', 'color' => '#8b5cf6'],
            ['name' => 'Non-Fiction', 'slug' => 'non-fiction', 'color' => '#3b82f6'],
            ['name' => 'Textbook', 'slug' => 'textbook', 'color' => '#f59e0b'],
            ['name' => 'Reference', 'slug' => 'reference', 'color' => '#10b981'],
            ['name' => 'Other', 'slug' => 'other', 'color' => '#6b7280'],
        ];

        foreach ($defaultCategories as $category) {
            DB::table('categories')->insertOrIgnore([
                'name' => $category['name'],
                'slug' => $category['slug'],
                'color' => $category['color'],
                'is_active' => true,
                'sort_order' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Migrate existing books to use category_id
        $categories = DB::table('categories')->pluck('id', 'name')->toArray();
        
        foreach ($categories as $name => $id) {
            DB::table('books')
                ->where('category', $name)
                ->update(['category_id' => $id]);
        }

        // Drop the old enum column after migration
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            // Add back the category enum column
            $table->enum('category', ['Fiction', 'Non-Fiction', 'Textbook', 'Reference', 'Other'])->default('Other')->after('description');
        });

        // Migrate category_id back to category enum
        $categories = DB::table('categories')->pluck('name', 'id')->toArray();
        
        foreach ($categories as $id => $name) {
            DB::table('books')
                ->where('category_id', $id)
                ->update(['category' => $name]);
        }

        Schema::table('books', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};

