<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates 100 students with realistic Filipino names
     */
    public function run(): void
    {
        $firstNames = [
            'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Antonio', 'Carmen', 'Francisco', 'Teresa',
            'Miguel', 'Elena', 'Carlos', 'Sofia', 'Luis', 'Isabella', 'Manuel', 'Gabriela', 'Rafael', 'Victoria',
            'Gabriel', 'Andrea', 'Daniel', 'Patricia', 'Fernando', 'Lucia', 'Ricardo', 'Beatriz', 'Eduardo', 'Claudia',
            'Roberto', 'Monica', 'Alejandro', 'Diana', 'Jorge', 'Margarita', 'Andres', 'Angela', 'Ramon', 'Cristina',
            'Ernesto', 'Stephanie', 'Marco', 'Michelle', 'Paolo', 'Nicole', 'Christian', 'Jasmine', 'Kevin', 'Ashley',
            'Bryan', 'Samantha', 'Mark', 'Angelica', 'John', 'Princess', 'James', 'Kim', 'Ryan', 'Joy',
            'Joshua', 'Grace', 'Kenneth', 'Faith', 'Jerome', 'Hope', 'Vincent', 'Mary', 'Lloyd', 'Rose',
            'Renzo', 'Kathleen', 'Carl', 'Bianca', 'Angelo', 'Denise', 'Jayson', 'Alyssa', 'Jomar', 'Czarina',
            'Arjay', 'Joanna', 'Aldrin', 'Kimberly', 'Darwin', 'Trisha', 'Elmer', 'Lovely', 'Gerald', 'April',
            'Harold', 'Mae', 'Ivan', 'Rina', 'Jaypee', 'Sheila', 'Kristoffer', 'Tanya', 'Lester', 'Vanessa'
        ];

        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Villanueva', 'Gonzales', 'Ramos',
            'Aquino', 'Castro', 'Rivera', 'Fernandez', 'Lopez', 'Martinez', 'Hernandez', 'Perez', 'Rodriguez', 'Dela Cruz',
            'Soriano', 'Aguilar', 'Mercado', 'Castillo', 'Dizon', 'Manalo', 'Navarro', 'Valdez', 'Domingo', 'Corpuz',
            'Pascual', 'Flores', 'Morales', 'Jimenez', 'Rosales', 'De Leon', 'Salazar', 'Gutierrez', 'Miranda', 'Lim',
            'Tan', 'Chua', 'Sy', 'Ong', 'Go', 'Co', 'Ng', 'Yu', 'Lee', 'Wong'
        ];

        $middleNames = [
            'Andrade', 'Buenaventura', 'Concepcion', 'Dalisay', 'Esperanza', 'Felicidad', 'Generoso', 'Hermoso', 'Inocencio', 'Javillonar',
            'Kalayaan', 'Laguna', 'Magsaysay', 'Natividad', 'Ocampo', 'Palma', 'Quezon', 'Rizal', 'Santiago', 'Tuazon',
            null, null, null, null, null // Some students without middle names
        ];

        // Get current academic year and semester
        $academicYear = DB::table('academic_years')->where('is_current', true)->first();
        $semester = DB::table('semesters')->where('is_current', true)->first();
        
        // Get courses
        $courses = DB::table('courses')->where('is_active', true)->get();
        
        // Get classes
        $classes = DB::table('classes')->get();

        $currentYear = Carbon::now()->year;
        $studentsCreated = 0;

        for ($i = 1; $i <= 100; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $middleName = $middleNames[array_rand($middleNames)];
            $gender = rand(0, 1) ? 'Male' : 'Female';
            
            // Adjust first name based on gender
            if ($gender === 'Female' && in_array($firstName, ['Juan', 'Jose', 'Pedro', 'Antonio', 'Francisco', 'Miguel', 'Carlos', 'Luis', 'Manuel', 'Rafael', 'Gabriel', 'Daniel', 'Fernando', 'Ricardo', 'Eduardo', 'Roberto', 'Alejandro', 'Jorge', 'Andres', 'Ramon', 'Ernesto', 'Marco', 'Paolo', 'Christian', 'Kevin', 'Bryan', 'Mark', 'John', 'James', 'Ryan', 'Joshua', 'Kenneth', 'Jerome', 'Vincent', 'Lloyd', 'Renzo', 'Carl', 'Angelo', 'Jayson', 'Jomar', 'Arjay', 'Aldrin', 'Darwin', 'Elmer', 'Gerald', 'Harold', 'Ivan', 'Jaypee', 'Kristoffer', 'Lester'])) {
                $firstName = $firstNames[array_rand(array_filter($firstNames, fn($n) => in_array($n, ['Maria', 'Ana', 'Rosa', 'Carmen', 'Teresa', 'Elena', 'Sofia', 'Isabella', 'Gabriela', 'Victoria', 'Andrea', 'Patricia', 'Lucia', 'Beatriz', 'Claudia', 'Monica', 'Diana', 'Margarita', 'Angela', 'Cristina', 'Stephanie', 'Michelle', 'Nicole', 'Jasmine', 'Ashley', 'Samantha', 'Angelica', 'Princess', 'Kim', 'Joy', 'Grace', 'Faith', 'Hope', 'Mary', 'Rose', 'Kathleen', 'Bianca', 'Denise', 'Alyssa', 'Czarina', 'Joanna', 'Kimberly', 'Trisha', 'Lovely', 'April', 'Mae', 'Rina', 'Sheila', 'Tanya', 'Vanessa'])))];
            }

            $yearLevel = rand(1, 4);
            $course = $courses->isNotEmpty() ? $courses->random() : null;
            $class = $classes->isNotEmpty() ? $classes->random() : null;
            
            // Generate student ID: STU-YEAR-XXXX
            $studentIdNum = str_pad($i, 4, '0', STR_PAD_LEFT);
            $studentId = "STU-{$currentYear}-{$studentIdNum}";
            
            // Generate email
            $emailName = strtolower($firstName) . '.' . strtolower(str_replace(' ', '', $lastName)) . $i;
            $email = "{$emailName}@smms.edu.ph";
            
            // Generate birthdate (18-25 years old)
            $age = rand(18, 25);
            $birthDate = Carbon::now()->subYears($age)->subDays(rand(0, 365));

            // Create user first
            $userId = DB::table('users')->insertGetId([
                'name' => trim("{$firstName} {$lastName}"),
                'email' => $email,
                'password' => Hash::make('student123'),
                'role' => 'student',
                'status' => 'active',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create student
            $studentDbId = DB::table('students')->insertGetId([
                'user_id' => $userId,
                'student_id' => $studentId,
                'first_name' => $firstName,
                'middle_name' => $middleName,
                'last_name' => $lastName,
                'email' => $email,
                'phone' => '09' . rand(100000000, 999999999),
                'date_of_birth' => $birthDate,
                'gender' => $gender,
                'program' => $course ? $course->course_code : 'BSMT',
                'course_id' => $course ? $course->id : null,
                'year_level' => $yearLevel,
                'current_class_id' => $class ? $class->id : null,
                'status' => 'active',
                'enrollment_date' => Carbon::now()->subMonths(rand(1, 12)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create enrollment if class exists
            if ($class && $academicYear && $semester) {
                DB::table('enrollments')->insertOrIgnore([
                    'student_id' => $studentDbId,
                    'class_id' => $class->id,
                    'academic_year_id' => $academicYear->id,
                    'semester_id' => $semester->id,
                    'course_id' => $course ? $course->id : null,
                    'enrollment_date' => now(),
                    'status' => 'enrolled',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $studentsCreated++;
        }

        $this->command->info("✅ Successfully created {$studentsCreated} students!");
    }
}

