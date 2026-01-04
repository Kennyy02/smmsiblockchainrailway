<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\AcademicYearController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BlockchainController; // ✅ NEW UNIFIED CONTROLLER
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\ClassSubjectController;
use App\Http\Controllers\CourseMaterialController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SemesterController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentSubmissionController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseYearSubjectController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes - School Management System
|--------------------------------------------------------------------------
|
| All API routes for the school management system.
| These routes are automatically prefixed with /api
|
*/

// ========================================================================
// 🔐 AUTHENTICATION & USER INFO
// ========================================================================

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Get fresh CSRF token for authenticated users
Route::middleware('auth:sanctum')->get('/csrf-token', function (Request $request) {
    return response()->json([
        'success' => true,
        'csrf_token' => csrf_token(),
    ]);
});

// ========================================================================
// 🔐 PROTECTED API ROUTES - REQUIRE AUTHENTICATION
// ========================================================================

Route::middleware('auth:sanctum')->group(function () {

// ========================================================================
// 👤 USER MANAGEMENT (Admin Only)
// ========================================================================

Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}/role', [UserController::class, 'updateRole']);
});

// ========================================================================
// 📚 ACADEMIC STRUCTURE
// ========================================================================

// Academic Years
Route::prefix('academic-years')->group(function () {
    Route::get('/', [AcademicYearController::class, 'index']);
    Route::post('/', [AcademicYearController::class, 'store']);
    Route::get('/current', [AcademicYearController::class, 'getCurrent']);
    Route::get('/active', [AcademicYearController::class, 'getActive']);
    Route::get('/stats', [AcademicYearController::class, 'getStats']);
    Route::get('/{id}', [AcademicYearController::class, 'show']);
    Route::put('/{id}', [AcademicYearController::class, 'update']);
    Route::delete('/{id}', [AcademicYearController::class, 'destroy']);
    Route::post('/{id}/activate', [AcademicYearController::class, 'activate']);
    Route::post('/{id}/deactivate', [AcademicYearController::class, 'deactivate']);
    Route::post('/{id}/archive', [AcademicYearController::class, 'archive']);
});

// Courses (Academic Programs)
Route::prefix('courses')->group(function () {
    Route::get('/', [CourseController::class, 'index']);
    Route::get('/active', [CourseController::class, 'getActive']);
    Route::get('/stats', [CourseController::class, 'getStats']);
    Route::post('/', [CourseController::class, 'store']);
    Route::get('/{id}', [CourseController::class, 'show']);
    Route::put('/{id}', [CourseController::class, 'update']);
    Route::delete('/{id}', [CourseController::class, 'destroy']);
});

// Course-Year-Subject Links (Curriculum Structure)
Route::prefix('course-year-subjects')->group(function () {
    Route::get('/', [CourseYearSubjectController::class, 'index']);
    Route::get('/stats', [CourseYearSubjectController::class, 'getStats']);
    Route::get('/for-course-year', [CourseYearSubjectController::class, 'getSubjectsForCourseYear']);
    Route::get('/available-subjects', [CourseYearSubjectController::class, 'getAvailableSubjects']);
    Route::get('/student-subjects', [CourseYearSubjectController::class, 'getStudentSubjects']);
    Route::post('/', [CourseYearSubjectController::class, 'store']);
    Route::post('/bulk', [CourseYearSubjectController::class, 'bulkStore']);
    Route::get('/{id}', [CourseYearSubjectController::class, 'show']);
    Route::put('/{id}', [CourseYearSubjectController::class, 'update']);
    Route::delete('/{id}', [CourseYearSubjectController::class, 'destroy']);
});

// Semesters
Route::prefix('semesters')->group(function () {
    Route::get('/', [SemesterController::class, 'index']);
    Route::post('/', [SemesterController::class, 'store']);
    Route::get('/current', [SemesterController::class, 'getCurrent']);
    Route::get('/academic-year/{academicYearId}', [SemesterController::class, 'getByAcademicYear']);
    Route::get('/stats', [SemesterController::class, 'getStats']);
    Route::get('/{id}', [SemesterController::class, 'show']);
    Route::put('/{id}', [SemesterController::class, 'update']);
    Route::delete('/{id}', [SemesterController::class, 'destroy']);
    Route::post('/{id}/activate', [SemesterController::class, 'activate']);
    Route::post('/{id}/archive', [SemesterController::class, 'archive']);
});

