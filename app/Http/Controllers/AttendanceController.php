<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Student;
use App\Models\ClassSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Display a listing of attendance records
     */
    public function index(Request $request)
    {
        try {
            $query = Attendance::with([
                'student.user',
                'classSubject.subject',
                'classSubject.class'
            ]);
            
            // Apply student filter (accept both integer and string)
            if ($studentId = $request->input('student_id')) {
                $studentId = (int)$studentId;
                Log::info('Attendance index: Filtering by student_id', ['student_id' => $studentId]);
                $query->byStudent($studentId);
                
                // Debug: Check if any records exist for this student
                $countBeforeFilters = Attendance::where('student_id', $studentId)->count();
                Log::info('Attendance index: Total records for student before other filters', ['count' => $countBeforeFilters, 'student_id' => $studentId]);
            }
            
            // Apply class subject filter
            if ($classSubjectId = $request->input('class_subject_id')) {
                $query->byClassSubject($classSubjectId);
            }
            
            // Apply status filter (only if not empty)
            if ($status = $request->input('status')) {
                if (!empty($status)) {
                    $query->byStatus($status);
                }
            }
            
            // Apply date range filter (only if values are provided and not empty)
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            
            if (!empty($startDate) && !empty($endDate)) {
                // Both dates provided - use date range
                $query->byDateRange($startDate, $endDate);
            } elseif (!empty($startDate)) {
                // Only start date provided
                $query->where('attendance_date', '>=', $startDate);
            } elseif (!empty($endDate)) {
                // Only end date provided - show all records up to and including this date
                $query->where('attendance_date', '<=', $endDate);
            }
            
            // Apply specific date filter
            if ($date = $request->input('date')) {
                $query->where('attendance_date', $date);
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'attendance_date');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Check if request expects JSON
            if ($request->expectsJson()) {
                // Debug: Log the SQL query
                $sql = $query->toSql();
                $bindings = $query->getBindings();
                Log::info('Attendance index: Query executed', [
                    'sql' => $sql,
                    'bindings' => $bindings,
                    'student_id' => $request->input('student_id'),
                    'class_subject_id' => $request->input('class_subject_id'),
                    'start_date' => $request->input('start_date'),
                    'end_date' => $request->input('end_date'),
                ]);
                
                if ($request->input('paginate', true)) {
                    $perPage = $request->input('per_page', 15);
                    $attendance = $query->paginate($perPage);
                    
                    Log::info('Attendance index: Results', [
                        'total' => $attendance->total(),
                        'count' => $attendance->count(),
                        'student_id' => $request->input('student_id'),
                    ]);
                    
                    return response()->json([
                        'success' => true,
                        'data' => $attendance->items(),
                        'pagination' => [
                            'current_page' => $attendance->currentPage(),
                            'last_page' => $attendance->lastPage(),
                            'per_page' => $attendance->perPage(),
                            'total' => $attendance->total()
                        ]
                    ]);
                } else {
                    $attendance = $query->get();
                    Log::info('Attendance index: Results (no pagination)', [
                        'count' => $attendance->count(),
                        'student_id' => $request->input('student_id'),
                    ]);
                    return response()->json([
                        'success' => true,
                        'data' => $attendance
                    ]);
                }
            }
            
            // Return Inertia view
            $perPage = $request->input('per_page', 15);
            $attendance = $query->paginate($perPage);
            
            return Inertia::render('Attendance/Index', [
                'attendance' => $attendance,
                'students' => Student::with('user')->get(),
                'classSubjects' => ClassSubject::with(['subject', 'class'])->get(),
                'filters' => $request->only(['student_id', 'class_subject_id', 'status', 'start_date', 'end_date', 'date', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve attendance',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve attendance');
        }
    }

    /**
     * Get attendance by student
     */
    public function getByStudent($studentId)
    {
        try {
            $attendance = Attendance::byStudent($studentId)
                ->with([
                    'classSubject.subject',
                    'classSubject.class'
                ])
                ->orderBy('attendance_date', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $attendance
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance by student: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance by class subject and date
     */
    public function getByClassSubjectAndDate(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'class_subject_id' => 'required|exists:class_subjects,id',
                'date' => 'required|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $attendance = Attendance::where('class_subject_id', $request->class_subject_id)
                ->where('attendance_date', $request->date)
                ->with('student.user')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $attendance
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance by class and date: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance statistics for a student
     */
    public function getStudentStats($studentId, Request $request)
    {
        try {
            $classSubjectId = $request->input('class_subject_id');
            
            if (!$classSubjectId) {
                return response()->json([
                    'success' => false,
                    'message' => 'class_subject_id is required'
                ], 422);
            }
            
            $stats = Attendance::getAttendanceStats($studentId, $classSubjectId);
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student attendance stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get overall attendance statistics
     */
    public function getStats(Request $request)
    {
        try {
            $query = Attendance::query();
            
            // Apply student filter if provided (accept both integer and string)
            if ($studentId = $request->input('student_id')) {
                $query->byStudent((int)$studentId);
            }
            
            // Apply filters if provided
            if ($classSubjectId = $request->input('class_subject_id')) {
                $query->byClassSubject($classSubjectId);
            }
            if ($startDate = $request->input('start_date')) {
                if ($endDate = $request->input('end_date')) {
                    $query->byDateRange($startDate, $endDate);
                }
            }
            
            $totalRecords = $query->count();
            $presentCount = $query->clone()->present()->count();
            $absentCount = $query->clone()->absent()->count();
            $lateCount = $query->clone()->late()->count();
            $excusedCount = $query->clone()->excused()->count();
            
            $attendanceRate = $totalRecords > 0 ? round(($presentCount / $totalRecords) * 100, 2) : 0;
            
            // Build stats query with same filters
            $statsQuery = Attendance::query();
            if ($studentId = $request->input('student_id')) {
                $statsQuery->byStudent((int)$studentId);
            }
            if ($classSubjectId = $request->input('class_subject_id')) {
                $statsQuery->byClassSubject($classSubjectId);
            }
            if ($startDate = $request->input('start_date')) {
                if ($endDate = $request->input('end_date')) {
                    $statsQuery->byDateRange($startDate, $endDate);
                }
            }
            
            $attendanceByStatus = $statsQuery->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_records' => $totalRecords,
                    'present_count' => $presentCount,
                    'absent_count' => $absentCount,
                    'late_count' => $lateCount,
                    'excused_count' => $excusedCount,
                    'attendance_rate' => $attendanceRate,
                    'attendance_by_status' => $attendanceByStatus
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating attendance
     */
    public function create()
    {
        return Inertia::render('Attendance/Create', [
            'students' => Student::with('user')->get(),
            'classSubjects' => ClassSubject::with(['subject', 'class'])->get()
        ]);
    }

    /**
     * Store attendance record(s)
     */
    public function store(Request $request)
    {
        try {
            // Support both single and bulk attendance creation
            $isBulk = $request->has('attendance_records');
            
            if ($isBulk) {
                // Bulk attendance creation
                $validator = Validator::make($request->all(), [
                    'attendance_records' => 'required|array',
                    'attendance_records.*.class_subject_id' => 'required|exists:class_subjects,id',
                    'attendance_records.*.student_id' => 'required|exists:students,id',
                    'attendance_records.*.attendance_date' => 'required|date',
                    'attendance_records.*.status' => 'required|in:Present,Absent,Late,Excused',
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

                DB::beginTransaction();
                try {
                    $attendanceRecords = [];
                    foreach ($request->attendance_records as $record) {
                        // Check if record already exists
                        $existing = Attendance::where('class_subject_id', $record['class_subject_id'])
                            ->where('student_id', $record['student_id'])
                            ->where('attendance_date', $record['attendance_date'])
                            ->first();
                        
                        if ($existing) {
                            $existing->update(['status' => $record['status']]);
                            $attendanceRecords[] = $existing;
                        } else {
                            $attendanceRecords[] = Attendance::create($record);
                        }
                    }
                    DB::commit();
                    
                    if ($request->expectsJson()) {
                        return response()->json([
                            'success' => true,
                            'data' => $attendanceRecords,
                            'message' => count($attendanceRecords) . ' attendance records saved successfully'
                        ], 201);
                    }
                    
                    return redirect()->route('attendance.index')
                        ->with('success', count($attendanceRecords) . ' attendance records saved successfully');
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            } else {
                // Single attendance creation
                $validator = Validator::make($request->all(), [
                    'class_subject_id' => 'required|exists:class_subjects,id',
                    'student_id' => 'required|exists:students,id',
                    'attendance_date' => 'required|date',
                    'status' => 'required|in:Present,Absent,Late,Excused',
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

                // Check if record already exists
                $existing = Attendance::where('class_subject_id', $request->class_subject_id)
                    ->where('student_id', $request->student_id)
                    ->where('attendance_date', $request->attendance_date)
                    ->first();
                
                if ($existing) {
                    $existing->update(['status' => $request->status]);
                    $attendance = $existing;
                } else {
                    $attendance = Attendance::create($validator->validated());
                }
                
                $attendance->load(['student.user', 'classSubject.subject', 'classSubject.class']);
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => true,
                        'data' => $attendance,
                        'message' => 'Attendance recorded successfully'
                    ], 201);
                }
                
                return redirect()->route('attendance.index')
                    ->with('success', 'Attendance recorded successfully');
            }
        } catch (\Exception $e) {
            Log::error('Error creating attendance: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to record attendance',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to record attendance')->withInput();
        }
    }

    /**
     * Display the specified attendance
     */
    public function show(Request $request, $id)
    {
        try {
            $attendance = Attendance::with([
                'student.user',
                'classSubject.subject',
                'classSubject.class',
                'classSubject.teacher'
            ])->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $attendance
                ]);
            }
            
            return Inertia::render('Attendance/Show', [
                'attendance' => $attendance
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance record not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Attendance record not found');
        }
    }

    /**
     * Show the form for editing the specified attendance
     */
    public function edit($id)
    {
        try {
            $attendance = Attendance::with([
                'student',
                'classSubject'
            ])->findOrFail($id);
            
            return Inertia::render('Attendance/Edit', [
                'attendance' => $attendance,
                'students' => Student::with('user')->get(),
                'classSubjects' => ClassSubject::with(['subject', 'class'])->get()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching attendance for edit: ' . $e->getMessage());
            return back()->with('error', 'Attendance record not found');
        }
    }

    /**
     * Update the specified attendance
     */
    public function update(Request $request, $id)
    {
        try {
            $attendance = Attendance::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'class_subject_id' => 'required|exists:class_subjects,id',
                'student_id' => 'required|exists:students,id',
                'attendance_date' => 'required|date',
                'status' => 'required|in:Present,Absent,Late,Excused',
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

            $attendance->update($validator->validated());
            $attendance->load(['student.user', 'classSubject.subject', 'classSubject.class']);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $attendance,
                    'message' => 'Attendance updated successfully'
                ]);
            }
            
            return redirect()->route('attendance.index')
                ->with('success', 'Attendance updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating attendance: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update attendance',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update attendance')->withInput();
        }
    }

    /**
     * Remove the specified attendance
     */
    public function destroy(Request $request, $id)
    {
        try {
            $attendance = Attendance::findOrFail($id);
            
            $studentName = $attendance->student->first_name . ' ' . $attendance->student->last_name;
            $date = $attendance->attendance_date->format('Y-m-d');
            
            $attendance->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Attendance record for {$studentName} on {$date} deleted successfully"
                ]);
            }
            
            return redirect()->route('attendance.index')
                ->with('success', "Attendance record deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting attendance: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete attendance',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete attendance');
        }
    }
}