<?php

namespace App\Http\Controllers;

use App\Models\ClassSubject;
use App\Models\Classes; 
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\AcademicYear;
use App\Models\Semester; 

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Inertia\Inertia;

class ClassSubjectController extends Controller
{
    // CRITICAL: List of relationships that MUST be loaded for proper display
    private $eagerLoads = ['class', 'subject', 'teacher', 'academicYear', 'semester'];

    /**
     * Display a listing of class subjects.
     * GET /api/class-subjects
     */
  public function index(Request $request)
    {
        try {
            $query = ClassSubject::with($this->eagerLoads);
            
            // Filtering logic
            if ($classId = $request->input('class_id')) {
                $query->where('class_id', $classId);
            }
            if ($teacherId = $request->input('teacher_id')) {
                $query->where('teacher_id', $teacherId);
            }
            if ($studentId = $request->input('student_id')) {
                // Filter by student's current class
                $student = \App\Models\Student::find($studentId);
                if ($student && $student->current_class_id) {
                    $query->where('class_id', $student->current_class_id);
                } else {
                    // If student has no current class, return empty result
                    $query->whereRaw('1 = 0');
                }
            }
            if ($search = $request->input('search')) {
               $query->whereHas('subject', function($q) use ($search) {
                   $q->where('subject_name', 'like', "%{$search}%")
                     ->orWhere('subject_code', 'like', "%{$search}%");
               });
            }
            
            // Sorting and Pagination
            $sortBy = $request->input('sort_by', 'class_id');
            $sortOrder = $request->input('sort_order', 'asc');
            $perPage = $request->input('per_page', 10);

            // Check if request expects JSON
            if ($request->expectsJson()) {
                // If paginate=false (used by dropdowns), return all.
                if ($request->input('paginate') === 'false' || $request->input('paginate') === false) {
                    $classSubjects = $query->get();
                    return response()->json([
                        'success' => true,
                        'data' => $classSubjects->map(function ($cs) {
                            return [
                                'id' => $cs->id,
                                'class_id' => $cs->class_id,
                                'subject_id' => $cs->subject_id,
                                'teacher_id' => $cs->teacher_id,
                                'academic_year_id' => $cs->academic_year_id,
                                'semester_id' => $cs->semester_id,
                                'subject' => $cs->subject ? [
                                    'id' => $cs->subject->id,
                                    'subject_code' => $cs->subject->subject_code,
                                    'subject_name' => $cs->subject->subject_name,
                                    'units' => $cs->subject->units ?? 0,
                                ] : null,
                                'class_name' => $cs->class_name,
                                'subject_name' => $cs->subject_name,
                                'subject_code' => $cs->subject ? $cs->subject->subject_code : null,
                                'teacher_name' => $cs->teacher_name,
                                'academic_year_name' => $cs->academic_year_name,
                                'semester_name' => $cs->semester_name,
                            ];
                        })
                    ]);
                }
                
                // Paginated JSON response (used by the ClassSubjects/Index table)
                $classSubjects = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

                return response()->json([
                    'success' => true,
                    'data' => collect($classSubjects->items())->map(function ($cs) {
                        return [
                            'id' => $cs->id,
                            'class_id' => $cs->class_id,
                            'subject_id' => $cs->subject_id,
                            'teacher_id' => $cs->teacher_id,
                            'academic_year_id' => $cs->academic_year_id,
                            'semester_id' => $cs->semester_id,
                            'subject' => $cs->subject ? [
                                'id' => $cs->subject->id,
                                'subject_code' => $cs->subject->subject_code,
                                'subject_name' => $cs->subject->subject_name,
                                'units' => $cs->subject->units ?? 0,
                            ] : null,
                            'class_name' => $cs->class_name,
                            'subject_name' => $cs->subject_name,
                            'subject_code' => $cs->subject ? $cs->subject->subject_code : null,
                            'teacher_name' => $cs->teacher_name,
                            'academic_year_name' => $cs->academic_year_name,
                            'semester_name' => $cs->semester_name,
                        ];
                    })->values()->all(),
                    'pagination' => [
                        'current_page' => $classSubjects->currentPage(),
                        'last_page' => $classSubjects->lastPage(),
                        'per_page' => $classSubjects->perPage(),
                        'total' => $classSubjects->total(),
                    ]
                ]);
            }

            // For Inertia View (if applicable)
            $classSubjects = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
            return Inertia::render('ClassSubjects/Index', [
                'classSubjects' => $classSubjects,
                'classes' => Classes::all(), 
                'subjects' => Subject::all(),
                'teachers' => Teacher::all(),
                'filters' => $request->only(['class_id', 'teacher_id', 'search'])
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching class subjects: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to retrieve class subjects', 
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while fetching class subjects'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = Validator::make($request->all(), [
                'class_id' => 'required|exists:classes,id',
                'subject_id' => 'required|exists:subjects,id',
                'teacher_id' => 'nullable|exists:teachers,id',
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_id' => 'required|exists:semesters,id',
            ])->validate();

            $classSubject = ClassSubject::create($validated);
            
            // Eager load relationships for response
            $classSubject->load($this->eagerLoads);

            // Format response with accessor attributes
            $responseData = [
                'id' => $classSubject->id,
                'class_id' => $classSubject->class_id,
                'subject_id' => $classSubject->subject_id,
                'teacher_id' => $classSubject->teacher_id,
                'academic_year_id' => $classSubject->academic_year_id,
                'semester_id' => $classSubject->semester_id,
                'class_name' => $classSubject->class_name,
                'subject_name' => $classSubject->subject_name,
                'subject_code' => $classSubject->subject ? $classSubject->subject->subject_code : null,
                'teacher_name' => $classSubject->teacher_name,
                'academic_year_name' => $classSubject->academic_year_name,
                'semester_name' => $classSubject->semester_name,
            ];

            return response()->json([
                'success' => true, 
                'data' => $responseData, 
                'message' => 'Class-Subject link created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error linking class subject: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to create link', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $classSubject = ClassSubject::findOrFail($id);

            $validated = Validator::make($request->all(), [
                'class_id' => 'required|exists:classes,id',
                'subject_id' => 'required|exists:subjects,id',
                'teacher_id' => 'nullable|exists:teachers,id',
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_id' => 'required|exists:semesters,id',
            ])->validate();

            $classSubject->update($validated);
            
            // Eager load relationships for response
            $classSubject->load($this->eagerLoads);

            // Format response with accessor attributes
            $responseData = [
                'id' => $classSubject->id,
                'class_id' => $classSubject->class_id,
                'subject_id' => $classSubject->subject_id,
                'teacher_id' => $classSubject->teacher_id,
                'academic_year_id' => $classSubject->academic_year_id,
                'semester_id' => $classSubject->semester_id,
                'class_name' => $classSubject->class_name,
                'subject_name' => $classSubject->subject_name,
                'subject_code' => $classSubject->subject ? $classSubject->subject->subject_code : null,
                'teacher_name' => $classSubject->teacher_name,
                'academic_year_name' => $classSubject->academic_year_name,
                'semester_name' => $classSubject->semester_name,
            ];

            return response()->json([
                'success' => true, 
                'data' => $responseData, 
                'message' => 'Class-Subject link updated successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Class-Subject link not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error updating class subject link: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to update link', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $classSubject = ClassSubject::findOrFail($id);
            $classSubject->delete();

            return response()->json([
                'success' => true, 
                'message' => 'Class-Subject link removed successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Class-Subject link not found (already deleted)'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting class subject link: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to delete link', 
                'error' => $e->getMessage()
            ], 500);
        }
    }
}