// Classes (Sections)
Route::prefix('classes')->group(function () {
    Route::get('/stats', [ClassesController::class, 'getStats']);
    Route::get('/{id}/stats', [ClassesController::class, 'getClassStatsById']); 
    Route::get('/', [ClassesController::class, 'index']);
    Route::post('/', [ClassesController::class, 'store']);
    Route::get('/current', [ClassesController::class, 'getCurrent']);
    Route::get('/program/{program}', [ClassesController::class, 'getByProgram']);
    Route::get('/year-level/{yearLevel}', [ClassesController::class, 'getByYearLevel']);
    Route::get('/{id}', [ClassesController::class, 'show']);
    Route::put('/{id}', [ClassesController::class, 'update']);
    Route::delete('/{id}', [ClassesController::class, 'destroy']);
    
    // Student Enrollment Management (within class context)
    Route::get('/{id}/students', [EnrollmentController::class, 'getClassStudents']);
    Route::get('/{id}/available-students', [EnrollmentController::class, 'getAvailableStudents']);
    Route::post('/{id}/enroll', [EnrollmentController::class, 'enrollStudent']);
    Route::post('/{id}/bulk-enroll', [EnrollmentController::class, 'bulkEnrollStudents']);
    Route::delete('/{id}/unenroll/{studentId}', [EnrollmentController::class, 'unenrollStudent']);
    Route::put('/{id}/enrollment/{studentId}', [EnrollmentController::class, 'updateEnrollmentStatus']);
});

// Class Subjects (Teacher-Class-Subject assignments)
Route::prefix('class-subjects')->group(function () {
    Route::get('/', [ClassSubjectController::class, 'index']);
    Route::post('/', [ClassSubjectController::class, 'store']);
    Route::get('/current', [ClassSubjectController::class, 'getCurrent']);
    Route::get('/{id}', [ClassSubjectController::class, 'show']);
    Route::put('/{id}', [ClassSubjectController::class, 'update']);
    Route::delete('/{id}', [ClassSubjectController::class, 'destroy']);
});

// Subjects
Route::prefix('subjects')->group(function () {
    Route::get('/', [SubjectController::class, 'index']);
    Route::post('/', [SubjectController::class, 'store']);
    Route::get('/stats', [SubjectController::class, 'getStats']);
    Route::get('/code/{code}', [SubjectController::class, 'getByCode']);
    Route::get('/popular', [SubjectController::class, 'getPopular']);
    Route::get('/high-pass-rate', [SubjectController::class, 'getHighPassRate']);
    Route::get('/needing-attention', [SubjectController::class, 'getNeedingAttention']);
    Route::get('/{id}', [SubjectController::class, 'show']);
    Route::get('/{id}/detailed-stats', [SubjectController::class, 'getDetailedStats']);
    Route::put('/{id}', [SubjectController::class, 'update']);
    Route::delete('/{id}', [SubjectController::class, 'destroy']);
});

// ========================================================================
// 👥 PEOPLE MANAGEMENT
// ========================================================================

// Teachers
Route::prefix('teachers')->group(function () {
    Route::get('/', [TeacherController::class, 'index']);
    Route::post('/', [TeacherController::class, 'store']);
    Route::get('/department/{departmentId}', [TeacherController::class, 'getByDepartment']);
    Route::get('/stats', [TeacherController::class, 'getStats']);
    Route::get('/{id}', [TeacherController::class, 'show']);
    Route::get('/{id}/subjects', [TeacherController::class, 'getSubjects']);
    Route::get('/{id}/classes', [TeacherController::class, 'getClasses']);
    Route::get('/{id}/schedule', [TeacherController::class, 'getSchedule']);
    Route::put('/{id}', [TeacherController::class, 'update']);
    Route::delete('/{id}', [TeacherController::class, 'destroy']);
});

// Students
Route::prefix('students')->group(function () {
    Route::get('/', [StudentController::class, 'index']);
    Route::post('/', [StudentController::class, 'store']);
    Route::get('/stats', [StudentController::class, 'getStats']);
    Route::get('/{id}', [StudentController::class, 'show']);
    Route::get('/{id}/transcript', [StudentController::class, 'getTranscript']);
    Route::put('/{id}', [StudentController::class, 'update']);
    Route::post('/{id}/drop', [StudentController::class, 'drop']);
    Route::post('/{id}/re-enroll', [StudentController::class, 'reEnroll']);
    Route::delete('/{id}', [StudentController::class, 'destroy']);
});

