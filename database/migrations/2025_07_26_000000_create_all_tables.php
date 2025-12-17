<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{

    public function up(): void
    {
        // ==========================================
        // 1. USERS - All system users
        // ==========================================
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamp('email_verified_at')->nullable();
            $table->enum('role', ['admin', 'teacher', 'student', 'parent'])->default('student');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('avatar')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // ==========================================
        // 2. ACADEMIC STRUCTURE
        // ==========================================
        
        // Academic Years
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('year_name', 20)->unique(); // "2024-2025"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Semesters
        Schema::create('semesters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->enum('semester_name', ['1st Semester', '2nd Semester', 'Summer'])->default('1st Semester');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Subjects
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('subject_code', 20)->unique();
            $table->string('subject_name');
            $table->text('description')->nullable();
            $table->decimal('units', 4, 2)->default(3.0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Classes/Sections
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('class_code', 20)->unique(); // "BSMT-1A"
            $table->string('class_name');
            $table->integer('year_level');
            $table->string('section', 10);
            $table->string('program')->nullable(); // BSMT, BSMarE, etc.
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('semester_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });

        // ==========================================
        // 3. USER PROFILES
        // ==========================================
        
        // Teachers
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('teacher_id', 20)->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('department')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('student_id', 20)->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->date('date_of_birth');
            $table->enum('gender', ['Male', 'Female'])->nullable();
            $table->string('program')->nullable();
            $table->integer('year_level')->default(1);
            $table->foreignId('current_class_id')->nullable()->constrained('classes')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });

        // Parents
        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Parent-Student Relationship
        Schema::create('parent_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['parent_id', 'student_id']);
        });

        // ==========================================
        // 4. CLASS ASSIGNMENTS (Teacher teaches Subject to Class)
        // ==========================================
        Schema::create('class_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('semester_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });

        // ==========================================
        // 5. GRADING SYSTEM
        // ==========================================
        
        // Assignments
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_subject_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('assignment_type', ['Homework', 'Quiz', 'Exam', 'Project'])->default('Homework');
            $table->integer('total_points')->default(100);
            $table->date('due_date');
            $table->timestamps();
            $table->softDeletes();
        });

        // Student Submissions
        Schema::create('student_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->text('submission_text')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('score', 5, 2)->nullable();
            $table->text('teacher_feedback')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Grades (Final subject grades)
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('semester_id')->constrained()->onDelete('cascade');
            $table->decimal('prelim_grade', 5, 2)->nullable();
            $table->decimal('midterm_grade', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->decimal('final_rating', 5, 2)->nullable();
            $table->enum('remarks', ['Passed', 'Failed', 'Incomplete'])->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Attendance
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_subject_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->date('attendance_date');
            $table->enum('status', ['Present', 'Absent', 'Late', 'Excused'])->default('Present');
            $table->timestamps();
            $table->softDeletes();
        });

        // ==========================================
        // 6. COURSE MATERIALS
        // ==========================================
        Schema::create('course_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_subject_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ==========================================
        // 7. ANNOUNCEMENTS
        // ==========================================
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->enum('target_audience', ['All', 'Teachers', 'Students', 'Parents'])->default('All');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ==========================================
        // 8. BLOCKCHAIN CERTIFICATES
        // ==========================================
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_number', 50)->unique();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('issued_by')->constrained('teachers')->onDelete('cascade');
            $table->enum('certificate_type', ['Completion', 'Achievement', 'Maritime Certificate'])->default('Completion');
            $table->string('title');
            $table->date('date_issued');
            
            // Blockchain Data
            $table->string('blockchain_hash', 255)->nullable()->unique();
            $table->timestamp('blockchain_timestamp')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });

        // Certificate Verifications
        Schema::create('certificate_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('certificate_id')->constrained()->onDelete('cascade');
            $table->string('verified_by_name')->nullable();
            $table->timestamp('verified_at');
            $table->timestamps();
        });

        // Blockchain Transactions
        Schema::create('blockchain_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_hash', 255)->nullable()->unique();
            $table->string('transaction_type');
            $table->foreignId('initiated_by')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'confirmed', 'failed'])->default('pending');
            $table->timestamp('submitted_at');
            $table->timestamps();
        });

        // ==========================================
        // 9. MESSAGES
        // ==========================================
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

   

        // Cache and Sessions
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Insert default data
        $this->insertDefaultData();
    }

    /**
     * Insert default data
     */
    private function insertDefaultData(): void
    {
        // Default Users
        $adminId = DB::table('users')->insertGetId([
            'name' => 'System Administrator',
            'email' => 'admin@smms.edu.ph',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $teacherId = DB::table('users')->insertGetId([
            'name' => 'John Doe',
            'email' => 'teacher@smms.edu.ph',
            'password' => Hash::make('teacher123'),
            'role' => 'teacher',
            'status' => 'active',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $studentId = DB::table('users')->insertGetId([
            'name' => 'Jane Smith',
            'email' => 'student@smms.edu.ph',
            'password' => Hash::make('student123'),
            'role' => 'student',
            'status' => 'active',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $parentId = DB::table('users')->insertGetId([
            'name' => 'Robert Smith',
            'email' => 'parent@smms.edu.ph',
            'password' => Hash::make('parent123'),
            'role' => 'parent',
            'status' => 'active',
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Academic Year
        $academicYearId = DB::table('academic_years')->insertGetId([
            'year_name' => '2024-2025',
            'start_date' => '2024-08-01',
            'end_date' => '2025-05-31',
            'is_current' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Semester
        $semesterId = DB::table('semesters')->insertGetId([
            'academic_year_id' => $academicYearId,
            'semester_name' => '1st Semester',
            'start_date' => '2024-08-01',
            'end_date' => '2024-12-20',
            'is_current' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Subjects
        $subjectIds = [];
        $subjects = [
            ['code' => 'NAV101', 'name' => 'Basic Navigation'],
            ['code' => 'SEAMANSHIP101', 'name' => 'Basic Seamanship'],
            ['code' => 'MATH101', 'name' => 'College Algebra'],
        ];

        foreach ($subjects as $subject) {
            $subjectIds[] = DB::table('subjects')->insertGetId([
                'subject_code' => $subject['code'],
                'subject_name' => $subject['name'],
                'units' => 3.0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Class
        $classId = DB::table('classes')->insertGetId([
            'class_code' => 'BSMT-1A',
            'class_name' => 'BS Marine Transportation - Year 1 Section A',
            'year_level' => 1,
            'section' => 'A',
            'program' => 'BSMT',
            'academic_year_id' => $academicYearId,
            'semester_id' => $semesterId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Teacher
        $defaultTeacherId = DB::table('teachers')->insertGetId([
            'user_id' => $teacherId,
            'teacher_id' => 'TCH-2024-001',
            'first_name' => 'John',
            'middle_name' => 'M',
            'last_name' => 'Doe',
            'email' => 'teacher@smms.edu.ph',
            'department' => 'Maritime Department',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Student
        $defaultStudentId = DB::table('students')->insertGetId([
            'user_id' => $studentId,
            'student_id' => 'STU-2024-001',
            'first_name' => 'Jane',
            'middle_name' => 'A',
            'last_name' => 'Smith',
            'email' => 'student@smms.edu.ph',
            'date_of_birth' => '2005-01-15',
            'gender' => 'Female',
            'program' => 'BSMT',
            'year_level' => 1,
            'current_class_id' => $classId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Parent
        $defaultParentId = DB::table('parents')->insertGetId([
            'user_id' => $parentId,
            'first_name' => 'Robert',
            'middle_name' => 'J',
            'last_name' => 'Smith',
            'email' => 'parent@smms.edu.ph',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Link Parent to Student
        DB::table('parent_student')->insert([
            'parent_id' => $defaultParentId,
            'student_id' => $defaultStudentId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // System Settings
        $settings = [
            ['setting_key' => 'school_name', 'setting_value' => 'Southern Mindoro Maritime School, Inc.'],
            ['setting_key' => 'school_tagline', 'setting_value' => 'Navigating Excellence in Maritime Education'],
            ['setting_key' => 'school_email', 'setting_value' => 'info@smms.edu.ph'],
            ['setting_key' => 'passing_grade', 'setting_value' => '75'],
            ['setting_key' => 'blockchain_enabled', 'setting_value' => 'true'],
        ];

      
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('blockchain_transactions');
        Schema::dropIfExists('certificate_verifications');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('course_materials');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('student_submissions');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('class_subjects');
        Schema::dropIfExists('parent_student');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('students');
        Schema::dropIfExists('teachers');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('semesters');
        Schema::dropIfExists('academic_years');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};