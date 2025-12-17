<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Classes;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\ClassSubject;

class CreateClassSubjectsSeeder extends Seeder
{
    public function run(): void
    {
        $class = Classes::first();
        $subjects = Subject::all();
        $teacher = Teacher::first();
        $academicYear = AcademicYear::where('is_current', true)->first();
        $semester = Semester::where('is_current', true)->first();

        if (!$class || !$teacher || !$academicYear || !$semester) {
            $this->command->error('Missing required data: Class, Teacher, Academic Year, or Semester');
            return;
        }

        $created = 0;
        foreach ($subjects as $subject) {
            $classSubject = ClassSubject::firstOrCreate([
                'class_id' => $class->id,
                'subject_id' => $subject->id,
                'academic_year_id' => $academicYear->id,
                'semester_id' => $semester->id,
            ], [
                'teacher_id' => $teacher->id,
            ]);
            
            if ($classSubject->wasRecentlyCreated) {
                $created++;
            }
        }

        $this->command->info("Created {$created} class subjects. Total: " . ClassSubject::count());
    }
}


