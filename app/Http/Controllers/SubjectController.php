<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SubjectController extends Controller
{
    /**
     * Display a listing of subjects
     */
    public function index(Request $request)
    {
        try {
            $query = Subject::with(['teacher', 'assignedTeachers'])->withCount('classSubjects');
            
            // Apply search filter
            if ($search = $request->input('search')) {
                $query->search($search);
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'subject_code');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Check if request expects JSON (API call)
            if ($request->expectsJson()) {
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $subjects = $query->paginate($perPage);
                    
                    // Transform to include assigned_teachers
                    $transformedSubjects = collect($subjects->items())->map(function ($subject) {
                        $data = $subject->toArray();
                        $data['assigned_teachers'] = $subject->assignedTeachers->map(function ($teacher) {
                            return [
                                'id' => $teacher->id,
                                'full_name' => $teacher->full_name,
                            ];
                        });
                        return $data;
                    });
                    
                    return response()->json([
                        'success' => true,
                        'data' => $transformedSubjects,
                        'pagination' => [
                            'current_page' => $subjects->currentPage(),
                            'last_page' => $subjects->lastPage(),
                            'per_page' => $subjects->perPage(),
                            'total' => $subjects->total()
                        ]
                    ]);
                } else {
                    $subjects = $query->get();
                    
                    // Transform to include assigned_teachers
                    $transformedSubjects = $subjects->map(function ($subject) {
                        $data = $subject->toArray();
                        $data['assigned_teachers'] = $subject->assignedTeachers->map(function ($teacher) {
                            return [
                                'id' => $teacher->id,
                                'full_name' => $teacher->full_name,
                            ];
                        });
                        return $data;
                    });
                    
                    return response()->json([
                        'success' => true,
                        'data' => $transformedSubjects
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $subjects = $query->paginate($perPage);
            
            return Inertia::render('Subjects/Index', [
                'subjects' => $subjects,
                'filters' => $request->only(['search', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subjects: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve subjects',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve subjects');
        }
    }

    /**
     * Get all subjects (no pagination)
     */
    public function getAllActive()
    {
        try {
            $subjects = Subject::orderByCode()->get();
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subject by code
     */
    public function getByCode($code)
    {
        try {
            $subject = Subject::findByCode($code);
            
            if (!$subject) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $subject
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject by code: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subject statistics
     */
    public function getStats(Request $request)
    {
        try {
            $totalSubjects = Subject::count();
            $totalUnits = Subject::getTotalUnits();
            $averageUnits = Subject::getAverageUnits();
            
            $popularSubjects = Subject::getPopularSubjects(5);
            $subjectsNeedingAttention = Subject::getSubjectsNeedingAttention();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_subjects' => $totalSubjects,
                    'total_units' => $totalUnits,
                    'average_units' => $averageUnits,
                    'popular_subjects' => $popularSubjects,
                    'subjects_needing_attention' => $subjectsNeedingAttention->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subject stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subject statistics detail (with full data)
     */
    public function getDetailedStats($id)
    {
        try {
            $subject = Subject::findOrFail($id);
            $statistics = $subject->getStatistics();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'subject' => $subject,
                    'statistics' => $statistics,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject detailed stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subject statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new subject
     */
    public function create()
    {
        return Inertia::render('Subjects/Create');
    }

    /**
     * Store a newly created subject
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'subject_code' => 'required|string|max:20|unique:subjects',
                'subject_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'units' => 'required|numeric|min:0|max:10',
                'teacher_id' => 'nullable|exists:teachers,id', // Legacy single teacher
                'teacher_ids' => 'nullable|array', // Multiple teachers
                'teacher_ids.*' => 'exists:teachers,id',
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

            $validated = $validator->validated();
            $teacherIds = $validated['teacher_ids'] ?? [];
            unset($validated['teacher_ids']);
            
            // If teacher_ids is provided, use the first one for legacy teacher_id field
            if (!empty($teacherIds) && empty($validated['teacher_id'])) {
                $validated['teacher_id'] = $teacherIds[0];
            }

            $subject = Subject::create($validated);
            
            // Sync the many-to-many relationship
            if (!empty($teacherIds)) {
                $subject->assignedTeachers()->sync($teacherIds);
            } elseif (!empty($validated['teacher_id'])) {
                // If only single teacher_id provided, add to pivot table
                $subject->assignedTeachers()->sync([$validated['teacher_id']]);
            }
            
            // Reload with relationships
            $subject->load('assignedTeachers');
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $subject,
                    'message' => 'Subject created successfully'
                ], 201);
            }
            
            return redirect()->route('subjects.index')
                ->with('success', 'Subject created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating subject: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create subject',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create subject')->withInput();
        }
    }

    /**
     * Display the specified subject
     */
    public function show(Request $request, $id)
    {
        try {
            $subject = Subject::with(['classSubjects.class', 'classSubjects.teacher'])
                ->withCount(['classSubjects', 'assignments', 'grades'])
                ->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'subject' => $subject,
                        'statistics' => $subject->getStatistics(),
                        'current_teachers' => $subject->getCurrentTeachers(),
                    ]
                ]);
            }
            
            return Inertia::render('Subjects/Show', [
                'subject' => $subject,
                'statistics' => $subject->getStatistics(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Subject not found');
        }
    }

    /**
     * Show the form for editing the specified subject
     */
    public function edit($id)
    {
        try {
            $subject = Subject::findOrFail($id);
            
            return Inertia::render('Subjects/Edit', [
                'subject' => $subject
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject for edit: ' . $e->getMessage());
            return back()->with('error', 'Subject not found');
        }
    }

    /**
     * Update the specified subject
     */
    public function update(Request $request, $id)
    {
        try {
            $subject = Subject::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'subject_code' => 'required|string|max:20|unique:subjects,subject_code,' . $subject->id,
                'subject_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'units' => 'required|numeric|min:0|max:10',
                'teacher_id' => 'nullable|exists:teachers,id', // Legacy single teacher
                'teacher_ids' => 'nullable|array', // Multiple teachers
                'teacher_ids.*' => 'exists:teachers,id',
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

            $validated = $validator->validated();
            $teacherIds = $validated['teacher_ids'] ?? [];
            unset($validated['teacher_ids']);
            
            // If teacher_ids is provided, use the first one for legacy teacher_id field
            if (!empty($teacherIds)) {
                $validated['teacher_id'] = $teacherIds[0] ?? null;
            }

            $subject->update($validated);
            
            // Sync the many-to-many relationship
            if (!empty($teacherIds)) {
                $subject->assignedTeachers()->sync($teacherIds);
            } elseif (isset($validated['teacher_id']) && $validated['teacher_id']) {
                // If only single teacher_id provided, add to pivot table
                $subject->assignedTeachers()->sync([$validated['teacher_id']]);
            } else {
                // No teachers assigned
                $subject->assignedTeachers()->sync([]);
            }
            
            // Reload with relationships
            $subject->load('assignedTeachers');
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $subject,
                    'message' => 'Subject updated successfully'
                ]);
            }
            
            return redirect()->route('subjects.index')
                ->with('success', 'Subject updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating subject: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update subject',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update subject')->withInput();
        }
    }

    /**
     * Remove the specified subject
     */
    public function destroy(Request $request, $id)
    {
        try {
            $subject = Subject::findOrFail($id);
            $forceDelete = $request->input('force', false);
            
            $classSubjectsCount = $subject->classSubjects()->count();
            $assignmentsCount = $subject->assignments()->count();
            $gradesCount = $subject->grades()->count();
            $totalRelated = $classSubjectsCount + $assignmentsCount + $gradesCount;
            
            if ($totalRelated > 0 && !$forceDelete) {
                $message = "Cannot delete subject '{$subject->subject_name}' because it has {$classSubjectsCount} class assignment(s), {$assignmentsCount} assignment(s), and {$gradesCount} grade(s).";
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'data' => [
                            'class_subjects_count' => $classSubjectsCount,
                            'assignments_count' => $assignmentsCount,
                            'grades_count' => $gradesCount,
                            'suggestion' => 'Please remove all related records first, or use force delete.'
                        ]
                    ], 400);
                }
                
                return back()->with('error', $message);
            }
            
            if ($totalRelated > 0 && $forceDelete) {
                // Delete related records
                foreach ($subject->classSubjects as $classSubject) {
                    $classSubject->assignments()->delete();
                    $classSubject->grades()->delete();
                    $classSubject->attendance()->delete();
                    $classSubject->courseMaterials()->delete();
                }
                $subject->classSubjects()->delete();
                Log::warning("Force deleted subject '{$subject->subject_name}' with {$totalRelated} related records.");
            }
            
            $subjectName = $subject->subject_name;
            $subject->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Subject '{$subjectName}' deleted successfully"
                ]);
            }
            
            return redirect()->route('subjects.index')
                ->with('success', "Subject '{$subjectName}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting subject: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete subject',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete subject');
        }
    }

    /**
     * Get subjects currently being taught
     */
    public function getCurrentSubjects()
    {
        try {
            $subjects = Subject::whereHas('currentClassSubjects')
                ->with('currentClassSubjects.teacher')
                ->orderBy('subject_code')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching current subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve current subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get teachers for a subject
     */
    public function getTeachers($id)
    {
        try {
            $subject = Subject::findOrFail($id);
            $teachers = $subject->getCurrentTeachers();
            
            return response()->json([
                'success' => true,
                'data' => $teachers
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject teachers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve teachers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get classes for a subject
     */
    public function getClasses($id)
    {
        try {
            $subject = Subject::findOrFail($id);
            $classes = $subject->classes()
                ->with(['academicYear', 'semester'])
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $classes
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subject classes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve classes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get popular subjects
     */
    public function getPopular(Request $request)
    {
        try {
            $limit = $request->input('limit', 10);
            $subjects = Subject::getPopularSubjects($limit);
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching popular subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve popular subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects with high pass rate
     */
    public function getHighPassRate(Request $request)
    {
        try {
            $minRate = $request->input('min_rate', 80);
            $limit = $request->input('limit', 10);
            $subjects = Subject::getSubjectsWithHighPassRate($minRate, $limit);
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching high pass rate subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects needing attention (low pass rate)
     */
    public function getNeedingAttention(Request $request)
    {
        try {
            $maxPassRate = $request->input('max_pass_rate', 70);
            $subjects = Subject::getSubjectsNeedingAttention($maxPassRate);
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subjects needing attention: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}