<?php

namespace App\Http\Controllers;

use App\Models\CourseYearSubject;
use App\Models\Course;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CourseYearSubjectController extends Controller
{
    /**
     * Display a listing of course-year-subject links
     */
    public function index(Request $request)
    {
        try {
            $query = CourseYearSubject::with(['course', 'subject']);

            // Apply filters
            if ($courseId = $request->input('course_id')) {
                $query->byCourse($courseId);
            }

            if ($yearLevel = $request->input('year_level')) {
                $query->byYearLevel($yearLevel);
            }

            if ($semester = $request->input('semester')) {
                $query->bySemester($semester);
            }

            if ($search = $request->input('search')) {
                $query->search($search);
            }

            $sortBy = $request->input('sort_by', 'course_id');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder)->orderBy('year_level')->orderBy('semester');

            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $links = $query->paginate($perPage);

                return response()->json([
                    'success' => true,
                    'data' => $links->items(),
                    'pagination' => [
                        'current_page' => $links->currentPage(),
                        'last_page' => $links->lastPage(),
                        'per_page' => $links->perPage(),
                        'total' => $links->total()
                    ]
                ]);
            }

            return Inertia::render('Admin/CourseYearSubjects', [
                'courseYearSubjects' => $query->paginate(15),
                'courses' => Course::active()->orderBy('course_code')->get(),
                'subjects' => Subject::orderBy('subject_code')->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching course-year-subjects: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve curriculum links',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Failed to retrieve curriculum links');
        }
    }

    /**
     * Store a new course-year-subject link
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'course_id' => 'required|exists:courses,id',
                'year_level' => 'required|integer|min:1|max:16',
                'subject_id' => 'required|exists:subjects,id',
                'semester' => 'required|in:1st,2nd,summer',
                'is_required' => 'boolean',
                'units' => 'integer|min:1|max:9',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check for duplicate
            $exists = CourseYearSubject::where('course_id', $request->course_id)
                ->where('year_level', $request->year_level)
                ->where('subject_id', $request->subject_id)
                ->where('semester', $request->semester)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'This subject is already linked to this course-year-semester combination',
                ], 422);
            }

            $link = CourseYearSubject::create($request->only([
                'course_id', 'year_level', 'subject_id', 'semester',
                'is_required', 'units', 'description'
            ]));

            $link->load(['course', 'subject']);

            return response()->json([
                'success' => true,
                'data' => $link,
                'message' => 'Subject linked to curriculum successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating course-year-subject link: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create curriculum link',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk store multiple subjects for a course-year-semester
     */
    public function bulkStore(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'course_id' => 'required|exists:courses,id',
                'year_level' => 'required|integer|min:1|max:16',
                'semester' => 'required|in:1st,2nd,summer',
                'subject_ids' => 'required|array|min:1',
                'subject_ids.*' => 'exists:subjects,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $created = [];
            $skipped = [];

            DB::beginTransaction();

            foreach ($request->subject_ids as $subjectId) {
                // Check if already exists
                $exists = CourseYearSubject::where('course_id', $request->course_id)
                    ->where('year_level', $request->year_level)
                    ->where('subject_id', $subjectId)
                    ->where('semester', $request->semester)
                    ->exists();

                if ($exists) {
                    $skipped[] = $subjectId;
                    continue;
                }

                $link = CourseYearSubject::create([
                    'course_id' => $request->course_id,
                    'year_level' => $request->year_level,
                    'subject_id' => $subjectId,
                    'semester' => $request->semester,
                    'is_required' => true,
                    'units' => 3,
                ]);

                $created[] = $link->id;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => count($created) . ' subjects linked successfully' . 
                    (count($skipped) > 0 ? ', ' . count($skipped) . ' already existed' : ''),
                'data' => [
                    'created_count' => count($created),
                    'skipped_count' => count($skipped),
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error bulk creating course-year-subject links: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk create curriculum links',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a single course-year-subject link
     */
    public function show($id)
    {
        try {
            $link = CourseYearSubject::with(['course', 'subject'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $link
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching course-year-subject link: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Curriculum link not found'
            ], 404);
        }
    }

    /**
     * Update a course-year-subject link
     */
    public function update(Request $request, $id)
    {
        try {
            $link = CourseYearSubject::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'course_id' => 'exists:courses,id',
                'year_level' => 'integer|min:1|max:16',
                'subject_id' => 'exists:subjects,id',
                'semester' => 'in:1st,2nd,summer',
                'is_required' => 'boolean',
                'units' => 'integer|min:1|max:9',
                'description' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check for duplicate if changing course/year/subject/semester
            if ($request->has('course_id') || $request->has('year_level') || 
                $request->has('subject_id') || $request->has('semester')) {
                
                $courseId = $request->input('course_id', $link->course_id);
                $yearLevel = $request->input('year_level', $link->year_level);
                $subjectId = $request->input('subject_id', $link->subject_id);
                $semester = $request->input('semester', $link->semester);

                $exists = CourseYearSubject::where('course_id', $courseId)
                    ->where('year_level', $yearLevel)
                    ->where('subject_id', $subjectId)
                    ->where('semester', $semester)
                    ->where('id', '!=', $id)
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'This subject is already linked to this course-year-semester combination',
                    ], 422);
                }
            }

            $link->update($request->only([
                'course_id', 'year_level', 'subject_id', 'semester',
                'is_required', 'units', 'description', 'is_active'
            ]));

            $link->load(['course', 'subject']);

            return response()->json([
                'success' => true,
                'data' => $link,
                'message' => 'Curriculum link updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating course-year-subject link: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update curriculum link',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a course-year-subject link
     */
    public function destroy($id)
    {
        try {
            $link = CourseYearSubject::findOrFail($id);
            $link->delete();

            return response()->json([
                'success' => true,
                'message' => 'Subject removed from curriculum successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting course-year-subject link: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove subject from curriculum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for course-year-subjects
     */
    public function getStats()
    {
        try {
            $totalLinks = CourseYearSubject::count();
            $activeLinks = CourseYearSubject::active()->count();
            $totalCourses = Course::active()->count();
            $totalSubjects = Subject::count();

            // Links by course
            $byCourse = CourseYearSubject::select('course_id', DB::raw('count(*) as count'))
                ->groupBy('course_id')
                ->with('course:id,course_code,course_name')
                ->get()
                ->map(fn($item) => [
                    'course_code' => $item->course->course_code ?? 'Unknown',
                    'course_name' => $item->course->course_name ?? 'Unknown',
                    'count' => (int)$item->count
                ]);

            // Links by year level
            $byYearLevel = CourseYearSubject::select('year_level', DB::raw('count(*) as count'))
                ->groupBy('year_level')
                ->orderBy('year_level')
                ->get()
                ->map(fn($item) => [
                    'year_level' => (int)$item->year_level,
                    'count' => (int)$item->count
                ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_links' => $totalLinks,
                    'active_links' => $activeLinks,
                    'total_courses' => $totalCourses,
                    'total_subjects' => $totalSubjects,
                    'by_course' => $byCourse,
                    'by_year_level' => $byYearLevel,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting course-year-subject stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics'
            ], 500);
        }
    }

    /**
     * Get subjects for a specific course and year level
     * This is used to show which subjects a student should have
     */
    public function getSubjectsForCourseYear(Request $request)
    {
        try {
            $courseId = $request->input('course_id');
            $yearLevel = $request->input('year_level');
            $semester = $request->input('semester');

            $query = CourseYearSubject::with(['subject'])
                ->active();

            if ($courseId) {
                $query->byCourse($courseId);
            }

            if ($yearLevel) {
                $query->byYearLevel($yearLevel);
            }

            if ($semester) {
                $query->bySemester($semester);
            }

            $subjects = $query->orderBy('is_required', 'desc')
                ->orderBy('subject_id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $subjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subjects for course-year: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subjects'
            ], 500);
        }
    }

    /**
     * Get available subjects (not yet linked to this course-year-semester)
     */
    public function getAvailableSubjects(Request $request)
    {
        try {
            $courseId = $request->input('course_id');
            $yearLevel = $request->input('year_level');
            $semester = $request->input('semester');

            // Get subjects already linked
            $linkedSubjectIds = CourseYearSubject::where('course_id', $courseId)
                ->where('year_level', $yearLevel)
                ->where('semester', $semester)
                ->pluck('subject_id');

            // Get subjects not yet linked
            $availableSubjects = Subject::whereNotIn('id', $linkedSubjectIds)
                ->orderBy('subject_code')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $availableSubjects
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available subjects'
            ], 500);
        }
    }

    /**
     * Get subjects for a student based on their current enrollment
     * This uses the curriculum links (course_year_subjects) to determine what subjects a student should have
     */
    public function getStudentSubjects(Request $request)
    {
        try {
            $studentId = $request->input('student_id');
            
            if (!$studentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student ID is required'
                ], 422);
            }

            // Get the student with their current class enrollment
            $student = \App\Models\Student::with([
                'currentClass.course', 
                'currentClass.semester',
                'course'
            ])->find($studentId);

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            // If student has no current class, try to get from active enrollment
            $class = $student->currentClass;
            
            if (!$class) {
                $enrollment = \App\Models\Enrollment::where('student_id', $studentId)
                    ->where('status', 'enrolled')
                    ->with('class.course', 'class.semester')
                    ->latest()
                    ->first();
                
                if ($enrollment) {
                    $class = $enrollment->class;
                }
            }

            if (!$class) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Student is not currently enrolled in any class'
                ]);
            }

            // Get subjects linked to this course, year level, and semester
            $courseId = $class->course_id;
            $yearLevel = $class->year_level;
            
            // Get semester name from the relationship
            $semesterName = $class->semester ? $class->semester->semester_name : null;
            
            // Convert semester name to the format used in course_year_subjects
            // e.g., "1st Semester" -> "1st", "2nd Semester" -> "2nd"
            $semester = null;
            if ($semesterName) {
                if (stripos($semesterName, '1st') !== false) {
                    $semester = '1st';
                } elseif (stripos($semesterName, '2nd') !== false) {
                    $semester = '2nd';
                } elseif (stripos($semesterName, 'summer') !== false) {
                    $semester = 'summer';
                }
            }
            
            Log::info('Fetching student subjects', [
                'student_id' => $studentId,
                'course_id' => $courseId,
                'year_level' => $yearLevel,
                'semester' => $semester,
                'semester_name' => $semesterName,
                'class_id' => $class->id
            ]);

            $subjects = CourseYearSubject::with(['subject', 'course'])
                ->where('course_id', $courseId)
                ->where('year_level', $yearLevel)
                ->where('semester', $semester)
                ->orderBy('is_required', 'desc')
                ->orderBy('subject_id')
                ->get()
                ->map(function ($link) use ($class) {
                    return [
                        'id' => $link->id,
                        'subject_id' => $link->subject_id,
                        'subject_code' => $link->subject->subject_code ?? '',
                        'subject_name' => $link->subject->subject_name ?? '',
                        'units' => $link->units,
                        'is_required' => $link->is_required,
                        'course_code' => $link->course->course_code ?? '',
                        'course_name' => $link->course->course_name ?? '',
                        'course_level' => $link->course->level ?? 'College',
                        'class_code' => $class->class_code ?? '',
                        'section' => $class->section ?? '',
                        'year_level' => $link->year_level,
                        'semester' => $link->semester,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $subjects,
                'class_info' => [
                    'class_id' => $class->id,
                    'class_code' => $class->class_code,
                    'section' => $class->section,
                    'course_name' => $class->course->course_name ?? '',
                    'course_level' => $class->course->level ?? 'College',
                    'year_level' => $yearLevel,
                    'semester' => $semester ?? '1st', // Default to 1st if not found
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching student subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve student subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

