<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard API Routes
|--------------------------------------------------------------------------
|
| Comprehensive dashboard summary endpoint
| This provides counts for all modules in the admin dashboard
|
*/

Route::prefix('dashboard')->group(function () {
    
    /**
     * Get Dashboard Summary
     * Returns comprehensive counts for all modules
     * 
     * GET /api/dashboard/summary
     */
    Route::get('/summary', function () {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    // ==================================================
                    // 👥 PEOPLE MANAGEMENT
                    // ==================================================
                    'students' => [
                        'total' => \App\Models\Student::count(),
                        'active' => \App\Models\Student::where('status', 'active')->count(),
                        'inactive' => \App\Models\Student::where('status', '!=', 'active')->count(),
                    ],
                    'teachers' => [
                        'total' => \App\Models\Teacher::count(),
                        'active' => \App\Models\Teacher::where('status', 'active')->count(),
                        'inactive' => \App\Models\Teacher::where('status', '!=', 'active')->count(),
                    ],
                    'parents' => [
                        'total' => \App\Models\ParentModel::count(),
                        'active' => \App\Models\ParentModel::where('status', 'active')->count(),
                    ],
                    'users' => [
                        'total' => \App\Models\User::count(),
                        'active' => \App\Models\User::whereNotNull('email_verified_at')->count(),
                    ],

                    // ==================================================
                    // 📚 ACADEMIC STRUCTURE
                    // ==================================================
                    'academic_years' => [
                        'total' => \App\Models\AcademicYear::count(),
                        'current' => \App\Models\AcademicYear::where('status', 'active')->count(),
                    ],
                    'semesters' => [
                        'total' => \App\Models\Semester::count(),
                        'current' => \App\Models\Semester::where('status', 'active')->count(),
                    ],
                    'classes' => [
                        'total' => \App\Models\Classes::count(),
                        'active' => \App\Models\Classes::where('status', 'active')->count(),
                    ],
                    'subjects' => [
                        'total' => \App\Models\Subject::count(),
                        'active' => \App\Models\Subject::where('status', 'active')->count(),
                    ],
                    'class_subjects' => [
                        'total' => \App\Models\ClassSubject::count(),
                    ],

                    // ==================================================
                    // 📝 ACADEMIC ACTIVITIES
                    // ==================================================
                    'assignments' => [
                        'total' => \App\Models\Assignment::count(),
                        'pending' => \App\Models\Assignment::where('status', 'pending')->count(),
                        'graded' => \App\Models\Assignment::where('status', 'graded')->count(),
                    ],
                    'submissions' => [
                        'total' => \App\Models\StudentSubmission::count(),
                        'submitted' => \App\Models\StudentSubmission::where('status', 'submitted')->count(),
                        'pending' => \App\Models\StudentSubmission::where('status', 'pending')->count(),
                    ],
                    'grades' => [
                        'total' => \App\Models\Grade::count(),
                        'passed' => \App\Models\Grade::where('remarks', 'Passed')->count(),
                        'failed' => \App\Models\Grade::where('remarks', 'Failed')->count(),
                    ],
                    'attendance' => [
                        'total' => \App\Models\Attendance::count(),
                        'present' => \App\Models\Attendance::where('status', 'Present')->count(),
                        'absent' => \App\Models\Attendance::where('status', 'Absent')->count(),
                        'rate' => function() {
                            $total = \App\Models\Attendance::count();
                            $present = \App\Models\Attendance::where('status', 'Present')->count();
                            return $total > 0 ? round(($present / $total) * 100, 2) : 0;
                        }
                    ],

                    // ==================================================
                    // 💬 RESOURCES & COMMUNICATION
                    // ==================================================
                    'course_materials' => [
                        'total' => \App\Models\CourseMaterial::count(),
                    ],
                    'announcements' => [
                        'total' => \App\Models\Announcement::count(),
                        'published' => \App\Models\Announcement::where('status', 'published')->count(),
                    ],
                    'messages' => [
                        'total' => \App\Models\Message::count(),
                        'unread' => \App\Models\Message::where('is_read', false)->count(),
                    ],

                    // ==================================================
                    // 🔐 BLOCKCHAIN & CERTIFICATES
                    // ==================================================
                    'certificates' => [
                        'total' => \App\Models\Certificate::count(),
                        'verified' => \App\Models\Certificate::whereNotNull('blockchain_hash')->count(),
                    ],
                    'blockchain_transactions' => [
                        'total' => \App\Models\BlockchainTransaction::count(),
                        'confirmed' => \App\Models\BlockchainTransaction::where('status', 'confirmed')->count(),
                        'pending' => \App\Models\BlockchainTransaction::where('status', 'pending')->count(),
                    ],
                ],
                'timestamp' => now()->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            \Log::error('Dashboard summary error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard summary',
                'error' => $e->getMessage(),
            ], 500);
        }
    });

    /**
     * Get Dashboard Statistics (Alternative detailed view)
     * 
     * GET /api/dashboard/stats
     */
    Route::get('/stats', function () {
        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_people' => \App\Models\Student::count() + \App\Models\Teacher::count() + \App\Models\ParentModel::count(),
                    'total_academics' => \App\Models\Assignment::count() + \App\Models\Grade::count(),
                    'total_communications' => \App\Models\Message::count() + \App\Models\Announcement::count(),
                ],
                'trends' => [
                    'students_this_month' => \App\Models\Student::whereMonth('created_at', now()->month)->count(),
                    'assignments_this_week' => \App\Models\Assignment::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                    'attendance_today' => \App\Models\Attendance::whereDate('date', today())->count(),
                ],
            ],
        ]);
    });
});