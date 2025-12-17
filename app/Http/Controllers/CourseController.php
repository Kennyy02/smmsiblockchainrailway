<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    /**
     * Get all courses with pagination and filters
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Course::query();

            // Search filter
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('course_code', 'like', "%{$search}%")
                      ->orWhere('course_name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Level filter
            if ($level = $request->input('level')) {
                $query->where('level', $level);
            }

            // Active filter
            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'course_code');
            $sortOrder = $request->input('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Check if pagination is disabled
            if ($request->input('paginate') === 'false') {
                $courses = $query->get();
                return response()->json([
                    'success' => true,
                    'data' => $courses,
                ]);
            }

            $perPage = $request->input('per_page', 15);
            $courses = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $courses->items(),
                'pagination' => [
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'per_page' => $courses->perPage(),
                    'total' => $courses->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching courses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch courses',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get active courses for dropdowns
     */
    public function getActive(): JsonResponse
    {
        try {
            $courses = Course::where('is_active', true)
                ->orderBy('course_code')
                ->get(['id', 'course_code', 'course_name', 'level', 'duration_years']);

            return response()->json([
                'success' => true,
                'data' => $courses,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active courses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active courses',
            ], 500);
        }
    }

    /**
     * Store a new course
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_code' => 'required|string|max:20|unique:courses,course_code',
            'course_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'level' => 'required|in:College,Senior High,Junior High,Elementary',
            'duration_years' => 'required|integer|min:1|max:10',
            'is_active' => 'boolean',
        ]);

        try {
            $course = Course::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Course created successfully',
                'data' => $course,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create course',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific course
     */
    public function show(int $id): JsonResponse
    {
        try {
            $course = Course::withCount(['students', 'classes'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $course,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Course not found',
            ], 404);
        }
    }

    /**
     * Update a course
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $course = Course::findOrFail($id);

            $validated = $request->validate([
                'course_code' => ['sometimes', 'string', 'max:20', Rule::unique('courses')->ignore($id)],
                'course_name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'level' => 'sometimes|in:College,Senior High,Junior High,Elementary',
                'duration_years' => 'sometimes|integer|min:1|max:10',
                'is_active' => 'boolean',
            ]);

            $course->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Course updated successfully',
                'data' => $course->fresh(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a course
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $course = Course::findOrFail($id);
            
            // Check if course has students or classes
            $studentsCount = $course->students()->count();
            $classesCount = $course->classes()->count();
            
            if ($studentsCount > 0 || $classesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot delete course. It has {$studentsCount} student(s) and {$classesCount} class(es) associated.",
                ], 422);
            }

            $course->delete();

            return response()->json([
                'success' => true,
                'message' => 'Course deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting course: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get course statistics
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = [
                'total_courses' => Course::count(),
                'active_courses' => Course::where('is_active', true)->count(),
                'by_level' => Course::selectRaw('level, COUNT(*) as count')
                    ->groupBy('level')
                    ->get(),
                'total_students' => Course::withCount('students')
                    ->get()
                    ->sum('students_count'),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching course stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch course statistics',
            ], 500);
        }
    }
}

