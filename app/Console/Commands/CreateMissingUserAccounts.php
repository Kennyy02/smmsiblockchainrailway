<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\ParentModel;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CreateMissingUserAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:create-missing {--type=all : Type of users to create (students, teachers, parents, or all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create missing User accounts for Students, Teachers, and Parents who don\'t have login credentials';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->option('type');
        
        $this->info('Creating missing user accounts...');
        $this->info('Default password for all accounts: password123');
        $this->info('Users should change their password on first login.');
        $this->newLine();
        
        $created = 0;
        
        DB::beginTransaction();
        
        try {
            // Create accounts for students
            if ($type === 'all' || $type === 'students') {
                $created += $this->createStudentAccounts();
            }
            
            // Create accounts for teachers
            if ($type === 'all' || $type === 'teachers') {
                $created += $this->createTeacherAccounts();
            }
            
            // Create accounts for parents
            if ($type === 'all' || $type === 'parents') {
                $created += $this->createParentAccounts();
            }
            
            DB::commit();
            
            $this->newLine();
            $this->info("✅ Successfully created {$created} user account(s)!");
            
            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error: ' . $e->getMessage());
            return 1;
        }
    }
    
    private function createStudentAccounts(): int
    {
        $students = Student::whereNull('user_id')->get();
        $created = 0;
        
        if ($students->isEmpty()) {
            $this->info('✓ All students already have user accounts');
            return 0;
        }
        
        $this->info("Found {$students->count()} student(s) without user accounts");
        
        foreach ($students as $student) {
            try {
                // Check if user with this email already exists
                $existingUser = User::where('email', $student->email)->first();
                
                if ($existingUser) {
                    // Link existing user to student
                    $student->update(['user_id' => $existingUser->id]);
                    $this->line("  → Linked {$student->full_name} to existing user account");
                } else {
                    // Create new user account
                    $user = User::create([
                        'name' => trim($student->first_name . ' ' . $student->last_name),
                        'email' => $student->email,
                        'password' => Hash::make('password123'),
                        'role' => 'student',
                        'status' => 'active',
                    ]);
                    
                    $student->update(['user_id' => $user->id]);
                    $this->line("  ✓ Created account for {$student->full_name} ({$student->email})");
                    $created++;
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to create account for {$student->full_name}: {$e->getMessage()}");
            }
        }
        
        return $created;
    }
    
    private function createTeacherAccounts(): int
    {
        $teachers = Teacher::whereNull('user_id')->get();
        $created = 0;
        
        if ($teachers->isEmpty()) {
            $this->info('✓ All teachers already have user accounts');
            return 0;
        }
        
        $this->info("Found {$teachers->count()} teacher(s) without user accounts");
        
        foreach ($teachers as $teacher) {
            try {
                // Check if user with this email already exists
                $existingUser = User::where('email', $teacher->email)->first();
                
                if ($existingUser) {
                    // Link existing user to teacher
                    $teacher->update(['user_id' => $existingUser->id]);
                    $this->line("  → Linked {$teacher->full_name} to existing user account");
                } else {
                    // Create new user account
                    $user = User::create([
                        'name' => trim($teacher->first_name . ' ' . $teacher->last_name),
                        'email' => $teacher->email,
                        'password' => Hash::make('password123'),
                        'role' => 'teacher',
                        'status' => 'active',
                    ]);
                    
                    $teacher->update(['user_id' => $user->id]);
                    $this->line("  ✓ Created account for {$teacher->full_name} ({$teacher->email})");
                    $created++;
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to create account for {$teacher->full_name}: {$e->getMessage()}");
            }
        }
        
        return $created;
    }
    
    private function createParentAccounts(): int
    {
        $parents = ParentModel::whereNull('user_id')->get();
        $created = 0;
        
        if ($parents->isEmpty()) {
            $this->info('✓ All parents already have user accounts');
            return 0;
        }
        
        $this->info("Found {$parents->count()} parent(s) without user accounts");
        
        foreach ($parents as $parent) {
            try {
                // Check if user with this email already exists
                $existingUser = User::where('email', $parent->email)->first();
                
                if ($existingUser) {
                    // Link existing user to parent
                    $parent->update(['user_id' => $existingUser->id]);
                    $this->line("  → Linked {$parent->full_name} to existing user account");
                } else {
                    // Create new user account
                    $user = User::create([
                        'name' => trim($parent->first_name . ' ' . $parent->last_name),
                        'email' => $parent->email,
                        'password' => Hash::make('password123'),
                        'role' => 'parent',
                        'status' => 'active',
                    ]);
                    
                    $parent->update(['user_id' => $user->id]);
                    $this->line("  ✓ Created account for {$parent->full_name} ({$parent->email})");
                    $created++;
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Failed to create account for {$parent->full_name}: {$e->getMessage()}");
            }
        }
        
        return $created;
    }
}

