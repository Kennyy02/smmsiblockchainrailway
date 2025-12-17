<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Classes;
use App\Models\Grade;
use App\Models\ParentModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * Display a listing of students (API & Inertia).
     */
    public function index(Request $request)
    {
        try {
            $query = Student::with(['user', 'currentClass', 'parents'])->withCount(['grades', 'attendance']);
            
            if ($search = $request->input('search')) {
                $query->search($search);
            }
            
            if ($program = $request->input('program')) {
                $query->byProgram($program);
            }
            
            // Handle year_level range filter (for education level filtering)
            if ($yearLevelMin = $request->input('year_level_min')) {
                $yearLevelMax = $request->input('year_level_max', $yearLevelMin);
                $query->whereBetween('year_level', [(int)$yearLevelMin, (int)$yearLevelMax]);
            } elseif ($yearLevel = $request->input('year_level')) {
                $query->byYearLevel((int)$yearLevel);
            }
            
            // Handle status filter (active = enrolled, inactive = not enrolled)
            if ($status = $request->input('status')) {
                if ($status === 'active') {
                    $query->whereNotNull('current_class_id');
                } elseif ($status === 'inactive') {
                    $query->whereNull('current_class_id');
                }
            }
            
            if ($classId = $request->input('class_id')) {
                $query->byClass($classId);
            }
            
            $sortBy = $request->input('sort_by', 'last_name');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);
            
            $perPage = $request->input('per_page', 10);
            $students = $query->paginate($perPage);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $students->items(),
                    'pagination' => [
                        'current_page' => $students->currentPage(),
                        'last_page' => $students->lastPage(),
                        'per_page' => $students->perPage(),
                        'total' => $students->total()
                    ]
                ]);
            }
            
            return Inertia::render('Students/Index', [
                'students' => $students,
                'classes' => Classes::all(),
                'filters' => $request->only(['search', 'program', 'year_level', 'class_id', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching students: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to retrieve students', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to retrieve students');
        }
    }

    /**
     * Store a newly created student in storage (API & Inertia).
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id|unique:students',
                'student_id' => 'required|string|max:20|unique:students',
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:students',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'date_of_birth' => 'required|date',
                'gender' => 'nullable|in:Male,Female',
                'program' => 'nullable|string|max:255',
                'year_level' => 'required|integer|min:1|max:16',
                'current_class_id' => 'nullable|exists:classes,id',
                // Parent/Guardian validation
                'parent_guardian' => 'nullable|array',
                'parent_guardian.first_name' => 'nullable|string|max:255',
                'parent_guardian.middle_name' => 'nullable|string|max:255',
                'parent_guardian.last_name' => 'nullable|string|max:255',
                'parent_guardian.email' => 'nullable|email',
                'parent_guardian.phone' => 'nullable|string|max:20',
                'parent_guardian.address' => 'nullable|string|max:500',
                'parent_guardian.relationship' => 'nullable|string|max:50',
                'parent_guardian.password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson()
                    ? response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422)
                    : back()->withErrors($validator)->withInput();
            }

            DB::beginTransaction();
            
            $studentData = $validator->validated();
            unset($studentData['parent_guardian']); // Remove parent data from student creation
            
            $student = Student::create($studentData);
            
            // Handle parent/guardian creation if provided
            $parentData = $request->input('parent_guardian');
            if ($parentData && !empty($parentData['first_name']) && !empty($parentData['last_name'])) {
                $parent = $this->createOrUpdateParent($parentData, $student);
            }
            
            DB::commit();
            
            $student->load(['user', 'currentClass', 'parents']);
            
            return $request->expectsJson()
                ? response()->json(['success' => true, 'data' => $student, 'message' => 'Student created successfully'], 201)
                : redirect()->route('students.index')->with('success', 'Student created successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating student: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to create student', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to create student')->withInput();
        }
    }
    
    /**
     * Create or update a parent/guardian and link to student
     */
    private function createOrUpdateParent(array $parentData, Student $student)
    {
        // Check if parent already exists by email
        $existingParent = null;
        if (!empty($parentData['email'])) {
            $existingParent = ParentModel::where('email', $parentData['email'])->first();
        }
        
        if ($existingParent) {
            // Update existing parent info
            $existingParent->update([
                'first_name' => $parentData['first_name'],
                'middle_name' => $parentData['middle_name'] ?? null,
                'last_name' => $parentData['last_name'],
                'phone' => $parentData['phone'] ?? null,
                'address' => $parentData['address'] ?? null,
            ]);
            $parent = $existingParent;
        } else {
            // Create user account for parent
            $user = User::create([
                'name' => trim($parentData['first_name'] . ' ' . ($parentData['last_name'] ?? '')),
                'email' => $parentData['email'] ?? 'parent_' . uniqid() . '@temp.local',
                'password' => Hash::make($parentData['password'] ?? 'password123'),
                'role' => 'parent',
                'status' => 'active',
            ]);
            
            // Create parent record
            $parent = ParentModel::create([
                'user_id' => $user->id,
                'first_name' => $parentData['first_name'],
                'middle_name' => $parentData['middle_name'] ?? null,
                'last_name' => $parentData['last_name'],
                'email' => $parentData['email'] ?? $user->email,
                'phone' => $parentData['phone'] ?? null,
                'address' => $parentData['address'] ?? null,
            ]);
        }
        
        // Link parent to student (many-to-many relationship)
        if (!$student->parents()->where('parent_id', $parent->id)->exists()) {
            $student->parents()->attach($parent->id);
        }
        
        return $parent;
    }

    /**
     * Display the specified student (API & Inertia).
     */
    public function show(Request $request, $id)
    {
        try {
            $student = Student::with(['user', 'currentClass', 'grades.classSubject.subject', 'parents'])
                ->withCount(['grades', 'attendance'])
                ->findOrFail($id);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $student,
                ]);
            }
            
            return Inertia::render('Students/Show', ['student' => $student]);
        } catch (\Exception $e) {
            Log::error('Error fetching student: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Student not found'], 404)
                : back()->with('error', 'Student not found');
        }
    }

    /**
     * Update the specified student in storage (API & Inertia).
     */
    public function update(Request $request, $id)
    {
        try {
            $student = Student::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id|unique:students,user_id,' . $student->id,
                'student_id' => 'required|string|max:20|unique:students,student_id,' . $student->id,
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:students,email,' . $student->id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'date_of_birth' => 'required|date',
                'gender' => 'nullable|in:Male,Female',
                'program' => 'nullable|string|max:255',
                'year_level' => 'required|integer|min:1|max:16',
                'current_class_id' => 'nullable|exists:classes,id',
                // Parent/Guardian validation
                'parent_guardian' => 'nullable|array',
                'parent_guardian.first_name' => 'nullable|string|max:255',
                'parent_guardian.middle_name' => 'nullable|string|max:255',
                'parent_guardian.last_name' => 'nullable|string|max:255',
                'parent_guardian.email' => 'nullable|email',
                'parent_guardian.phone' => 'nullable|string|max:20',
                'parent_guardian.address' => 'nullable|string|max:500',
                'parent_guardian.relationship' => 'nullable|string|max:50',
                'parent_guardian.password' => 'nullable|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson()
                    ? response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422)
                    : back()->withErrors($validator)->withInput();
            }

            DB::beginTransaction();
            
            $studentData = $validator->validated();
            unset($studentData['parent_guardian']); // Remove parent data from student update
            
            $student->update($studentData);
            
            // Handle parent/guardian creation/update if provided
            $parentData = $request->input('parent_guardian');
            if ($parentData && !empty($parentData['first_name']) && !empty($parentData['last_name'])) {
                $parent = $this->createOrUpdateParent($parentData, $student);
            }
            
            DB::commit();
            
            $student->load(['user', 'currentClass', 'parents']);
            
            return $request->expectsJson()
                ? response()->json(['success' => true, 'data' => $student, 'message' => 'Student updated successfully'])
                : redirect()->route('students.index')->with('success', 'Student updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating student: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to update student', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to update student')->withInput();
        }
    }

    /**
     * Remove the specified student from storage (API & Inertia).
     */
    public function destroy(Request $request, $id)
    {
        try {
            $student = Student::findOrFail($id);
            $forceDelete = $request->input('force', false);
            
            $gradesCount = $student->grades()->count();
            $attendanceCount = $student->attendance()->count();
            $totalRelated = $gradesCount + $attendanceCount;
            
            if ($totalRelated > 0 && !$forceDelete) {
                $message = "Cannot delete student '{$student->first_name} {$student->last_name}' because they have {$gradesCount} grade(s) and {$attendanceCount} attendance record(s).";
                return $request->expectsJson()
                    ? response()->json(['success' => false, 'message' => $message], 400)
                    : back()->with('error', $message);
            }
            
            if ($totalRelated > 0 && $forceDelete) {
                // Delete related records on force delete
                $student->grades()->delete();
                $student->attendance()->delete();
                $student->studentSubmissions()->delete(); // Assuming this relationship exists
                $student->certificates()->delete(); // Assuming this relationship exists
                Log::warning("Force deleted student '{$student->first_name} {$student->last_name}' with related records.");
            }
            
            $studentName = $student->first_name . ' ' . $student->last_name;
            $student->delete();
            
            return $request->expectsJson()
                ? response()->json(['success' => true, 'message' => "Student '{$studentName}' deleted successfully"])
                : redirect()->route('students.index')->with('success', "Student '{$studentName}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting student: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to delete student', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to delete student');
        }
    }

    /**
     * Get student statistics (total, active, inactive, by education level).
     * GET /api/students/stats
     */
    public function getStats()
    {
        try {
            // 1. Get total count
            $totalStudents = Student::count();

            // 2. Get active students count: Defined by students currently assigned to a class.
            $activeStudents = Student::whereNotNull('current_class_id')->count();
            
            // 3. Get inactive students count
            $inactiveStudents = Student::whereNull('current_class_id')->count();
            
            // 4. Group by program and count students
            $studentsByProgram = Student::select('program')
                ->selectRaw('count(*) as count')
                ->groupBy('program')
                ->orderByDesc('count')
                ->get();
            
            // 5. Format the output to match the frontend interface expectation (course/count)
            $byCourse = $studentsByProgram->map(function ($item) {
                return [
                    'course' => $item->program, // Frontend uses 'course', backend model uses 'program'
                    'count' => $item->count,
                ];
            });
            
            // 6. Count by education level
            $byEducationLevel = [
                'college' => Student::whereBetween('year_level', [13, 16])->count(),
                'senior_high' => Student::whereBetween('year_level', [11, 12])->count(),
                'junior_high' => Student::whereBetween('year_level', [7, 10])->count(),
                'elementary' => Student::whereBetween('year_level', [1, 6])->count(),
            ];

            $stats = [
                'total_students' => $totalStudents,
                'active_students' => $activeStudents,
                'inactive_students' => $inactiveStudents,
                'by_course' => $byCourse,
                'by_education_level' => $byEducationLevel,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting student stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading student statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the academic transcript for a specific student (API).
     */
    public function getTranscript($id)
    {
        try {
            $student = Student::with(['user', 'currentClass'])->findOrFail($id);
            
            $grades = Grade::byStudent($id)
                ->with(['classSubject.subject', 'academicYear', 'semester'])
                ->orderBy('academic_year_id')
                ->orderBy('semester_id')
                ->get();
            
            // Re-calculating GPA for completeness, as the Student model method might not be defined here
            $totalGPA = 0;
            $totalUnits = 0;
            $completedGrades = $grades->where('final_rating', '!=', null);
            
            foreach ($completedGrades as $grade) {
                // Assuming a default unit value if not found, or relying on a model method
                $units = $grade->classSubject->subject->units ?? 3;
                
                // Assuming a getGPA() method exists on the Grade model to convert rating to GPA
                $gpa = method_exists($grade, 'getGPA') ? $grade->getGPA() : $grade->final_rating / 25; // Example calculation
                
                $totalGPA += ($gpa ?? 0) * $units;
                $totalUnits += $units;
            }
            
            $overallGPA = $totalUnits > 0 ? round($totalGPA / $totalUnits, 2) : 0;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'grades' => $grades,
                    'overall_gpa' => $overallGPA,
                    'total_units_earned' => $totalUnits,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student transcript: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve transcript', 'error' => $e->getMessage()], 500);
        }
    }
}