// Parents
Route::prefix('parents')->group(function () {
    Route::get('/', [ParentController::class, 'index']);
    Route::post('/', [ParentController::class, 'store']);
    Route::get('/stats', [ParentController::class, 'getStats']);
    Route::get('/{id}', [ParentController::class, 'show']);
    Route::get('/{id}/children', [ParentController::class, 'getChildren']);
    Route::get('/{id}/children/{childId}/grades', [ParentController::class, 'getChildGrades']);
    Route::get('/{id}/children/{childId}/attendance', [ParentController::class, 'getChildAttendance']);
    Route::post('/{id}/link-child', [ParentController::class, 'linkChild']);
    Route::post('/{id}/unlink-child/{childId}', [ParentController::class, 'unlinkChild']);
    Route::put('/{id}', [ParentController::class, 'update']);
    Route::delete('/{id}', [ParentController::class, 'destroy']);
});

// ========================================================================
// 📝 ACADEMIC ACTIVITIES
// ========================================================================

// Assignments
Route::prefix('assignments')->group(function () {
    Route::get('/', [AssignmentController::class, 'index']);
    Route::post('/', [AssignmentController::class, 'store']);
    Route::get('/class-subject/{classSubjectId}', [AssignmentController::class, 'getByClassSubject']);
    Route::get('/stats', [AssignmentController::class, 'getStats']);
    Route::get('/{id}', [AssignmentController::class, 'show']);
    Route::put('/{id}', [AssignmentController::class, 'update']);
    Route::delete('/{id}', [AssignmentController::class, 'destroy']);
});

// Student Submissions
Route::prefix('student-submissions')->group(function () {
    Route::get('/stats', [StudentSubmissionController::class, 'getStats']); 
    Route::get('/', [StudentSubmissionController::class, 'index']); 
    Route::post('/', [StudentSubmissionController::class, 'store']); 
    Route::get('/{id}', [StudentSubmissionController::class, 'show']); 
    Route::put('/{id}', [StudentSubmissionController::class, 'update']);
    Route::put('/{id}/grade', [StudentSubmissionController::class, 'grade']);
    Route::delete('/{id}', [StudentSubmissionController::class, 'destroy']);
});

// Grades
Route::prefix('grades')->group(function () {
    Route::get('/', [GradeController::class, 'index']);
    Route::post('/', [GradeController::class, 'store']);
    Route::get('/student/{studentId}', [GradeController::class, 'getByStudent']);
    Route::get('/class-subject/{classSubjectId}', [GradeController::class, 'getByClassSubject']);
    Route::get('/stats', [GradeController::class, 'getStats']);
    Route::get('/{id}', [GradeController::class, 'show']);
    Route::put('/{id}', [GradeController::class, 'update']);
    Route::delete('/{id}', [GradeController::class, 'destroy']);
});

// Attendance
Route::prefix('attendance')->group(function () {
    Route::get('/', [AttendanceController::class, 'index']);
    Route::post('/', [AttendanceController::class, 'store']);
    Route::post('/bulk', [AttendanceController::class, 'bulkStore']);
    Route::get('/student/{studentId}', [AttendanceController::class, 'getByStudent']);
    Route::get('/class-subject/{classSubjectId}', [AttendanceController::class, 'getByClassSubject']);
    Route::get('/stats', [AttendanceController::class, 'getStats']);
    Route::get('/{id}', [AttendanceController::class, 'show']);
    Route::put('/{id}', [AttendanceController::class, 'update']);
    Route::delete('/{id}', [AttendanceController::class, 'destroy']);
});

// ========================================================================
// 📚 RESOURCES
// ========================================================================

// Departments
Route::prefix('departments')->group(function () {
    Route::get('/', [DepartmentController::class, 'index']);
    Route::post('/', [DepartmentController::class, 'store']);
    Route::get('/active', [DepartmentController::class, 'getAllActive']);
    Route::get('/stats', [DepartmentController::class, 'getStats']);
    Route::get('/{id}', [DepartmentController::class, 'show']);
    Route::put('/{id}', [DepartmentController::class, 'update']);
    Route::delete('/{id}', [DepartmentController::class, 'destroy']);
});

// Rooms
Route::prefix('rooms')->group(function () {
    Route::get('/', [RoomController::class, 'index']);
    Route::post('/', [RoomController::class, 'store']);
    Route::get('/available', [RoomController::class, 'getAllAvailable']);
    Route::get('/type/{type}', [RoomController::class, 'getByType']);
    Route::post('/check-availability', [RoomController::class, 'checkAvailability']);
    Route::get('/stats', [RoomController::class, 'getStats']);
    Route::get('/{id}', [RoomController::class, 'show']);
    Route::put('/{id}', [RoomController::class, 'update']);
    Route::delete('/{id}', [RoomController::class, 'destroy']);
});

