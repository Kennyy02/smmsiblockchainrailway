<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ==================== PUBLIC ROUTES ====================
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public Certificate Verification Page
Route::get('/verify-certificate', function () {
    return Inertia::render('Public/CertificateVerification');
})->name('verify-certificate.show');

// ==================== ADMIN ROUTES ====================
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');
    
    // ==================== ACADEMIC MANAGEMENT ====================
    
    // Academic Years
    Route::get('/academic-years', function () {
        return Inertia::render('Admin/AcademicYears');
    })->name('academic-years');
    
    // Semesters
    Route::get('/semesters', function () {
        return Inertia::render('Admin/Semesters');
    })->name('semesters');
    
 
    // ==================== CURRICULUM MANAGEMENT ====================
    
    // Courses/Programs
    Route::get('/courses', function () {
        return Inertia::render('Admin/Courses');
    })->name('courses');
    
    // Subjects
    Route::get('/subjects', function () {
        return Inertia::render('Admin/Subjects');
    })->name('subjects');
    
    // Classes
    Route::get('/classes', function () {
        return Inertia::render('Admin/Classes');
    })->name('classes');
    
    // View students in a class
    Route::get('/classes/{id}/students', function ($id) {
        return Inertia::render('Admin/Classes', ['viewClassId' => $id]);
    })->name('classes.students');
    
    // Class Subjects (Subject-Class Assignments) - Legacy
    Route::get('/class-subjects', function () {
        return Inertia::render('Admin/ClassSubjects');
    })->name('class-subjects');
    
    // Curriculum Subject Links (Course-Year-Subject)
    Route::get('/curriculum-subjects', function () {
        return Inertia::render('Admin/CourseYearSubjects');
    })->name('curriculum-subjects');
    
    // Library
    Route::get('/library', function () {
        return Inertia::render('Admin/Library');
    })->name('library');
    
    // Categories
    Route::get('/categories', function () {
        return Inertia::render('Admin/Categories');
    })->name('categories');
    
    // ==================== PEOPLE MANAGEMENT ====================
    
    // Teachers
    Route::get('/teachers', function () {
        return Inertia::render('Admin/Teachers');
    })->name('teachers');
    
    // Students
    Route::get('/students', function () {
        return Inertia::render('Admin/Students');
    })->name('students');
    
    // Parents
    Route::get('/parents', function () {
        return Inertia::render('Admin/Parents');
    })->name('parents');
    
    // ==================== COURSE CONTENT MANAGEMENT ====================
    
    // Course Materials
    Route::get('/course-materials', function () {
        return Inertia::render('Admin/CourseMaterials');
    })->name('admin.course-materials');
    
    // ==================== ACADEMIC RECORDS ====================
    
    // Grades
    Route::get('/grades', function () {
        return Inertia::render('Admin/Grades');
    })->name('grades');
    
    // Attendance
    Route::get('/attendance', function () {
        return Inertia::render('Admin/Attendance');
    })->name('attendance');
    
    // ==================== CERTIFICATION & BLOCKCHAIN ====================
    
    // Certificates
    Route::get('/certificates', function () {
        return Inertia::render('Admin/Certificates');
    })->name('certificates');
    
    // Blockchain Transactions
    Route::get('/blockchain-transactions', function () {
        return Inertia::render('Admin/BlockchainTransactions');
    })->name('blockchain-transactions');
    
    // ==================== COMMUNICATION ====================
    
    // Announcements
    Route::get('/announcements', function () {
        return Inertia::render('Admin/Announcements');
    })->name('announcements');
    
    // Messages
    Route::get('/messages', function () {
        return Inertia::render('Admin/Messages');
    })->name('messages');
    
    // Contact Messages (from public contact form)
    Route::get('/contact-messages', function () {
        return Inertia::render('Admin/ContactMessages');
    })->name('contact-messages');
    
    // ==================== USER MANAGEMENT ====================
    
    Route::get('/users', function () {
        return Inertia::render('Admin/Users');
    })->name('users');
    
    // ==================== REPORTS & ANALYTICS ====================
    
    Route::get('/reports', function () {
        return Inertia::render('Admin/Reports');
    })->name('reports');
    
    Route::get('/analytics', function () {
        return Inertia::render('Admin/Analytics');
    })->name('analytics');
    
    // ==================== ACTIVITY LOGS ====================
    
    Route::get('/activity-logs', function () {
        return Inertia::render('Admin/ActivityLogs');
    })->name('activity-logs');
    
    // ==================== SETTINGS ====================
    
    Route::get('/settings', function () {
        return Inertia::render('Admin/Settings');
    })->name('settings');
});

