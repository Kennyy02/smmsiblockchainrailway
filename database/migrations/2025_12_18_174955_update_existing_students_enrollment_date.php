<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Update existing students who are enrolled in classes but don't have
     * an enrollment_date set. This sets their enrollment_date to match
     * the earliest enrollment date from their enrollments, or current date
     * if no enrollment records exist.
     */
    public function up(): void
    {
        // Get all students who have a current_class_id but no enrollment_date
        $students = DB::table('students')
            ->whereNotNull('current_class_id')
            ->whereNull('enrollment_date')
            ->get();

        foreach ($students as $student) {
            // Try to get the earliest enrollment date from their enrollments
            $earliestEnrollment = DB::table('enrollments')
                ->where('student_id', $student->id)
                ->whereNotNull('enrollment_date')
                ->orderBy('enrollment_date', 'asc')
                ->first();

            // Use the earliest enrollment date or current date
            $enrollmentDate = $earliestEnrollment 
                ? $earliestEnrollment->enrollment_date 
                : now();

            DB::table('students')
                ->where('id', $student->id)
                ->update(['enrollment_date' => $enrollmentDate]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't reverse this as it's a data fix
        // If needed, enrollment_date can be manually reset
    }
};
