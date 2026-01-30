<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Semester;
use App\Models\StudentSubjectEnrollment;
use App\Models\CourseYearSubject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentSubjectEnrollmentController extends Controller
{
    /**
     * Map semester_id to curriculum semester string (1st, 2nd, summer).
     */
    private function semesterIdToCurriculumSemester(int $semesterId): ?string
    {
        $semester = Semester::find($semesterId);
        if (!$semester || !$semester->semester_name) {
            return null;
        }
        $name = strtolower($semester->semester_name);
        if (str_contains($name, '1st')) {
            return '1st';
        }
        if (str_contains($name, '2nd')) {
            return '2nd';
        }
        if (str_contains($name, 'summer')) {
            return 'summer';
        }
        return null;
    }

    /**
     * List student subject enrollments with filters.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = StudentSubjectEnrollment::query()
                ->with(['student', 'courseYearSubject.subject', 'courseYearSubject.course', 'academicYear', 'semester', 'classSubject']);

            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            if ($academicYearId = $request->input('academic_year_id')) {
                $query->where('academic_year_id', $academicYearId);
            }
            if ($semesterId = $request->input('semester_id')) {
                $query->where('semester_id', $semesterId);
            }
            if ($classId = $request->input('class_id')) {
                $query->whereHas('classSubject', fn ($q) => $q->where('class_id', $classId));
            }
            if ($status = $request->input('status')) {
                $query->byStatus($status);
            }
            if ($search = $request->input('search')) {
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $perPage = $request->input('per_page', 15);
            $enrollments = $query->orderByDesc('enrolled_at')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $enrollments->items(),
                'pagination' => [
                    'current_page' => $enrollments->currentPage(),
                    'last_page' => $enrollments->lastPage(),
                    'per_page' => $enrollments->perPage(),
                    'total' => $enrollments->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error listing student subject enrollments: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch enrollments',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available curriculum subjects for a student to enroll in (for a given term).
     * Excludes already enrolled; if student has failed required subject(s), only those are allowed (retake) or all if no blocking.
     */
    public function availableSubjects(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        try {
            $student = Student::with('course')->findOrFail($request->student_id);
            $academicYearId = (int) $request->academic_year_id;
            $semesterId = (int) $request->semester_id;

            $courseId = $student->course_id;
            $yearLevel = $student->year_level;
            if (!$courseId) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Student has no course assigned',
                ]);
            }

            $curriculumSemester = $this->semesterIdToCurriculumSemester($semesterId);
            if (!$curriculumSemester) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'Could not map semester to curriculum',
                ]);
            }

            // Curriculum subjects for this course + year_level + semester
            $curriculumSubjects = CourseYearSubject::with(['subject', 'course'])
                ->active()
                ->where('course_id', $courseId)
                ->where('year_level', $yearLevel)
                ->where('semester', $curriculumSemester)
                ->orderBy('is_required', 'desc')
                ->orderBy('subject_id')
                ->get();

            // Already enrolled in this term (same student, term)
            $enrolledCysIds = StudentSubjectEnrollment::query()
                ->byStudent($student->id)
                ->where('academic_year_id', $academicYearId)
                ->where('semester_id', $semesterId)
                ->whereIn('status', ['enrolled', 'passed', 'failed', 'incomplete'])
                ->pluck('course_year_subject_id')
                ->toArray();

            // Failed required not yet passed (block progression until retake)
            $failedRequiredCysIds = StudentSubjectEnrollment::query()
                ->byStudent($student->id)
                ->byStatus(StudentSubjectEnrollment::STATUS_FAILED)
                ->whereHas('courseYearSubject', fn ($q) => $q->where('is_required', true))
                ->pluck('course_year_subject_id')
                ->toArray();

            foreach ($failedRequiredCysIds as $cysId) {
                $hasPassed = StudentSubjectEnrollment::query()
                    ->byStudent($student->id)
                    ->where('course_year_subject_id', $cysId)
                    ->byStatus(StudentSubjectEnrollment::STATUS_PASSED)
                    ->exists();
                if ($hasPassed) {
                    $failedRequiredCysIds = array_diff($failedRequiredCysIds, [$cysId]);
                }
            }
            $hasAnyFailedRequired = count($failedRequiredCysIds) > 0;

            $list = [];
            foreach ($curriculumSubjects as $cys) {
                $alreadyEnrolled = in_array($cys->id, $enrolledCysIds, true);
                $isFailedRequired = in_array($cys->id, $failedRequiredCysIds, true);
                $allowRetake = $isFailedRequired; // allow retake of this failed required
                $allowNew = !$alreadyEnrolled && !$hasAnyFailedRequired; // block new subjects until no failed required

                $list[] = [
                    'id' => $cys->id,
                    'subject_id' => $cys->subject_id,
                    'subject_code' => $cys->subject?->subject_code,
                    'subject_name' => $cys->subject?->subject_name,
                    'is_required' => $cys->is_required,
                    'units' => $cys->units,
                    'already_enrolled' => $alreadyEnrolled,
                    'allow_retake' => $allowRetake,
                    'allow_new' => $allowNew,
                    'can_enroll' => $allowNew || $allowRetake,
                ];
            }

            $isIrregular = StudentSubjectEnrollment::studentIsIrregular($student->id);

            return response()->json([
                'success' => true,
                'data' => $list,
                'student' => [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'student_id' => $student->student_id,
                    'course_id' => $student->course_id,
                    'year_level' => $student->year_level,
                    'is_irregular' => $isIrregular,
                ],
                'term' => [
                    'academic_year_id' => $academicYearId,
                    'semester_id' => $semesterId,
                    'curriculum_semester' => $curriculumSemester,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available subjects',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enroll a student in subjects (create student_subject_enrollments from curriculum).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'semester_id' => 'required|exists:semesters,id',
            'course_year_subject_ids' => 'required|array|min:1',
            'course_year_subject_ids.*' => 'exists:course_year_subjects,id',
            'class_subject_ids' => 'nullable|array',
            'class_subject_ids.*' => 'nullable|exists:class_subjects,id',
        ]);

        try {
            $studentId = (int) $request->student_id;
            $academicYearId = (int) $request->academic_year_id;
            $semesterId = (int) $request->semester_id;
            $cysIds = $request->input('course_year_subject_ids');
            $classSubjectIds = $request->input('class_subject_ids', []);

            $student = Student::findOrFail($studentId);

            DB::beginTransaction();
            $created = 0;
            $errors = [];

            foreach ($cysIds as $index => $cysId) {
                $cysId = (int) $cysId;
                $existing = StudentSubjectEnrollment::query()
                    ->byStudent($studentId)
                    ->where('course_year_subject_id', $cysId)
                    ->where('academic_year_id', $academicYearId)
                    ->where('semester_id', $semesterId)
                    ->first();

                if ($existing) {
                    $errors[] = "Already enrolled in curriculum subject ID {$cysId} for this term.";
                    continue;
                }

                $cys = CourseYearSubject::find($cysId);
                if (!$cys) {
                    $errors[] = "Curriculum subject ID {$cysId} not found.";
                    continue;
                }

                $isRetake = StudentSubjectEnrollment::query()
                    ->byStudent($studentId)
                    ->where('course_year_subject_id', $cysId)
                    ->byStatus(StudentSubjectEnrollment::STATUS_FAILED)
                    ->exists();

                $classSubjectId = isset($classSubjectIds[$index]) && $classSubjectIds[$index] !== '' ? (int) $classSubjectIds[$index] : null;

                StudentSubjectEnrollment::create([
                    'student_id' => $studentId,
                    'course_year_subject_id' => $cysId,
                    'academic_year_id' => $academicYearId,
                    'semester_id' => $semesterId,
                    'class_subject_id' => $classSubjectId,
                    'status' => StudentSubjectEnrollment::STATUS_ENROLLED,
                    'is_retake' => $isRetake,
                    'enrolled_at' => now(),
                ]);
                $created++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$created} subject(s) enrolled successfully.",
                'data' => [
                    'created' => $created,
                    'errors' => $errors,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error enrolling student in subjects: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll student in subjects',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update status (e.g. drop) or assign class_subject_id.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'nullable|in:enrolled,passed,failed,dropped,incomplete',
            'class_subject_id' => 'nullable|exists:class_subjects,id',
        ]);

        try {
            $enrollment = StudentSubjectEnrollment::findOrFail($id);

            if ($request->has('status')) {
                $enrollment->status = $request->status;
                if (in_array($request->status, ['passed', 'failed', 'dropped'], true)) {
                    $enrollment->completed_at = now();
                }
            }
            if ($request->has('class_subject_id')) {
                $enrollment->class_subject_id = $request->class_subject_id ?: null;
            }
            $enrollment->save();

            return response()->json([
                'success' => true,
                'message' => 'Enrollment updated successfully',
                'data' => $enrollment->load(['student', 'courseYearSubject.subject', 'academicYear', 'semester', 'classSubject']),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating student subject enrollment: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update enrollment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get irregular status for a student.
     */
    public function irregularStatus(Request $request, int $studentId): JsonResponse
    {
        try {
            $isIrregular = StudentSubjectEnrollment::studentIsIrregular($studentId);
            return response()->json([
                'success' => true,
                'data' => ['is_irregular' => $isIrregular],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
