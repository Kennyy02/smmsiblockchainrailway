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
     * This migration implements the complete ER diagram structure:
     * - Adds Courses table (academic programs like BSMT, BSMarE, BSIT)
     * - Adds Course-Subject relationship (which subjects belong to which programs)
     * - Adds Enrollments table (resolves Student-Class many-to-many)
     * - Updates existing tables to reference courses
     */
    public function up(): void
    {
        // ==========================================
        // 1. COURSES TABLE (Academic Programs)
        // ==========================================
        // Represents academic programs like BSMT, BSMarE, BSIT, Grade 10, etc.
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('course_code', 20)->unique(); // "BSMT", "BSMarE", "BSIT"
            $table->string('course_name'); // "Bachelor of Science in Marine Transportation"
            $table->text('description')->nullable();
            $table->enum('level', ['College', 'Senior High', 'Junior High', 'Elementary'])->default('College');
            $table->integer('duration_years')->default(4); // 4 years for college, 2 for SHS
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ==========================================
        // 2. COURSE-SUBJECT RELATIONSHIP (Many-to-Many)
        // ==========================================
        // Links subjects to courses (a subject can be used in multiple programs)
        Schema::create('course_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->integer('year_level')->default(1); // Which year this subject is offered
            $table->enum('semester', ['1st Semester', '2nd Semester', 'Summer', 'Both'])->default('1st Semester');
            $table->boolean('is_required')->default(true); // Required vs elective
            $table->timestamps();
            
            // Prevent duplicate course-subject combinations for same year/semester
            $table->unique(['course_id', 'subject_id', 'year_level', 'semester'], 'course_subject_year_sem_unique');
        });

        // ==========================================
        // 3. ENROLLMENTS TABLE (Associative Entity)
        // ==========================================
        // Resolves the many-to-many relationship between Students and Classes
        // Records which student is enrolled in which class during a specific semester
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('semester_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->nullable()->constrained()->onDelete('set null');
            $table->date('enrollment_date')->nullable();
            $table->enum('status', ['enrolled', 'dropped', 'completed', 'withdrawn'])->default('enrolled');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Prevent duplicate enrollments (same student in same class for same semester)
            $table->unique(['student_id', 'class_id', 'academic_year_id', 'semester_id'], 'enrollment_unique');
        });

        // ==========================================
        // 4. UPDATE CLASSES TABLE - Add course_id reference
        // ==========================================
        Schema::table('classes', function (Blueprint $table) {
            // Add course_id foreign key
            $table->foreignId('course_id')->nullable()->after('program')->constrained()->onDelete('set null');
        });

        // ==========================================
        // 5. UPDATE STUDENTS TABLE - Add course_id reference
        // ==========================================
        Schema::table('students', function (Blueprint $table) {
            // Add course_id foreign key (student's enrolled program)
            $table->foreignId('course_id')->nullable()->after('program')->constrained()->onDelete('set null');
            // Add enrollment_date for tracking when student enrolled
            $table->date('enrollment_date')->nullable()->after('year_level');
            // Add status field
            $table->enum('status', ['active', 'inactive', 'graduated', 'dropped'])->default('active')->after('enrollment_date');
            // Add address field
            $table->text('address')->nullable()->after('gender');
        });

        // ==========================================
        // 6. INSERT DEFAULT COURSES (Maritime Programs)
        // ==========================================
        $this->insertDefaultCourses();
    }

    /**
     * Insert default maritime courses
     */
    private function insertDefaultCourses(): void
    {
        $courses = [
            [
                'course_code' => 'BSMT',
                'course_name' => 'Bachelor of Science in Marine Transportation',
                'description' => 'A four-year degree program that prepares students for careers as ship officers and maritime professionals.',
                'level' => 'College',
                'duration_years' => 4,
                'is_active' => true,
            ],
            [
                'course_code' => 'BSMarE',
                'course_name' => 'Bachelor of Science in Marine Engineering',
                'description' => 'A four-year degree program that prepares students for careers as marine engineers.',
                'level' => 'College',
                'duration_years' => 4,
                'is_active' => true,
            ],
            [
                'course_code' => 'BSIT',
                'course_name' => 'Bachelor of Science in Information Technology',
                'description' => 'A four-year degree program focused on computing and information technology.',
                'level' => 'College',
                'duration_years' => 4,
                'is_active' => true,
            ],
            [
                'course_code' => 'SHS-STEM',
                'course_name' => 'Senior High School - STEM Strand',
                'description' => 'Science, Technology, Engineering and Mathematics strand for senior high school.',
                'level' => 'Senior High',
                'duration_years' => 2,
                'is_active' => true,
            ],
            [
                'course_code' => 'SHS-ABM',
                'course_name' => 'Senior High School - ABM Strand',
                'description' => 'Accountancy, Business and Management strand for senior high school.',
                'level' => 'Senior High',
                'duration_years' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($courses as $course) {
            DB::table('courses')->insert(array_merge($course, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Link existing students and classes to BSMT course (default maritime program)
        $bsmtCourse = DB::table('courses')->where('course_code', 'BSMT')->first();
        
        if ($bsmtCourse) {
            // Update existing students with program = 'BSMT'
            DB::table('students')
                ->where('program', 'BSMT')
                ->update(['course_id' => $bsmtCourse->id]);
            
            // Update existing classes with program = 'BSMT'
            DB::table('classes')
                ->where('program', 'BSMT')
                ->update(['course_id' => $bsmtCourse->id]);

            // Create enrollments for existing students in their current class
            $students = DB::table('students')
                ->whereNotNull('current_class_id')
                ->get();

            foreach ($students as $student) {
                $class = DB::table('classes')->find($student->current_class_id);
                
                if ($class) {
                    DB::table('enrollments')->insertOrIgnore([
                        'student_id' => $student->id,
                        'class_id' => $class->id,
                        'academic_year_id' => $class->academic_year_id,
                        'semester_id' => $class->semester_id,
                        'course_id' => $student->course_id,
                        'enrollment_date' => now(),
                        'status' => 'enrolled',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove foreign keys from classes and students
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn(['course_id', 'enrollment_date', 'status', 'address']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });

        // Drop new tables
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('course_subjects');
        Schema::dropIfExists('courses');
    }
};

