<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\ClassSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    /**
     * Display a listing of assignments
     */
    public function index(Request $request)
    {
        try {
            $query = Assignment::with(['classSubject.subject', 'classSubject.class'])
                ->withCount(['submissions', 'submittedSubmissions', 'gradedSubmissions']);
            
            // Apply search filter
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            // Apply type filter
            if ($type = $request->input('assignment_type')) {
                $query->byType($type);
            }
            
            // Apply class subject filter
            if ($classSubjectId = $request->input('class_subject_id')) {
                $query->where('class_subject_id', $classSubjectId);
            }
            
            // Apply date range filter
            if ($startDate = $request->input('start_date')) {
                $query->where('due_date', '>=', $startDate);
            }
            if ($endDate = $request->input('end_date')) {
                $query->where('due_date', '<=', $endDate);
            }
            
            // Apply status filter
            if ($status = $request->input('status')) {
                match($status) {
                    'upcoming' => $query->upcoming(),
                    'overdue' => $query->overdue(),
                    'due_soon' => $query->dueSoon(),
                    default => null
                };
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'due_date');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Check if request expects JSON
            if ($request->expectsJson()) {
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $assignments = $query->paginate($perPage);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $assignments->items(),
                        'pagination' => [
                            'current_page' => $assignments->currentPage(),
                            'last_page' => $assignments->lastPage(),
                            'per_page' => $assignments->perPage(),
                            'total' => $assignments->total()
                        ]
                    ]);
                } else {
                    $assignments = $query->get();
                    return response()->json([
                        'success' => true,
                        'data' => $assignments
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $assignments = $query->paginate($perPage);
            
            return Inertia::render('Assignments/Index', [
                'assignments' => $assignments,
                'classSubjects' => ClassSubject::with(['subject', 'class'])->get(),
                'filters' => $request->only(['search', 'assignment_type', 'class_subject_id', 'status', 'start_date', 'end_date', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching assignments: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve assignments',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve assignments');
        }
    }

    /**
     * Get assignments by class subject
     */
    public function getByClassSubject($classSubjectId)
    {
        try {
            $assignments = Assignment::where('class_subject_id', $classSubjectId)
                ->with(['classSubject.subject', 'classSubject.class'])
                ->withCount(['submissions', 'submittedSubmissions', 'gradedSubmissions'])
                ->orderBy('due_date', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $assignments
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching assignments by class subject: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get assignment statistics
     */
    public function getStats(Request $request)
    {
        try {
            $query = Assignment::query();
            
            // Apply class subject filter if provided
            if ($classSubjectId = $request->input('class_subject_id')) {
                $query->where('class_subject_id', $classSubjectId);
            }
            
            $totalAssignments = $query->count();
            $upcomingAssignments = $query->clone()->upcoming()->count();
            $overdueAssignments = $query->clone()->overdue()->count();
            
            $assignmentsByType = Assignment::selectRaw('assignment_type, count(*) as count')
                ->groupBy('assignment_type')
                ->get();
            
            // FIX: Eager load the nested relationship needed for getSubmissionRate()
            $allAssignmentsQuery = Assignment::with('classSubject.class');
            
            // Re-apply filter for the average calculation if necessary
            if ($classSubjectId = $request->input('class_subject_id')) {
                $allAssignmentsQuery->where('class_subject_id', $classSubjectId);
            }

            $allAssignments = $allAssignmentsQuery->get();

            // Calculate average using the Eager Loaded collection
            $avgSubmissionRate = $allAssignments->avg(function($assignment) {
                return $assignment->getSubmissionRate();
            });
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_assignments' => $totalAssignments,
                    'upcoming_assignments' => $upcomingAssignments,
                    'overdue_assignments' => $overdueAssignments,
                    'assignments_by_type' => $assignmentsByType,
                    'average_submission_rate' => round($avgSubmissionRate ?? 0, 2)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching assignment stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve assignment stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new assignment
     */
    public function create()
    {
        return Inertia::render('Assignments/Create', [
            'classSubjects' => ClassSubject::with(['subject', 'class', 'teacher'])->get()
        ]);
    }

    /**
     * Store a newly created assignment
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'class_subject_id' => 'required|exists:class_subjects,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'assignment_type' => 'required|in:Homework,Quiz,Exam,Project',
                'total_points' => 'required|integer|min:1',
                'due_date' => 'required|date',
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

            $assignment = Assignment::create($validator->validated());
            $assignment->load(['classSubject.subject', 'classSubject.class']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $assignment,
                    'message' => 'Assignment created successfully'
                ], 201);
            }
            
            return redirect()->route('assignments.index')
                ->with('success', 'Assignment created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating assignment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create assignment',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create assignment')->withInput();
        }
    }

    /**
     * Display the specified assignment
     */
    public function show(Request $request, $id)
    {
        try {
            $assignment = Assignment::with([
                'classSubject.subject', 
                'classSubject.class',
                'submissions.student'
            ])
            ->withCount(['submissions', 'submittedSubmissions', 'gradedSubmissions'])
            ->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $assignment
                ]);
            }
            
            return Inertia::render('Assignments/Show', [
                'assignment' => $assignment
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching assignment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Assignment not found');
        }
    }

    /**
     * Show the form for editing the specified assignment
     */
    public function edit($id)
    {
        try {
            $assignment = Assignment::with(['classSubject'])->findOrFail($id);
            
            return Inertia::render('Assignments/Edit', [
                'assignment' => $assignment,
                'classSubjects' => ClassSubject::with(['subject', 'class', 'teacher'])->get()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching assignment for edit: ' . $e->getMessage());
            return back()->with('error', 'Assignment not found');
        }
    }

    /**
     * Update the specified assignment
     */
    public function update(Request $request, $id)
    {
        try {
            $assignment = Assignment::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'class_subject_id' => 'required|exists:class_subjects,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'assignment_type' => 'required|in:Homework,Quiz,Exam,Project',
                'total_points' => 'required|integer|min:1',
                'due_date' => 'required|date',
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

            $assignment->update($validator->validated());
            $assignment->load(['classSubject.subject', 'classSubject.class']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $assignment,
                    'message' => 'Assignment updated successfully'
                ]);
            }
            
            return redirect()->route('assignments.index')
                ->with('success', 'Assignment updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating assignment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update assignment',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update assignment')->withInput();
        }
    }

    /**
     * Remove the specified assignment
     */
    public function destroy(Request $request, $id)
    {
        try {
            $assignment = Assignment::findOrFail($id);
            $forceDelete = $request->input('force', false);
            
            $submissionsCount = $assignment->submissions()->count();
            
            if ($submissionsCount > 0 && !$forceDelete) {
                $message = "Cannot delete assignment '{$assignment->title}' because it has {$submissionsCount} submission(s).";
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'data' => [
                            'submissions_count' => $submissionsCount,
                            'suggestion' => 'Please remove all submissions first, or use force delete.'
                        ]
                    ], 400);
                }
                
                return back()->with('error', $message);
            }
            
            if ($submissionsCount > 0 && $forceDelete) {
                $assignment->submissions()->delete();
                Log::warning("Force deleted assignment '{$assignment->title}' with {$submissionsCount} submissions.");
            }
            
            $assignmentTitle = $assignment->title;
            $assignment->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Assignment '{$assignmentTitle}' deleted successfully"
                ]);
            }
            
            return redirect()->route('assignments.index')
                ->with('success', "Assignment '{$assignmentTitle}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting assignment: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete assignment',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete assignment');
        }
    }
}