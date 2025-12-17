<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Student;
use App\Models\Enrollment;
use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnrollmentController extends Controller
{
    /**
     * Get all students enrolled in a specific class
     */
    public function getClassStudents(Request $request, int $classId): JsonResponse
    {
        try {
            $class = Classes::with(['academicYear', 'semester'])->findOrFail($classId);
            
            $query = Student::query()
                ->select('students.*')
                ->join('enrollments', 'students.id', '=', 'enrollments.student_id')
                ->where('enrollments.class_id', $classId)
                ->where('enrollments.deleted_at', null);

            // Search filter
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('students.student_id', 'like', "%{$search}%")
                      ->orWhere('students.first_name', 'like', "%{$search}%")
                      ->orWhere('students.last_name', 'like', "%{$search}%")
                      ->orWhere('students.email', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($status = $request->input('status')) {
                $query->where('enrollments.status', $status);
            }

            // Add enrollment info
            $query->addSelect([
                'enrollments.status as enrollment_status',
                'enrollments.enrollment_date',
                'enrollments.remarks as enrollment_remarks'
            ]);

            $perPage = $request->input('per_page', 15);
            $students = $query->orderBy('students.last_name')
                             ->orderBy('students.first_name')
                             ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $students->items(),
                'class_info' => [
                    'id' => $class->id,
                    'class_code' => $class->class_code,
                    'class_name' => $class->class_name,
                    'program' => $class->program,
                    'year_level' => $class->year_level,
                    'section' => $class->section,
                    'academic_year' => $class->academicYear?->year_name,
                    'semester' => $class->semester?->semester_name,
                ],
                'pagination' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching class students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available students (not enrolled in ANY class for current semester)
     * Filters by class's course/program AND year level automatically
     */
    public function getAvailableStudents(Request $request, int $classId): JsonResponse
    {
        try {
            $class = Classes::with('course')->findOrFail($classId);
            
            // Get IDs of students already enrolled in ANY class for the same academic year and semester
            $enrolledStudentIds = Enrollment::where('academic_year_id', $class->academic_year_id)
                ->where('semester_id', $class->semester_id)
                ->whereIn('status', ['enrolled', 'completed'])
                ->pluck('student_id')
                ->toArray();

            $query = Student::query()
                ->whereNotIn('id', $enrolledStudentIds)
                ->where(function ($q) {
                    $q->whereNull('status')
                      ->orWhere('status', 'active');
                });

            // AUTO-FILTER: Match class's course/program
            // If class has course_id, filter by course_id; otherwise filter by program string
            if ($class->course_id) {
                $query->where('course_id', $class->course_id);
            } elseif ($class->program) {
                $query->where('program', $class->program);
            }

            // AUTO-FILTER: Match class's year level
            $query->where('year_level', $class->year_level);

            // Additional search filter (for searching within already filtered results)
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%")
                      ->orWhere('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $perPage = $request->input('per_page', 50);
            $students = $query->orderBy('last_name')
                             ->orderBy('first_name')
                             ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $students->items(),
                'class_requirements' => [
                    'course_id' => $class->course_id,
                    'course_code' => $class->course?->course_code ?? $class->program,
                    'course_name' => $class->course?->course_name ?? $class->program,
                    'year_level' => $class->year_level,
                ],
                'pagination' => [
                    'current_page' => $students->currentPage(),
                    'last_page' => $students->lastPage(),
                    'per_page' => $students->perPage(),
                    'total' => $students->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching available students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch available students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Enroll a single student to a class
     */
    public function enrollStudent(Request $request, int $classId): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        try {
            $class = Classes::findOrFail($classId);
            $studentId = $request->input('student_id');

            // Check if already enrolled in ANY class for this semester
            $existingEnrollment = Enrollment::where('student_id', $studentId)
                ->where('academic_year_id', $class->academic_year_id)
                ->where('semester_id', $class->semester_id)
                ->whereIn('status', ['enrolled', 'completed'])
                ->with('class')
                ->first();

            if ($existingEnrollment) {
                $existingClass = $existingEnrollment->class;
                return response()->json([
                    'success' => false,
                    'message' => "Student is already enrolled in {$existingClass->class_code} for this semester",
                ], 422);
            }

            // Remove any soft-deleted enrollment for this specific class (allows re-adding)
            Enrollment::withTrashed()
                ->where('student_id', $studentId)
                ->where('class_id', $classId)
                ->where('academic_year_id', $class->academic_year_id)
                ->where('semester_id', $class->semester_id)
                ->forceDelete();

            $enrollment = Enrollment::create([
                'student_id' => $studentId,
                'class_id' => $classId,
                'academic_year_id' => $class->academic_year_id,
                'semester_id' => $class->semester_id,
                'course_id' => $class->course_id,
                'enrollment_date' => now(),
                'status' => 'enrolled',
            ]);

            // Update student's current class
            Student::where('id', $studentId)->update(['current_class_id' => $classId]);

            return response()->json([
                'success' => true,
                'message' => 'Student enrolled successfully',
                'data' => $enrollment->load('student'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error enrolling student: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll student',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk enroll multiple students to a class
     */
    public function bulkEnrollStudents(Request $request, int $classId): JsonResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
        ]);

        try {
            $class = Classes::findOrFail($classId);
            $studentIds = $request->input('student_ids');
            
            $enrolled = 0;
            $failed = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($studentIds as $studentId) {
                try {
                    // Check if already enrolled in ANY class for this semester (active enrollments only)
                    $existingEnrollment = Enrollment::where('student_id', $studentId)
                        ->where('academic_year_id', $class->academic_year_id)
                        ->where('semester_id', $class->semester_id)
                        ->whereIn('status', ['enrolled', 'completed'])
                        ->with('class')
                        ->first();

                    if ($existingEnrollment) {
                        $student = Student::find($studentId);
                        $existingClass = $existingEnrollment->class;
                        $errors[] = "{$student->full_name} is already enrolled in {$existingClass->class_code}";
                        $failed++;
                        continue;
                    }

                    // Check for and remove any soft-deleted enrollments for this specific class
                    // (This allows re-adding a previously removed student)
                    Enrollment::withTrashed()
                        ->where('student_id', $studentId)
                        ->where('class_id', $classId)
                        ->where('academic_year_id', $class->academic_year_id)
                        ->where('semester_id', $class->semester_id)
                        ->forceDelete();

                    // Create enrollment
                    Enrollment::create([
                        'student_id' => $studentId,
                        'class_id' => $classId,
                        'academic_year_id' => $class->academic_year_id,
                        'semester_id' => $class->semester_id,
                        'course_id' => $class->course_id,
                        'enrollment_date' => now(),
                        'status' => 'enrolled',
                    ]);

                    // Update student's current class
                    Student::where('id', $studentId)->update(['current_class_id' => $classId]);

                    $enrolled++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Failed to enroll student ID {$studentId}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$enrolled} student(s) enrolled successfully" . ($failed > 0 ? ", {$failed} failed" : ''),
                'data' => [
                    'enrolled' => $enrolled,
                    'failed' => $failed,
                    'errors' => $errors,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error bulk enrolling students: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to enroll students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove a student from a class (just removes from section, doesn't change student status)
     */
    public function unenrollStudent(Request $request, int $classId, int $studentId): JsonResponse
    {
        try {
            // Include soft-deleted records to handle all cases
            $enrollment = Enrollment::withTrashed()
                ->where('class_id', $classId)
                ->where('student_id', $studentId)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student is not in this class',
                ], 404);
            }

            // Force delete to permanently remove (allows re-enrollment later)
            $enrollment->forceDelete();

            // Clear student's current class if it matches this class
            Student::where('id', $studentId)
                ->where('current_class_id', $classId)
                ->update(['current_class_id' => null]);

            return response()->json([
                'success' => true,
                'message' => 'Student removed from class successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error removing student from class: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove student from class',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update enrollment status
     */
    public function updateEnrollmentStatus(Request $request, int $classId, int $studentId): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:enrolled,dropped,completed,withdrawn',
            'remarks' => 'nullable|string|max:500',
        ]);

        try {
            $enrollment = Enrollment::where('class_id', $classId)
                ->where('student_id', $studentId)
                ->firstOrFail();

            $enrollment->update([
                'status' => $request->input('status'),
                'remarks' => $request->input('remarks'),
            ]);

            // Update student's current class based on status
            if (in_array($request->input('status'), ['dropped', 'withdrawn'])) {
                Student::where('id', $studentId)
                    ->where('current_class_id', $classId)
                    ->update(['current_class_id' => null]);
            } elseif ($request->input('status') === 'enrolled') {
                Student::where('id', $studentId)->update(['current_class_id' => $classId]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Enrollment status updated successfully',
                'data' => $enrollment->load('student'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating enrollment status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update enrollment status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