// Course Materials (now subject-based)
Route::prefix('course-materials')->group(function () {
    Route::get('/', [CourseMaterialController::class, 'index'])->name('course-materials.index');
    Route::get('/subjects', [CourseMaterialController::class, 'getSubjects'])->name('course-materials.subjects');
    Route::post('/', [CourseMaterialController::class, 'store'])->name('course-materials.store');
    Route::get('/{id}', [CourseMaterialController::class, 'show'])->name('course-materials.show');
    Route::get('/{id}/download', [CourseMaterialController::class, 'download'])->name('course-materials.download');
    Route::put('/{id}', [CourseMaterialController::class, 'update'])->name('course-materials.update');
    Route::delete('/{id}', [CourseMaterialController::class, 'destroy'])->name('course-materials.destroy');
});

// Library (Books)
Route::prefix('library')->group(function () {
    Route::get('/', [LibraryController::class, 'index']);
    Route::post('/', [LibraryController::class, 'store']);
    Route::get('/stats', [LibraryController::class, 'getStats']);
    Route::get('/{id}', [LibraryController::class, 'show']);
    Route::put('/{id}', [LibraryController::class, 'update']);
    Route::delete('/{id}', [LibraryController::class, 'destroy']);
});

// Categories
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/active', [CategoryController::class, 'getActive']);
    Route::get('/stats', [CategoryController::class, 'getStats']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::get('/{id}', [CategoryController::class, 'show']);
    Route::put('/{id}', [CategoryController::class, 'update']);
    Route::delete('/{id}', [CategoryController::class, 'destroy']);
});

// ========================================================================
// 💬 COMMUNICATION
// ========================================================================

// Announcements
Route::prefix('announcements')->group(function () {
    Route::get('/', [AnnouncementController::class, 'index']);
    Route::post('/', [AnnouncementController::class, 'store']);
    Route::get('/published/{audience}', [AnnouncementController::class, 'getPublishedForUser']);
    Route::get('/stats', [AnnouncementController::class, 'getStats']);
    Route::get('/{id}', [AnnouncementController::class, 'show']);
    Route::put('/{id}', [AnnouncementController::class, 'update']);
    Route::delete('/{id}', [AnnouncementController::class, 'destroy']);
});

// Messages
Route::prefix('messages')->group(function () {
    Route::get('/', [MessageController::class, 'index']);
    Route::post('/', [MessageController::class, 'store']);
    Route::get('/unread', [MessageController::class, 'getUnread']);
    Route::get('/conversation/{userId}', [MessageController::class, 'getConversation']);
    Route::get('/conversations', [MessageController::class, 'getConversations']);
    Route::get('/stats', [MessageController::class, 'getStats']);
    Route::get('/{id}', [MessageController::class, 'show']);
    Route::post('/{id}/read', [MessageController::class, 'markAsRead']);
    Route::post('/{id}/reply', [MessageController::class, 'reply']);
    Route::post('/mark-all-read', [MessageController::class, 'markAllAsRead']);
    Route::delete('/{id}', [MessageController::class, 'destroy']);
});

// Contact Messages (Admin management - protected routes)
Route::prefix('contact-messages')->group(function () {
    Route::get('/', [ContactMessageController::class, 'index']);
    Route::get('/stats', [ContactMessageController::class, 'getStats']);
    Route::get('/{contactMessage}', [ContactMessageController::class, 'show']);
    Route::put('/{contactMessage}', [ContactMessageController::class, 'update']);
    Route::delete('/{contactMessage}', [ContactMessageController::class, 'destroy']);
    Route::post('/mark-read', [ContactMessageController::class, 'markAsRead']);
});

// ========================================================================
// 🔐 UNIFIED BLOCKCHAIN MANAGEMENT
// All blockchain and certificate functionality in one place
// ========================================================================

