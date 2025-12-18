<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This creates a curriculum structure linking Courses, Year Levels, and Subjects
     * For example: BSIT 1st Year -> [Math, English, Programming, etc.]
     */
    public function up(): void
    {
        Schema::create('course_year_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('year_level'); // 1, 2, 3, 4, 5
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->enum('semester', ['1st', '2nd', 'summer'])->default('1st');
            $table->boolean('is_required')->default(true); // Required vs Elective
            $table->unsignedTinyInteger('units')->default(3);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Unique constraint: One subject per course-year-semester combination
            $table->unique(['course_id', 'year_level', 'subject_id', 'semester'], 'course_year_subject_semester_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_year_subjects');
    }
};

