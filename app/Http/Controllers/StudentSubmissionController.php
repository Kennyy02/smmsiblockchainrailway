<?php

namespace App\Http\Controllers;

use App\Models\StudentSubmission;
use App\Models\Assignment;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class StudentSubmissionController extends Controller
{
    /**
     * Display a listing of submissions
     */
    public function index(Request $request)
    {
        try {
            $query = StudentSubmission::with([
                'assignment.classSubject.subject',
                'assignment.classSubject.class',
                'student.user'
            ]);
            
            // Apply assignment filter
            if ($assignmentId = $request->input('assignment_id')) {
                $query->where('assignment_id', $assignmentId);
            }
            
            // Apply student filter
            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            
            // Apply status filter
            if ($status = $request->input('status')) {
                match($status) {
                    'submitted' => $query->submitted(),
                    'graded' => $query->graded(),
                    'ungraded' => $query->ungraded(),
                    'pending' => $query->pending(),
                    default => null
                };
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'submitted_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Check if request expects JSON
            if ($request->expectsJson()) {
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $submissions = $query->paginate($perPage);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $submissions->items(),
                        'pagination' => [
                            'current_page' => $submissions->currentPage(),
                            'last_page' => $submissions->lastPage(),
                            'per_page' => $submissions->perPage(),
                            'total' => $submissions->total()
                        ]
                    ]);
                } else {
                    $submissions = $query->get();
                    return response()->json([
                        'success' => true,
                        'data' => $submissions
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $submissions = $query->paginate($perPage);
            
            return Inertia::render('Submissions/Index', [
                'submissions' => $submissions,
                'assignments' => Assignment::with(['classSubject.subject'])->get(),
                'students' => Student::with('user')->get(),
                'filters' => $request->only(['assignment_id', 'student_id', 'status', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submissions: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve submissions',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve submissions');
        }
    }

    /**
     * Get submissions by assignment
     */
    public function getByAssignment($assignmentId)
    {
        try {
            $submissions = StudentSubmission::where('assignment_id', $assignmentId)
                ->with(['student.user'])
                ->orderBy('submitted_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $submissions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submissions by assignment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve submissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get submissions by student
     */
    public function getByStudent($studentId)
    {
        try {
            $submissions = StudentSubmission::byStudent($studentId)
                ->with([
                    'assignment.classSubject.subject',
                    'assignment.classSubject.class'
                ])
                ->orderBy('submitted_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $submissions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submissions by student: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve submissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ungraded submissions
     */
    public function getUngraded(Request $request)
    {
        try {
            $query = StudentSubmission::ungraded()
                ->with([
                    'assignment.classSubject.subject',
                    'assignment.classSubject.class',
                    'student.user'
                ]);
            
            // Apply assignment filter if provided
            if ($assignmentId = $request->input('assignment_id')) {
                $query->where('assignment_id', $assignmentId);
            }
            
            $submissions = $query->orderBy('submitted_at', 'asc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $submissions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching ungraded submissions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve ungraded submissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get submission statistics
     */
    public function getStats(Request $request)
    {
        try {
            $query = StudentSubmission::query();
            
            // Apply filters if provided
            if ($assignmentId = $request->input('assignment_id')) {
                $query->where('assignment_id', $assignmentId);
            }
            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            
            $totalSubmissions = $query->count();
            $submittedCount = $query->clone()->submitted()->count();
            $gradedCount = $query->clone()->graded()->count();
            $ungradedCount = $query->clone()->ungraded()->count();
            $pendingCount = $query->clone()->pending()->count();
            
            $avgScore = $query->clone()->graded()->avg('score');
            
            $lateSubmissions = $query->clone()->submitted()->get()->filter(function($submission) {
                return $submission->isLate();
            })->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_submissions' => $totalSubmissions,
                    'submitted_count' => $submittedCount,
                    'graded_count' => $gradedCount,
                    'ungraded_count' => $ungradedCount,
                    'pending_count' => $pendingCount,
                    'late_submissions' => $lateSubmissions,
                    'average_score' => round($avgScore ?? 0, 2)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submission stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve submission stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new submission
     */
    public function create()
    {
        return Inertia::render('Submissions/Create', [
            'assignments' => Assignment::with(['classSubject.subject', 'classSubject.class'])->get(),
            'students' => Student::with('user')->get()
        ]);
    }

    /**
     * Store a newly created submission
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:assignments,id',
                'student_id' => 'required|exists:students,id',
                'submission_text' => 'nullable|string',
                'submitted_at' => 'nullable|date',
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

            $data = $validator->validated();
            
            // If submitted_at is not provided but submission_text is, set submitted_at to now
            if (!isset($data['submitted_at']) && isset($data['submission_text'])) {
                $data['submitted_at'] = now();
            }

            $submission = StudentSubmission::create($data);
            $submission->load(['assignment.classSubject.subject', 'student.user']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $submission,
                    'message' => 'Submission created successfully'
                ], 201);
            }
            
            return redirect()->route('submissions.index')
                ->with('success', 'Submission created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating submission: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create submission',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create submission')->withInput();
        }
    }

    /**
     * Display the specified submission
     */
    public function show(Request $request, $id)
    {
        try {
            $submission = StudentSubmission::with([
                'assignment.classSubject.subject',
                'assignment.classSubject.class',
                'assignment.classSubject.teacher',
                'student.user'
            ])->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $submission
                ]);
            }
            
            return Inertia::render('Submissions/Show', [
                'submission' => $submission
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submission: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Submission not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Submission not found');
        }
    }

    /**
     * Show the form for editing the specified submission
     */
    public function edit($id)
    {
        try {
            $submission = StudentSubmission::with([
                'assignment',
                'student'
            ])->findOrFail($id);
            
            return Inertia::render('Submissions/Edit', [
                'submission' => $submission,
                'assignments' => Assignment::with(['classSubject.subject', 'classSubject.class'])->get(),
                'students' => Student::with('user')->get()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching submission for edit: ' . $e->getMessage());
            return back()->with('error', 'Submission not found');
        }
    }

    /**
     * Update the specified submission
     */
    public function update(Request $request, $id)
    {
        try {
            $submission = StudentSubmission::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'assignment_id' => 'required|exists:assignments,id',
                'student_id' => 'required|exists:students,id',
                'submission_text' => 'nullable|string',
                'submitted_at' => 'nullable|date',
                'score' => 'nullable|numeric|min:0',
                'teacher_feedback' => 'nullable|string',
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

            $submission->update($validator->validated());
            $submission->load(['assignment.classSubject.subject', 'student.user']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $submission,
                    'message' => 'Submission updated successfully'
                ]);
            }
            
            return redirect()->route('submissions.index')
                ->with('success', 'Submission updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating submission: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update submission',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update submission')->withInput();
        }
    }

    /**
     * Grade a submission
     */
    public function grade(Request $request, $id)
    {
        try {
            $submission = StudentSubmission::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'score' => 'required|numeric|min:0',
                'teacher_feedback' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate score against assignment total_points
            if ($request->score > $submission->assignment->total_points) {
                return response()->json([
                    'success' => false,
                    'message' => "Score cannot exceed {$submission->assignment->total_points} points"
                ], 422);
            }

            $submission->update([
                'score' => $request->score,
                'teacher_feedback' => $request->teacher_feedback
            ]);
            
            $submission->load(['assignment', 'student.user']);
            
            return response()->json([
                'success' => true,
                'data' => $submission,
                'message' => 'Submission graded successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error grading submission: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to grade submission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified submission
     */
    public function destroy(Request $request, $id)
    {
        try {
            $submission = StudentSubmission::findOrFail($id);
            
            $studentName = $submission->student->first_name . ' ' . $submission->student->last_name;
            $assignmentTitle = $submission->assignment->title;
            
            $submission->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Submission by {$studentName} for '{$assignmentTitle}' deleted successfully"
                ]);
            }
            
            return redirect()->route('submissions.index')
                ->with('success', "Submission deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting submission: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete submission',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete submission');
        }
    }
}