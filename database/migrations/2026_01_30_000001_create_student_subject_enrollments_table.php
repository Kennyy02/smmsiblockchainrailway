<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Student-level subject enrollment (subjects per student, not per class).
     * Curriculum (course_year_subjects) defines required vs optional; class_subject is optional section link.
     */
    public function up(): void
    {
        Schema::create('student_subject_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_year_subject_id')->constrained('course_year_subjects')->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('semester_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_subject_id')->nullable()->constrained('class_subjects')->onDelete('set null');
            $table->enum('status', ['enrolled', 'passed', 'failed', 'dropped', 'incomplete'])->default('enrolled');
            $table->boolean('is_retake')->default(false);
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // One enrollment per student per curriculum subject per term (retake = same curriculum, different term)
            $table->unique(
                ['student_id', 'course_year_subject_id', 'academic_year_id', 'semester_id'],
                'student_subject_enrollment_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_subject_enrollments');
    }
};
