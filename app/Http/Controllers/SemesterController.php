<?php

namespace App\Http\Controllers;

use App\Models\Semester;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Semester::with('academicYear')->withCount(['classes', 'grades']);
            
            if ($search = $request->input('search')) {
                $query->where('semester_name', 'like', "%{$search}%");
            }
            
            if ($academicYearId = $request->input('academic_year_id')) {
                $query->byAcademicYear($academicYearId);
            }
            
            if ($status = $request->input('status')) {
                match($status) {
                    'current' => $query->current(),
                    'active' => $query->active(),
                    'past' => $query->past(),
                    default => null
                };
            }
            
            $sortBy = $request->input('sort_by', 'start_date');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $semesters = $query->paginate($perPage);
                
                return response()->json([
                    'success' => true,
                    'data' => $semesters->items(),
                    'pagination' => [
                        'current_page' => $semesters->currentPage(),
                        'last_page' => $semesters->lastPage(),
                        'per_page' => $semesters->perPage(),
                        'total' => $semesters->total()
                    ]
                ]);
            }
            
            $perPage = $request->input('per_page', 15);
            $semesters = $query->paginate($perPage);
            
            return Inertia::render('Semesters/Index', [
                'semesters' => $semesters,
                'academicYears' => AcademicYear::all(),
                'filters' => $request->only(['search', 'academic_year_id', 'status', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching semesters: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve semesters',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve semesters');
        }
    }

    public function getCurrent()
    {
        try {
            $current = Semester::current()->with('academicYear')->first();
            
            return response()->json([
                'success' => true,
                'data' => $current
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching current semester: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve current semester',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getByAcademicYear($academicYearId)
    {
        try {
            $semesters = Semester::byAcademicYear($academicYearId)
                ->orderBy('start_date')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $semesters
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching semesters by academic year: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve semesters',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function create()
    {
        return Inertia::render('Semesters/Create', [
            'academicYears' => AcademicYear::all()
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_name' => 'required|in:1st Semester,2nd Semester,Summer',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'is_current' => 'boolean',
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

            $semester = Semester::create($validator->validated());
            $semester->load('academicYear');
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $semester,
                    'message' => 'Semester created successfully'
                ], 201);
            }
            
            return redirect()->route('semesters.index')
                ->with('success', 'Semester created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating semester: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create semester',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create semester')->withInput();
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $semester = Semester::with(['academicYear', 'classes'])
                ->withCount(['classes', 'grades'])
                ->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $semester
                ]);
            }
            
            return Inertia::render('Semesters/Show', [
                'semester' => $semester
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching semester: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Semester not found');
        }
    }

    public function edit($id)
    {
        try {
            $semester = Semester::with('academicYear')->findOrFail($id);
            
            return Inertia::render('Semesters/Edit', [
                'semester' => $semester,
                'academicYears' => AcademicYear::all()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching semester for edit: ' . $e->getMessage());
            return back()->with('error', 'Semester not found');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $semester = Semester::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'academic_year_id' => 'required|exists:academic_years,id',
                'semester_name' => 'required|in:1st Semester,2nd Semester,Summer',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'is_current' => 'boolean',
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

            $semester->update($validator->validated());
            $semester->load('academicYear');
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $semester,
                    'message' => 'Semester updated successfully'
                ]);
            }
            
            return redirect()->route('semesters.index')
                ->with('success', 'Semester updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating semester: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update semester',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update semester')->withInput();
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $semester = Semester::findOrFail($id);
            $forceDelete = $request->input('force', false);
            
            $classesCount = $semester->classes()->count();
            $gradesCount = $semester->grades()->count();
            $totalRelated = $classesCount + $gradesCount;
            
            if ($totalRelated > 0 && !$forceDelete) {
                $message = "Cannot delete semester '{$semester->full_name}' because it has {$classesCount} class(es) and {$gradesCount} grade(s).";
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'data' => [
                            'classes_count' => $classesCount,
                            'grades_count' => $gradesCount,
                            'suggestion' => 'Please remove all related records first, or use force delete.'
                        ]
                    ], 400);
                }
                
                return back()->with('error', $message);
            }
            
            if ($totalRelated > 0 && $forceDelete) {
                // Force delete related records permanently
                $semester->classes()->forceDelete();
                $semester->grades()->forceDelete();
                Log::warning("Force deleted semester '{$semester->full_name}' with related records.");
            }
            
            $semesterName = $semester->full_name;
            // Permanently delete from database
            $semester->forceDelete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Semester '{$semesterName}' deleted successfully"
                ]);
            }
            
            return redirect()->route('semesters.index')
                ->with('success', "Semester '{$semesterName}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting semester: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete semester',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete semester');
        }
    }
}