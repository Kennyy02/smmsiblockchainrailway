<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Student;
use App\Models\ClassSubject;
use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class GradeController extends Controller
{
    /**
     * Display a listing of grades
     */
    public function index(Request $request)
    {
        try {
            $query = Grade::with([
                'student',
                'classSubject.subject',
                'classSubject.class',
                'academicYear',
                'semester'
            ]);
            
            // Apply student filter
            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            
            // Apply academic year filter
            if ($academicYearId = $request->input('academic_year_id')) {
                $query->byAcademicYear($academicYearId);
            }
            
            // Apply semester filter
            if ($semesterId = $request->input('semester_id')) {
                $query->bySemester($semesterId);
            }
            
            // Apply class subject filter
            if ($classSubjectId = $request->input('class_subject_id')) {
                $query->where('class_subject_id', $classSubjectId);
            }
            
            // Apply remarks filter
            if ($remarks = $request->input('remarks')) {
                match($remarks) {
                    'passed' => $query->passed(),
                    'failed' => $query->failed(),
                    'incomplete' => $query->incomplete(),
                    default => null
                };
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Check if request expects JSON
            if ($request->expectsJson()) {
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $grades = $query->paginate($perPage);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $grades->items(),
                        'pagination' => [
                            'current_page' => $grades->currentPage(),
                            'last_page' => $grades->lastPage(),
                            'per_page' => $grades->perPage(),
                            'total' => $grades->total()
                        ]
                    ]);
                } else {
                    $grades = $query->get();
                    return response()->json([
                        'success' => true,
                        'data' => $grades
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $grades = $query->paginate($perPage);
            
            return Inertia::render('Grades/Index', [
                'grades' => $grades,
                'students' => Student::with('user')->get(),
                'classSubjects' => ClassSubject::with(['subject', 'class'])->get(),
                'academicYears' => AcademicYear::all(),
                'semesters' => Semester::with('academicYear')->get(),
                'filters' => $request->only(['student_id', 'academic_year_id', 'semester_id', 'class_subject_id', 'remarks', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching grades: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve grades',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve grades');
        }
    }

    /**
     * Get grades by student
     */
    public function getByStudent($studentId)
    {
        try {
            $grades = Grade::byStudent($studentId)
                ->with([
                    'classSubject.subject',
                    'classSubject.class',
                    'academicYear',
                    'semester'
                ])
                ->orderBy('academic_year_id', 'desc')
                ->orderBy('semester_id', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $grades
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching grades by student: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve grades',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student transcript
     */
    public function getTranscript($studentId)
    {
        try {
            $student = Student::with(['user', 'currentClass'])->findOrFail($studentId);
            
            $grades = Grade::byStudent($studentId)
                ->with([
                    'classSubject.subject',
                    'classSubject.class',
                    'academicYear',
                    'semester'
                ])
                ->orderBy('academic_year_id')
                ->orderBy('semester_id')
                ->get();
            
            // Calculate GPA
            $totalGPA = 0;
            $totalUnits = 0;
            $completedGrades = $grades->where('final_rating', '!=', null);
            
            foreach ($completedGrades as $grade) {
                $units = $grade->classSubject->subject->units ?? 3;
                $totalGPA += ($grade->getGPA() ?? 0) * $units;
                $totalUnits += $units;
            }
            
            $overallGPA = $totalUnits > 0 ? round($totalGPA / $totalUnits, 2) : 0;
            
            // Group by academic year and semester
            $groupedGrades = $grades->groupBy(function($grade) {
                return $grade->academic_year_id . '-' . $grade->semester_id;
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'grades' => $grades,
                    'grouped_grades' => $groupedGrades,
                    'overall_gpa' => $overallGPA,
                    'total_units' => $totalUnits,
                    'completed_subjects' => $completedGrades->count(),
                    'passed_subjects' => $completedGrades->where('remarks', 'Passed')->count(),
                    'failed_subjects' => $completedGrades->where('remarks', 'Failed')->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching transcript: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transcript',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get grade statistics
     */
    public function getStats(Request $request)
    {
        try {
            $query = Grade::query();
            
            // Apply filters if provided
            if ($academicYearId = $request->input('academic_year_id')) {
                $query->byAcademicYear($academicYearId);
            }
            if ($semesterId = $request->input('semester_id')) {
                $query->bySemester($semesterId);
            }
            
            $totalGrades = $query->count();
            $passedCount = $query->clone()->passed()->count();
            $failedCount = $query->clone()->failed()->count();
            $incompleteCount = $query->clone()->incomplete()->count();
            
            $avgFinalRating = $query->clone()->whereNotNull('final_rating')->avg('final_rating');
            
            $passRate = $totalGrades > 0 ? round(($passedCount / $totalGrades) * 100, 2) : 0;
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_grades' => $totalGrades,
                    'passed_count' => $passedCount,
                    'failed_count' => $failedCount,
                    'incomplete_count' => $incompleteCount,
                    'pass_rate' => $passRate,
                    'average_final_rating' => round($avgFinalRating ?? 0, 2)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching grade stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve grade stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new grade
     */
    public function create()
    {
        return Inertia::render('Grades/Create', [
            'students' => Student::with('user')->get(),
            'classSubjects' => ClassSubject::with(['subject', 'class', 'teacher'])->get(),
            'academicYears' => AcademicYear::all(),
            'semesters' => Semester::with('academicYear')->get()
        ]);
    }

    /**
     * Store a newly created grade
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|exists:students,id',
                'class_subject_id' => 'required|exists:class_subjects,id',
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_id' => 'required|exists:semesters,id',
                'prelim_grade' => 'nullable|numeric|min:0|max:100',
                'midterm_grade' => 'nullable|numeric|min:0|max:100',
                'final_grade' => 'nullable|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                
                return back()->withErrors($validator)->withInput();
            }

            $grade = Grade::create($validator->validated());
            
            // Auto-calculate final rating if all grades are present
            if ($grade->prelim_grade && $grade->midterm_grade && $grade->final_grade) {
                $grade->updateFinalRating();
            }
            
            $grade->load(['student', 'classSubject.subject', 'academicYear', 'semester']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $grade,
                    'message' => 'Grade created successfully'
                ], 201);
            }
            
            return redirect()->route('grades.index')
                ->with('success', 'Grade created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating grade: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create grade',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create grade')->withInput();
        }
    }

    /**
     * Display the specified grade
     */
    public function show(Request $request, $id)
    {
        try {
            $grade = Grade::with([
                'student.user',
                'classSubject.subject',
                'classSubject.class',
                'classSubject.teacher',
                'academicYear',
                'semester'
            ])->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $grade
                ]);
            }
            
            return Inertia::render('Grades/Show', [
                'grade' => $grade
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching grade: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Grade not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Grade not found');
        }
    }

    /**
     * Show the form for editing the specified grade
     */
    public function edit($id)
    {
        try {
            $grade = Grade::with([
                'student',
                'classSubject',
                'academicYear',
                'semester'
            ])->findOrFail($id);
            
            return Inertia::render('Grades/Edit', [
                'grade' => $grade,
                'students' => Student::with('user')->get(),
                'classSubjects' => ClassSubject::with(['subject', 'class', 'teacher'])->get(),
                'academicYears' => AcademicYear::all(),
                'semesters' => Semester::with('academicYear')->get()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching grade for edit: ' . $e->getMessage());
            return back()->with('error', 'Grade not found');
        }
    }

    /**
     * Update the specified grade
     */
    public function update(Request $request, $id)
    {
        try {
            $grade = Grade::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|exists:students,id',
                'class_subject_id' => 'required|exists:class_subjects,id',
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_id' => 'required|exists:semesters,id',
                'prelim_grade' => 'nullable|numeric|min:0|max:100',
                'midterm_grade' => 'nullable|numeric|min:0|max:100',
                'final_grade' => 'nullable|numeric|min:0|max:100',
            ]);

            if ($validator->fails()) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors()
                    ], 422);
                }
                
                return back()->withErrors($validator)->withInput();
            }

            $grade->update($validator->validated());
            
            // Auto-calculate final rating if all grades are present
            if ($grade->prelim_grade && $grade->midterm_grade && $grade->final_grade) {
                $grade->updateFinalRating();
            }
            
            $grade->load(['student', 'classSubject.subject', 'academicYear', 'semester']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $grade,
                    'message' => 'Grade updated successfully'
                ]);
            }
            
            return redirect()->route('grades.index')
                ->with('success', 'Grade updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating grade: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update grade',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update grade')->withInput();
        }
    }

    /**
     * Remove the specified grade
     */
    public function destroy(Request $request, $id)
    {
        try {
            $grade = Grade::findOrFail($id);
            
            $studentName = $grade->student->first_name . ' ' . $grade->student->last_name;
            $subjectName = $grade->classSubject->subject->subject_name;
            
            $grade->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Grade for {$studentName} in {$subjectName} deleted successfully"
                ]);
            }
            
            return redirect()->route('grades.index')
                ->with('success', "Grade deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting grade: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete grade',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete grade');
        }
    }
}