// ==================== TEACHER ROUTES ====================
Route::middleware(['auth', 'verified'])->prefix('teacher')->name('teacher.')->group(function () {
    
    // Teacher Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Teacher/Dashboard');
    })->name('dashboard');
    
    // My Classes/Subjects
    Route::get('/my-classes', function () {
        return Inertia::render('Teacher/MyClasses');
    })->name('my-classes');
    
    // Advisory Class Students - View students in teacher's advisory class
    Route::get('/advisory-students/{classId?}', function ($classId = null) {
        return Inertia::render('Teacher/AdvisoryStudents', ['classId' => $classId ? (int) $classId : null]);
    })->name('advisory-students');
    
    // My Subjects
    Route::get('/my-subjects', function () {
        return Inertia::render('Teacher/MySubjects');
    })->name('my-subjects');
    
    // Grades Management
    Route::get('/grades', function () {
        return Inertia::render('Teacher/Grades');
    })->name('grades');
    
    // Attendance Management
    Route::get('/attendance', function () {
        return Inertia::render('Teacher/Attendance');
    })->name('attendance');
    
    // Course Materials
    Route::get('/course-materials', function () {
        return Inertia::render('Teacher/CourseMaterials');
    })->name('teacher.course-materials');
    
    // Issue Certificates
    Route::get('/certificates', function () {
        return Inertia::render('Teacher/Certificates');
    })->name('certificates');
    
    // Announcements
    Route::get('/announcements', function () {
        return Inertia::render('Teacher/Announcements');
    })->name('announcements');
    
    // Messages
    Route::get('/messages', function () {
        return Inertia::render('Teacher/Messages');
    })->name('messages');
    
    // Teaching Schedule
    Route::get('/schedule', function () {
        return Inertia::render('Teacher/Schedule');
    })->name('schedule');
    
    // Profile
    Route::get('/profile', function () {
        return Inertia::render('Teacher/Profile');
    })->name('profile');
});

// ==================== STUDENT ROUTES ====================
Route::middleware(['auth', 'verified'])->prefix('student')->name('student.')->group(function () {
    
    // Student Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Student/Dashboard');
    })->name('dashboard');
    
    // My Classes/Subjects
    Route::get('/my-subjects', function () {
        return Inertia::render('Student/MySubjects');
    })->name('my-subjects');
    
    // My Grades
    Route::get('/grades', function () {
        return Inertia::render('Student/Grades');
    })->name('grades');
    
    // My Attendance
    Route::get('/attendance', function () {
        return Inertia::render('Student/Attendance');
    })->name('attendance');
    
    // Course Materials
    Route::get('/course-materials', function () {
        return Inertia::render('Student/CourseMaterials');
    })->name('student.course-materials');
    
    // My Certificates
    Route::get('/certificates', function () {
        return Inertia::render('Student/Certificates');
    })->name('certificates');
    
    // Announcements
    Route::get('/announcements', function () {
        return Inertia::render('Student/Announcements');
    })->name('announcements');
    
    // Messages
    Route::get('/messages', function () {
        return Inertia::render('Student/Messages');
    })->name('messages');
    
    // My Schedule
    Route::get('/schedule', function () {
        return Inertia::render('Student/Schedule');
    })->name('schedule');
    
    // Transcript
    Route::get('/transcript', function () {
        return Inertia::render('Student/Transcript');
    })->name('transcript');
    
    // Profile
    Route::get('/profile', function () {
        return Inertia::render('Student/Profile');
    })->name('profile');
});

// ==================== PARENT ROUTES ====================
Route::middleware(['auth', 'verified'])->prefix('parent')->name('parent.')->group(function () {
    
    // Parent Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Parent/Dashboard');
    })->name('dashboard');
    
    // Children Overview
    Route::get('/children', function () {
        return Inertia::render('Parent/Children');
    })->name('children');
    
    // Child's Grades
    Route::get('/grades/{studentId?}', function ($studentId = null) {
        return Inertia::render('Parent/Grades', ['studentId' => $studentId]);
    })->name('grades');
    
    // Child's Attendance
    Route::get('/attendance/{studentId?}', function ($studentId = null) {
        return Inertia::render('Parent/Attendance', ['studentId' => $studentId]);
    })->name('attendance');
    
    // Child's Schedule
    Route::get('/schedule/{studentId?}', function ($studentId = null) {
        return Inertia::render('Parent/Schedule', ['studentId' => $studentId]);
    })->name('schedule');
    
    // Announcements
    Route::get('/announcements', function () {
        return Inertia::render('Parent/Announcements');
    })->name('announcements');
    
    // Messages
    Route::get('/messages', function () {
        return Inertia::render('Parent/Messages');
    })->name('messages');
    
    // Profile
    Route::get('/profile', function () {
        return Inertia::render('Parent/Profile');
    })->name('profile');
});

require __DIR__ . '/auth.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/api.php';