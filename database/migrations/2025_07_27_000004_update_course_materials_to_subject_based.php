<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Changes course_materials from class_subject_id to subject_id
     * This makes materials subject-based rather than class-specific
     */
    public function up(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            // Add subject_id column
            $table->foreignId('subject_id')->nullable()->after('id');
            
            // Add file metadata columns
            $table->string('file_mime_type')->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_mime_type');
            
            // Add uploaded_by to track who uploaded
            $table->foreignId('uploaded_by')->nullable()->after('file_size');
        });

        // Migrate existing data: get subject_id from class_subjects
        DB::statement('
            UPDATE course_materials 
            SET subject_id = (
                SELECT subject_id FROM class_subjects 
                WHERE class_subjects.id = course_materials.class_subject_id
            )
            WHERE class_subject_id IS NOT NULL
        ');

        Schema::table('course_materials', function (Blueprint $table) {
            // Make subject_id required after data migration
            $table->foreignId('subject_id')->nullable(false)->change();
            
            // Add foreign key constraint
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('set null');
            
            // Drop the old class_subject_id column
            $table->dropForeign(['class_subject_id']);
            $table->dropColumn('class_subject_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            // Re-add class_subject_id
            $table->foreignId('class_subject_id')->nullable()->after('id');
        });

        Schema::table('course_materials', function (Blueprint $table) {
            // Drop new columns
            $table->dropForeign(['subject_id']);
            $table->dropForeign(['uploaded_by']);
            $table->dropColumn(['subject_id', 'file_mime_type', 'file_size', 'uploaded_by']);
        });
    }
};

