<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class UpdateStudentGradeLevels extends Seeder
{
    /**
     * Update students to have proper grade levels based on their course.
     * 
     * New Grade Level System:
     * - Elementary: Grade 1-6 (year_level 1-6)
     * - Junior High: Grade 7-10 (year_level 7-10)
     * - Senior High: Grade 11-12 (year_level 11-12)
     * - College: 1st-4th Year (year_level 13-16)
     */
    public function run(): void
    {
        // Update College students (BSIT, BSMarE, BSMT)
        // Old year_level 1 -> 13 (1st Year), 2 -> 14 (2nd Year), 3 -> 15 (3rd Year), 4 -> 16 (4th Year)
        $collegePrograms = ['BSIT', 'BSMarE', 'BSMT'];
        
        foreach ($collegePrograms as $program) {
            Student::where('program', $program)->where('year_level', 1)->update(['year_level' => 13]);
            Student::where('program', $program)->where('year_level', 2)->update(['year_level' => 14]);
            Student::where('program', $program)->where('year_level', 3)->update(['year_level' => 15]);
            Student::where('program', $program)->where('year_level', 4)->update(['year_level' => 16]);
        }
        
        // Update Senior High students (SHS-ABM, SHS-STEM)
        // Old year_level 1,2 -> 11 (Grade 11), 3,4 -> 12 (Grade 12)
        $shsPrograms = ['SHS-ABM', 'SHS-STEM'];
        
        foreach ($shsPrograms as $program) {
            Student::where('program', $program)->whereIn('year_level', [1, 2])->update(['year_level' => 11]);
            Student::where('program', $program)->whereIn('year_level', [3, 4])->update(['year_level' => 12]);
        }
        
        $this->command->info('Student grade levels updated successfully!');
        
        // Show the new distribution
        $distribution = Student::selectRaw('program, year_level, count(*) as count')
            ->groupBy('program', 'year_level')
            ->orderBy('program')
            ->orderBy('year_level')
            ->get();
            
        $this->command->table(
            ['Program', 'Year Level', 'Count'],
            $distribution->map(fn($row) => [$row->program, $row->year_level, $row->count])->toArray()
        );
    }
}


