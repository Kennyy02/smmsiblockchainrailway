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
        if (!Schema::hasTable('books')) {
            Schema::create('books', function (Blueprint $table) {
                $table->id();
                $table->string('isbn', 20)->nullable()->unique();
                $table->string('title');
                $table->string('author')->nullable();
                $table->string('publisher')->nullable();
                $table->year('publication_year')->nullable();
                $table->text('description')->nullable();
                $table->enum('category', ['Fiction', 'Non-Fiction', 'Textbook', 'Reference', 'Other'])->default('Other');
                $table->integer('total_copies')->default(1);
                $table->integer('available_copies')->default(1);
                $table->string('location')->nullable(); // Shelf location
                $table->enum('status', ['available', 'borrowed', 'maintenance', 'lost'])->default('available');
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};

