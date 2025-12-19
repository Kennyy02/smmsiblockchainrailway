<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Student;
use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ClassesController extends Controller
{
    /**
     * Display a listing of classes (API & Inertia).
     * UPDATED: Now loads adviser relationship and includes student_count
     */
    public function index(Request $request)
    {
        try {
            // UPDATED: Load adviser and course relationships and count students
            $query = Classes::with(['academicYear', 'semester', 'adviser', 'course'])
                ->withCount('students');
            
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('class_code', 'like', "%{$search}%")
                      ->orWhere('class_name', 'like', "%{$search}%")
                      ->orWhere('program', 'like', "%{$search}%");
                });
            }
            
            if ($program = $request->input('program')) {
                $query->byProgram($program);
            }
            
            if ($yearLevel = $request->input('year_level')) {
                $query->byYearLevel($yearLevel);
            }
            
            if ($academicYearId = $request->input('academic_year_id')) {
                $query->byAcademicYear($academicYearId);
            }
            
            if ($semesterId = $request->input('semester_id')) {
                $query->bySemester($semesterId);
            }
            
            $sortBy = $request->input('sort_by', 'class_code');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $classes = $query->paginate($perPage);
                
                return response()->json([
                    'success' => true,
                    'data' => $classes->items(),
                    'pagination' => [
                        'current_page' => $classes->currentPage(),
                        'last_page' => $classes->lastPage(),
                        'per_page' => $classes->perPage(),
                        'total' => $classes->total()
                    ]
                ]);
            }
            
            $perPage = $request->input('per_page', 15);
            $classes = $query->paginate($perPage);
            
            return Inertia::render('Classes/Index', [
                'classes' => $classes,
                'academicYears' => AcademicYear::all(),
                'semesters' => Semester::all(),
                'filters' => $request->only(['search', 'program', 'year_level', 'academic_year_id', 'semester_id', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching classes: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Failed to retrieve classes', 'error' => $e->getMessage()], 500);
            }
            
            return back()->with('error', 'Failed to retrieve classes');
        }
    }

    /**
     * Show the form for creating a new resource (Inertia only).
     */
    public function create()
    {
        try {
            return Inertia::render('Classes/Create', [
                'academicYears' => AcademicYear::orderBy('start_date', 'desc')->get(),
                'semesters' => Semester::with('academicYear')->orderBy('start_date', 'desc')->get(),
                'programs' => [
                    'BSMT', 'BSMarE', 'BSME', 'BSCE', 'BSEE', 'BSCS', 'BSIT'
                ], 
                'yearLevels' => [1, 2, 3, 4],
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading class creation form: ' . $e->getMessage());
            return back()->with('error', 'Failed to load creation form');
        }
    }

    /**
     * Store a newly created class in storage (API & Inertia).
     * UPDATED: Now includes adviser_id in validation
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'class_code' => 'required|string|max:20|unique:classes',
                'class_name' => 'required|string|max:255',
                'year_level' => 'required|integer|min:1|max:16',
                'section' => 'required|string|max:10',
                'program' => 'nullable|string|max:255',
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_id' => 'required|exists:semesters,id',
                'adviser_id' => 'nullable|exists:teachers,id', // ADDED
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() 
                    ? response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422)
                    : back()->withErrors($validator)->withInput();
            }

            $class = Classes::create($validator->validated());
            
            // UPDATED: Load all relationships including adviser
            $class->load(['academicYear', 'semester', 'adviser']);
            
            return $request->expectsJson()
                ? response()->json(['success' => true, 'data' => $class, 'message' => 'Class created successfully'], 201)
                : redirect()->route('classes.index')->with('success', 'Class created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating class: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to create class', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to create class')->withInput();
        }
    }

    /**
     * Display the specified class (API & Inertia).
     */
    public function show(Request $request, $id)
    {
        try {
            $class = Classes::with([
                'academicYear', 
                'semester',
                'adviser',
                'course'
            ])
            ->withCount(['students', 'classSubjects'])
            ->findOrFail($id);
            
            // Only load students and classSubjects if needed (they can be large)
            // For API requests, we'll return a simplified version
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $class
                ]);
            }
            
            // For Inertia views, load the full relationships
            $class->load(['students', 'classSubjects.subject', 'classSubjects.teacher']);
            
            return Inertia::render('Classes/Show', [
                'class' => $class
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching class: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve class',
                    'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching the class'
                ], 500);
            }
            
            return back()->with('error', 'Class not found');
        }
    }

    /**
     * Show the form for editing the specified resource (Inertia only).
     */
    public function edit($id)
    {
        try {
            $class = Classes::with(['academicYear', 'semester', 'adviser'])->findOrFail($id);
            
            return Inertia::render('Classes/Edit', [
                'class' => $class,
                'academicYears' => AcademicYear::orderBy('start_date', 'desc')->get(),
                'semesters' => Semester::with('academicYear')->orderBy('start_date', 'desc')->get(),
                'programs' => [
                    'BSMT', 'BSMarE', 'BSME', 'BSCE', 'BSEE', 'BSCS', 'BSIT'
                ],
                'yearLevels' => [1, 2, 3, 4],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching class for edit: ' . $e->getMessage());
            return back()->with('error', 'Class not found');
        }
    }

    /**
     * Update the specified class in storage (API & Inertia).
     * UPDATED: Now includes adviser_id in validation
     */
    public function update(Request $request, $id)
    {
        try {
            $class = Classes::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'class_code' => 'required|string|max:20|unique:classes,class_code,' . $class->id,
                'class_name' => 'required|string|max:255',
                'year_level' => 'required|integer|min:1|max:16',
                'section' => 'required|string|max:10',
                'program' => 'nullable|string|max:255',
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_id' => 'required|exists:semesters,id',
                'adviser_id' => 'nullable|exists:teachers,id', // ADDED
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() 
                    ? response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422)
                    : back()->withErrors($validator)->withInput();
            }

            $class->update($validator->validated());
            
            // UPDATED: Load all relationships including adviser
            $class->load(['academicYear', 'semester', 'adviser']);
            
            return $request->expectsJson()
                ? response()->json(['success' => true, 'data' => $class, 'message' => 'Class updated successfully'])
                : redirect()->route('classes.index')->with('success', 'Class updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating class: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to update class', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to update class')->withInput();
        }
    }

    /**
     * Remove the specified class from storage (API & Inertia).
     */
    public function destroy(Request $request, $id)
    {
        try {
            $class = Classes::findOrFail($id);
            
            $studentsCount = $class->students()->count();
            $classSubjectsCount = $class->classSubjects()->count();
            $totalRelated = $studentsCount + $classSubjectsCount;
            
            // Always clear related records before deleting
            $class->students()->update(['current_class_id' => null]);
            $class->classSubjects()->forceDelete();
            // Also delete enrollments for this class
            \App\Models\Enrollment::where('class_id', $class->id)->forceDelete();
            
            if ($totalRelated > 0) {
                Log::warning("Deleted class '{$class->class_code}' with related records.");
            }
            
            $classCode = $class->class_code;
            // Permanently delete the class (not soft delete)
            $class->forceDelete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Class '{$classCode}' deleted successfully"
                ]);
            }
            
            return redirect()->route('classes.index')
                ->with('success', "Class '{$classCode}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting class: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete class',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete class');
        }
    }

    /**
     * Get classes by program (API).
     */
    public function getByProgram($program)
    {
        try {
            $classes = Classes::byProgram($program)
                ->with(['academicYear', 'semester', 'adviser'])
                ->orderBy('year_level')
                ->orderBy('section')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $classes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching classes by program: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve classes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get classes by year level (API).
     */
    public function getByYearLevel($yearLevel)
    {
        try {
            $classes = Classes::byYearLevel($yearLevel)
                ->with(['academicYear', 'semester', 'adviser'])
                ->orderBy('program')
                ->orderBy('section')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $classes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching classes by year level: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve classes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current classes (API).
     */
    public function getCurrent()
    {
        try {
            $classes = Classes::current()
                ->with(['academicYear', 'semester', 'adviser'])
                ->withCount('students')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $classes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching current classes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve current classes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get GLOBAL class statistics (API).
     * This corresponds to the route: GET /api/classes/stats
     */
    public function getStats()
    {
        try {
            $totalClasses = Classes::count(); 
            $totalStudentsEnrolled = Student::whereNotNull('current_class_id')->count();

            // Count classes with advisers assigned
            $totalAdvisersAssigned = Classes::whereNotNull('adviser_id')->count();

            // Count unique courses/programs - simplified approach
            $totalCourses = Classes::distinct()
                ->whereNotNull('program')
                ->count('program');

            $byProgram = Classes::select('program', DB::raw('count(*) as count'))
                ->whereNotNull('program')
                ->groupBy('program')
                ->get()
                ->map(fn($item) => ['program' => $item->program ?? 'N/A', 'count' => (int)$item->count]);
            
            $stats = [
                'total_classes' => $totalClasses,
                'total_students_enrolled' => $totalStudentsEnrolled,
                'total_advisers_assigned' => $totalAdvisersAssigned,
                'total_courses' => $totalCourses,
                'by_program' => $byProgram,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting global class stats: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve global class statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for a SPECIFIC class ID (API).
     */
    public function getClassStatsById($id)
    {
        try {
            $class = Classes::withCount(['students', 'classSubjects'])->findOrFail($id);
            
            $averageGrade = $class->getAverageGrade();
            $attendanceRate = $class->getAttendanceRate();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'class' => $class,
                    'statistics' => [
                        'students_count' => $class->students_count,
                        'subjects_count' => $class->class_subjects_count,
                        'average_grade' => $averageGrade,
                        'attendance_rate' => $attendanceRate,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching class statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve class statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}