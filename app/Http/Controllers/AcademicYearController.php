<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AcademicYearController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = AcademicYear::withCount(['semesters', 'classes', 'grades']);
            
            if ($search = $request->input('search')) {
                $query->where('year_name', 'like', "%{$search}%");
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
                $academicYears = $query->paginate($perPage);
                
                return response()->json([
                    'success' => true,
                    'data' => $academicYears->items(),
                    'pagination' => [
                        'current_page' => $academicYears->currentPage(),
                        'last_page' => $academicYears->lastPage(),
                        'per_page' => $academicYears->perPage(),
                        'total' => $academicYears->total()
                    ]
                ]);
            }
            
            $perPage = $request->input('per_page', 15);
            $academicYears = $query->paginate($perPage);
            
            return Inertia::render('AcademicYears/Index', [
                'academicYears' => $academicYears,
                'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching academic years: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve academic years',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve academic years');
        }
    }

    public function getCurrent()
    {
        try {
            $current = AcademicYear::current()->with('semesters')->first();
            
            return response()->json([
                'success' => true,
                'data' => $current
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching current academic year: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve current academic year',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getActive()
    {
        try {
            $active = AcademicYear::active()->orderBy('start_date', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $active
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching active academic years: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active academic years',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function create()
    {
        return Inertia::render('AcademicYears/Create');
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'year_name' => 'required|string|max:20|unique:academic_years',
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

            $academicYear = AcademicYear::create($validator->validated());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $academicYear,
                    'message' => 'Academic year created successfully'
                ], 201);
            }
            
            return redirect()->route('academic-years.index')
                ->with('success', 'Academic year created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating academic year: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create academic year',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to create academic year')->withInput();
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $academicYear = AcademicYear::with(['semesters', 'classes'])
                ->withCount(['semesters', 'classes', 'grades'])
                ->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $academicYear
                ]);
            }
            
            return Inertia::render('AcademicYears/Show', [
                'academicYear' => $academicYear
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching academic year: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Academic year not found',
                    'error' => $e->getMessage()
                ], 404);
            }
            
            return back()->with('error', 'Academic year not found');
        }
    }

    public function edit($id)
    {
        try {
            $academicYear = AcademicYear::findOrFail($id);
            
            return Inertia::render('AcademicYears/Edit', [
                'academicYear' => $academicYear
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching academic year for edit: ' . $e->getMessage());
            return back()->with('error', 'Academic year not found');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $academicYear = AcademicYear::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'year_name' => 'required|string|max:20|unique:academic_years,year_name,' . $academicYear->id,
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

            $academicYear->update($validator->validated());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $academicYear,
                    'message' => 'Academic year updated successfully'
                ]);
            }
            
            return redirect()->route('academic-years.index')
                ->with('success', 'Academic year updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating academic year: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update academic year',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to update academic year')->withInput();
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $academicYear = AcademicYear::findOrFail($id);
            $forceDelete = $request->input('force', false);
            
            $semestersCount = $academicYear->semesters()->count();
            $classesCount = $academicYear->classes()->count();
            $gradesCount = $academicYear->grades()->count();
            $totalRelated = $semestersCount + $classesCount + $gradesCount;
            
            if ($totalRelated > 0 && !$forceDelete) {
                $message = "Cannot delete academic year '{$academicYear->year_name}' because it has {$semestersCount} semester(s), {$classesCount} class(es), and {$gradesCount} grade(s).";
                
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => $message,
                        'data' => [
                            'semesters_count' => $semestersCount,
                            'classes_count' => $classesCount,
                            'grades_count' => $gradesCount,
                            'suggestion' => 'Please remove all related records first, or use force delete.'
                        ]
                    ], 400);
                }
                
                return back()->with('error', $message);
            }
            
            if ($totalRelated > 0 && $forceDelete) {
                $academicYear->semesters()->delete();
                $academicYear->classes()->delete();
                $academicYear->grades()->delete();
                Log::warning("Force deleted academic year '{$academicYear->year_name}' with related records.");
            }
            
            $yearName = $academicYear->year_name;
            $academicYear->delete();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => "Academic year '{$yearName}' deleted successfully"
                ]);
            }
            
            return redirect()->route('academic-years.index')
                ->with('success', "Academic year '{$yearName}' deleted successfully");
        } catch (\Exception $e) {
            Log::error('Error deleting academic year: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete academic year',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to delete academic year');
        }
    }
}