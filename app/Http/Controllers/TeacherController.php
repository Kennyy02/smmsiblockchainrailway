<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class TeacherController extends Controller
{
    /**
     * Display a listing of teachers
     * GET /api/teachers
     */
    public function index(Request $request)
    {
        try {
            $query = Teacher::query();

            // Search filter
            if ($request->filled('search')) {
                $query->search($request->search);
            }

            // Department filter
            if ($request->filled('department')) {
                $query->byDepartment($request->department);
            }

            // Get pagination parameters
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);

            // Execute query with pagination - Load advisory class relationship
            $teachers = $query->with('advisoryClass')
                             ->orderBy('created_at', 'desc')
                             ->paginate($perPage, ['*'], 'page', $page);

            // Transform teachers to include full_name and advisory_class_name
            $teachers->getCollection()->transform(function ($teacher) {
                $teacher->full_name = trim($teacher->first_name . ' ' . $teacher->last_name);
                
                // Add advisory class name if exists
                if ($teacher->advisoryClass) {
                    $teacher->advisory_class_name = $teacher->advisoryClass->class_name ?? $teacher->advisoryClass->class_code ?? null;
                } else {
                    $teacher->advisory_class_name = null;
                }
                
                return $teacher;
            });

            // Return JSON response
            return response()->json([
                'success' => true,
                'data' => $teachers->items(),
                'pagination' => [
                    'current_page' => $teachers->currentPage(),
                    'last_page' => $teachers->lastPage(),
                    'per_page' => $teachers->perPage(),
                    'total' => $teachers->total(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error loading teachers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading teachers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created teacher
     * POST /api/teachers
     */
    public function store(Request $request)
    {
        // Check if user or teacher already exists with this email
        $existingUser = User::where('email', $request->email)->first();
        $existingTeacher = Teacher::where('email', $request->email)->first();
        
        // If teacher exists, it's a duplicate
        if ($existingTeacher) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => ['email' => ['A teacher with this email already exists.']]
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'teacher_id' => 'required|string|max:50|unique:teachers,teacher_id',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'email' => 'required|email|max:255|unique:teachers,email',
            'gender' => 'nullable|in:Male,Female',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'department' => 'nullable|string|max:255',
            // Password is now optional - will be auto-generated if not provided
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create or reuse user account
            if ($existingUser) {
                // Reuse existing user account
                $user = $existingUser;
                $password = null; // Don't send email for reused user
                Log::info('Reusing existing user account for teacher', ['user_id' => $user->id, 'email' => $user->email]);
            } else {
                // Always generate password (password field removed from form)
                $password = Str::random(12);
                
                // Create new user account
                $user = User::create([
                    'name' => $request->first_name . ' ' . $request->last_name,
                    'email' => $request->email,
                    'password' => Hash::make($password),
                    'role' => 'teacher',
                    'status' => 'active',
                    'must_change_password' => true,
                ]);
                Log::info('Created new user account for teacher', ['user_id' => $user->id, 'email' => $user->email, 'password_generated' => true]);
            }

            // Create teacher record
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'teacher_id' => $request->teacher_id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name,
                'email' => $request->email,
                'gender' => $request->gender,
                'phone' => $request->phone,
                'address' => $request->address,
                'department' => $request->department,
            ]);

            // Add computed fields
            $teacher->classes_count = $teacher->getClassCount();
            $teacher->full_name = $teacher->getFullName();

            DB::commit();

            // Send account information email after transaction commit
            // Only send if user was just created (not reused) and password was generated
            if (isset($password) && $password) {
                try {
                    $this->sendAccountInfoEmail($user, $password);
                    Log::info('Account info email queued for teacher', ['user_id' => $user->id, 'email' => $user->email]);
                } catch (\Exception $e) {
                    Log::error('Failed to send account info email to teacher: ' . $e->getMessage());
                    Log::error('Teacher email error trace: ' . $e->getTraceAsString());
                    // Don't fail the creation if email fails
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Teacher created successfully',
                'data' => $teacher
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating teacher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified teacher
     * GET /api/teachers/{id}
     */
    public function show($id)
    {
        try {
            $teacher = Teacher::with(['user', 'advisoryClass', 'subjects'])->findOrFail($id);
            $teacher->classes_count = $teacher->getClassCount();
            $teacher->student_count = $teacher->getStudentCount();
            $teacher->full_name = $teacher->getFullName();
            $teacher->current_subjects = $teacher->getCurrentSubjects();
            
            // Include advisory class info
            if ($teacher->advisoryClass) {
                $teacher->advisory_class = [
                    'id' => $teacher->advisoryClass->id,
                    'class_code' => $teacher->advisoryClass->class_code,
                    'class_name' => $teacher->advisoryClass->class_name,
                    'program' => $teacher->advisoryClass->program,
                    'year_level' => $teacher->advisoryClass->year_level,
                ];
            } else {
                $teacher->advisory_class = null;
            }

            return response()->json([
                'success' => true,
                'data' => $teacher
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher not found'
            ], 404);
        }
    }

    /**
     * Update the specified teacher
     * PUT /api/teachers/{id}
     */
    public function update(Request $request, $id)
    {
        try {
            $teacher = Teacher::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'teacher_id' => 'required|string|max:50|unique:teachers,teacher_id,' . $id,
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'email' => 'required|email|max:255|unique:teachers,email,' . $id,
                'gender' => 'nullable|in:Male,Female',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'department' => 'nullable|string|max:255',
                'password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Update teacher record
            $teacher->update($request->only([
                'teacher_id',
                'first_name',
                'last_name',
                'middle_name',
                'email',
                'gender',
                'phone',
                'address',
                'department',
            ]));

            // Update user password if provided
            if (!empty($request->password) && $teacher->user) {
                $teacher->user->update([
                    'password' => Hash::make($request->password),
                ]);
            }

            // Update user record if exists
            if ($teacher->user) {
                $teacher->user->update([
                    'name' => $request->first_name . ' ' . $request->last_name,
                    'email' => $request->email,
                ]);
            }

            // Add computed fields
            $teacher->classes_count = $teacher->getClassCount();
            $teacher->full_name = $teacher->getFullName();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Teacher updated successfully',
                'data' => $teacher
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating teacher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified teacher
     * DELETE /api/teachers/{id}
     */
    public function destroy($id)
    {
        try {
            $teacher = Teacher::findOrFail($id);

            // Check if teacher has assigned classes
            $classCount = $teacher->getClassCount();
            if ($classCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete teacher with {$classCount} assigned classes"
                ], 400);
            }

            DB::beginTransaction();

            // Get user reference before deleting teacher
            $user = $teacher->user;

            // Permanently delete teacher from database
            $teacher->forceDelete();

            // Permanently delete the associated user account as well
            if ($user) {
                $user->forceDelete();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Teacher deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting teacher: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teachers by department
     * GET /api/teachers/department/{department}
     */
    public function getByDepartment($department)
    {
        try {
            $teachers = Teacher::byDepartment($department)->get();
            
            $teachers->transform(function ($teacher) {
                $teacher->full_name = $teacher->getFullName();
                return $teacher;
            });

            return response()->json([
                'success' => true,
                'data' => $teachers
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting teachers by department: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading teachers'
            ], 500);
        }
    }

    /**
     * Get teacher's subjects
     * GET /api/teachers/{id}/subjects
     */
    public function getSubjects($id)
    {
        try {
            $teacher = Teacher::findOrFail($id);
            
            // Get subjects directly assigned to this teacher
            $directSubjects = $teacher->subjects()->get();
            
            // Also get subjects from class_subjects assignments
            $classSubjectIds = $teacher->classSubjects()
                ->pluck('subject_id')
                ->unique();
            
            $classSubjects = \App\Models\Subject::whereIn('id', $classSubjectIds)->get();
            
            // Merge and remove duplicates
            $allSubjects = $directSubjects->merge($classSubjects)->unique('id')->values();

            return response()->json([
                'success' => true,
                'data' => $allSubjects
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading subjects: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teacher's classes
     * GET /api/teachers/{id}/classes
     */
    public function getClasses($id)
    {
        try {
            $teacher = Teacher::findOrFail($id);
            
            // Get classes from class_subjects where teacher is assigned
            $classSubjectClassIds = \App\Models\ClassSubject::where('teacher_id', $id)
                ->pluck('class_id')
                ->unique();
            
            // Get classes where teacher's subjects are linked via course_year_subjects
            $teacherSubjectIds = $teacher->subjects()->pluck('id');
            $subjectClassIds = \App\Models\ClassSubject::whereIn('subject_id', $teacherSubjectIds)
                ->pluck('class_id')
                ->unique();
            
            // Combine and get unique class IDs
            $allClassIds = $classSubjectClassIds->merge($subjectClassIds)->unique();
            
            // Also include advisory class if any
            if ($teacher->advisoryClass) {
                $allClassIds->push($teacher->advisoryClass->id);
            }
            
            // Fetch classes with details
            $classes = \App\Models\Classes::whereIn('id', $allClassIds)
                ->with(['course'])
                ->get()
                ->map(function ($class) {
                    return [
                        'id' => $class->id,
                        'class_code' => $class->class_code,
                        'class_name' => $class->class_name,
                        'program' => $class->program,
                        'year_level' => $class->year_level,
                        'course' => $class->course,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $classes
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading classes: ' . $e->getMessage()
            ], 500);
        }
    }
    public function getCurrent(Request $request)
        {
            try {
                $user = Auth::user();
                
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not authenticated'
                    ], 401);
                }
                
                if ($user->role !== 'teacher') {
                    return response()->json([
                        'success' => false,
                        'message' => 'User is not a teacher'
                    ], 403);
                }
                
                // Find teacher by user_id
                $teacher = Teacher::where('user_id', $user->id)->first();
                
                if (!$teacher) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Teacher profile not found'
                    ], 404);
                }
                
                // Return teacher data with full_name accessor
                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $teacher->id,  // This is teachers.id (NOT users.id)
                        'user_id' => $teacher->user_id,
                        'teacher_id' => $teacher->teacher_id,
                        'first_name' => $teacher->first_name,
                        'middle_name' => $teacher->middle_name,
                        'last_name' => $teacher->last_name,
                        'full_name' => $teacher->full_name,
                        'email' => $teacher->email,
                        'phone' => $teacher->phone,
                        'department' => $teacher->department,
                    ]
                ]);
                
            } catch (\Exception $e) {
                Log::error('Error getting current teacher: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get teacher profile',
                    'error' => $e->getMessage()
                ], 500);
            }
        }
    /**
     * Get teacher's schedule
     * GET /api/teachers/{id}/schedule
     */
    public function getSchedule($id)
    {
        try {
            $teacher = Teacher::findOrFail($id);
            $schedule = $teacher->classSubjects()
                               ->with(['class', 'subject', 'academicYear', 'semester'])
                               ->whereHas('academicYear', function($q) {
                                   $q->where('is_current', true);
                               })
                               ->whereHas('semester', function($q) {
                                   $q->where('is_current', true);
                               })
                               ->get();

            return response()->json([
                'success' => true,
                'data' => $schedule
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading schedule'
            ], 500);
        }
    }

    /**
     * Get teacher statistics
     * GET /api/teachers/stats
     */
    public function getStats()
    {
        try {
            $teachers = Teacher::all();
            
            $stats = [
                'total_teachers' => $teachers->count(),
                'by_department' => $teachers->groupBy('department')
                    ->map(function($group, $dept) {
                        return [
                            'department' => $dept,
                            'count' => $group->count()
                        ];
                    })
                    ->values()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting teacher stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading statistics'
            ], 500);
        }
    }

    /**
     * Get unique departments
     * GET /api/teachers/departments
     */
    public function getDepartments()
    {
        try {
            $departments = Teacher::select('department')
                ->distinct()
                ->whereNotNull('department')
                ->orderBy('department')
                ->pluck('department');

            return response()->json([
                'success' => true,
                'data' => $departments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error loading departments'
            ], 500);
        }
    }

    /**
     * Send account information email to user
     */
    private function sendAccountInfoEmail(User $user, string $password): void
    {
        try {
            Log::info('Attempting to send account info email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'mail_driver' => config('mail.default'),
                'mail_host' => config('mail.mailers.smtp.host'),
                'mail_port' => config('mail.mailers.smtp.port'),
                'mail_username' => config('mail.mailers.smtp.username'),
            ]);
            
            // Explicitly use SMTP mailer
            Mail::mailer('smtp')->send('emails.account-info', [
                'user' => $user,
                'email' => $user->email,
                'password' => $password,
                'appName' => config('app.name', 'School Management System')
            ], function ($message) use ($user) {
                $message->to($user->email)
                        ->from(config('mail.from.address'), config('mail.from.name'))
                        ->subject('Your Account Information - ' . config('app.name', 'School Management System'));
            });
            
            Log::info('Account information email sent successfully', [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);
        } catch (TransportExceptionInterface $e) {
            Log::error('SMTP Transport Error - Failed to send account info email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to send account info email', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}