Route::prefix('blockchain')->group(function () {
    
    // Statistics
    Route::get('/stats', [BlockchainController::class, 'getStats']);

    // Blockchain Transactions
    Route::prefix('transactions')->group(function () {
        Route::get('/', [BlockchainController::class, 'getTransactions']);
        Route::get('/{id}', [BlockchainController::class, 'getTransaction']);
        Route::post('/{id}/retry', [BlockchainController::class, 'retryTransaction']);
        Route::delete('/{id}', [BlockchainController::class, 'deleteTransaction']);
    });

    // Certificates
    Route::prefix('certificates')->group(function () {
        Route::get('/', [BlockchainController::class, 'getCertificates']);
        Route::post('/', [BlockchainController::class, 'createCertificate']);
        Route::get('/{id}', [BlockchainController::class, 'getCertificate']);
        Route::put('/{id}', [BlockchainController::class, 'updateCertificate']);
        Route::post('/{id}/register', [BlockchainController::class, 'registerCertificateOnBlockchain']);
        Route::delete('/{id}', [BlockchainController::class, 'deleteCertificate']);
    });
    
    // Verification History
    Route::prefix('verifications')->group(function () {
        Route::get('/', [BlockchainController::class, 'getVerificationHistory']);
        Route::delete('/{id}', [BlockchainController::class, 'deleteVerificationRecord']);
    });
});

// ========================================================================
// 🌐 PUBLIC API ROUTES
// ========================================================================

// Certificate Verification (Public - No Auth Required)
Route::post('/blockchain/verify', [BlockchainController::class, 'verifyCertificate']);

// ========================================================================
// 📊 ANALYTICS & REPORTING
// ========================================================================

Route::prefix('analytics')->group(function () {
    Route::get('/overview', function () {
        return response()->json([
            'success' => true,
            'data' => [
                'students' => [
                    'total' => \App\Models\Student::count(),
                    'active' => \App\Models\Student::where('status', 'active')->count(),
                    'by_year_level' => \App\Models\Student::selectRaw('year_level, COUNT(*) as count')
                        ->groupBy('year_level')
                        ->get()
                ],
                'teachers' => [
                    'total' => \App\Models\Teacher::count(),
                    'active' => \App\Models\Teacher::where('status', 'active')->count(),
                ],
                'classes' => [
                    'total' => \App\Models\Classes::count(),
                    'current' => \App\Models\Classes::current()->count(),
                ],
                'subjects' => [
                    'total' => \App\Models\Subject::count(),
                ],
                'certificates' => [
                    'total' => \App\Models\Certificate::count(),
                    'verified' => \App\Models\Certificate::where('blockchain_hash', '!=', null)->count(),
                ]
            ]
        ]);
    });

    Route::get('/student-performance', function () {
        $averageGrade = \App\Models\Grade::avg('final_rating');
        $totalGrades = \App\Models\Grade::count();
        $passedGrades = \App\Models\Grade::where('remarks', 'Passed')->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'average_grade' => round($averageGrade, 2),
                'pass_rate' => $totalGrades > 0 ? round(($passedGrades / $totalGrades) * 100, 2) : 0,
                'total_grades' => $totalGrades,
            ]
        ]);
    });

    Route::get('/attendance-summary', function () {
        $total = \App\Models\Attendance::count();
        $present = \App\Models\Attendance::where('status', 'Present')->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_records' => $total,
                'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 2) : 0,
                'by_status' => \App\Models\Attendance::selectRaw('status, COUNT(*) as count')
                    ->groupBy('status')
                    ->get()
            ]
        ]);
    });

    Route::get('/teacher-load', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Teacher::withCount('classSubjects')
                ->having('class_subjects_count', '>', 0)
                ->orderBy('class_subjects_count', 'desc')
                ->limit(20)
                ->get()
        ]);
    });

    Route::get('/room-utilization', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Room::withCount('classSubjects')
                ->get()
        ]);
    });

    Route::get('/departments', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\Department::withCount(['teachers', 'subjects'])
                ->get()
        ]);
    });
});

// ========================================================================
// 🔍 SEARCH & FILTERS
// ========================================================================

Route::prefix('search')->group(function () {
    Route::get('/global', function (Request $request) {
        $query = $request->get('q');
        
        if (!$query) {
            return response()->json(['success' => false, 'message' => 'Query required'], 400);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'students' => \App\Models\Student::where('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('student_id', 'like', "%{$query}%")
                    ->limit(10)
                    ->get(),
                'teachers' => \App\Models\Teacher::where('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('employee_id', 'like', "%{$query}%")
                    ->limit(10)
                    ->get(),
                'subjects' => \App\Models\Subject::where('name', 'like', "%{$query}%")
                    ->orWhere('code', 'like', "%{$query}%")
                    ->limit(10)
                    ->get(),
            ]
        ]);
    });
});

}); // End of auth:sanctum middleware group

// ========================================================================
// 🌐 PUBLIC API ROUTES - NO AUTHENTICATION REQUIRED
// ========================================================================

// Contact Form Submission (Public - anyone can submit)
Route::post('/contact-messages', [ContactMessageController::class, 'store']);