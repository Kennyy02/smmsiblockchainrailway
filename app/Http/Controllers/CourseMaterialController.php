<?php

namespace App\Http\Controllers;

use App\Models\CourseMaterial;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CourseMaterialController extends Controller
{
    /**
     * Display a listing of course materials (API & Inertia).
     */
    public function index(Request $request)
    {
        try {
            $query = CourseMaterial::with(['subject', 'uploader']);
            
            if ($subjectId = $request->input('subject_id')) {
                $query->where('subject_id', $subjectId);
            }
            
            if ($search = $request->input('search')) {
                $query->search($search);
            }
            
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            if ($request->expectsJson()) {
                $materials = $query->get();
                return response()->json(['success' => true, 'data' => $materials]);
            }
            
            $materials = $query->paginate(15);
            $subjects = Subject::orderBy('subject_code')->get();
            
            return Inertia::render('CourseMaterials/Index', [
                'materials' => $materials,
                'subjects' => $subjects,
                'filters' => $request->only(['subject_id', 'search', 'sort_by', 'sort_order'])
            ]);
        } catch (\Exception $e) {
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Failed to retrieve materials'], 500) 
                : back()->with('error', 'Failed to retrieve materials');
        }
    }

    /**
     * Show the form for creating a new resource (Inertia only).
     */
    public function create()
    {
        return Inertia::render('CourseMaterials/Create', [
            'subjects' => Subject::orderBy('subject_code')->get()
        ]);
    }

    /**
     * Store a newly created course material in storage (API & Inertia).
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'subject_id' => 'required|exists:subjects,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'required|file|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Validation failed', 
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $filePath = $file->store('course_materials', 'public');
            
            $data = [
                'subject_id' => $request->subject_id,
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $filePath,
                'file_mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => Auth::id(),
            ];

            $material = CourseMaterial::create($data);
            $material->load(['subject', 'uploader']);
            
            return response()->json([
                'success' => true, 
                'data' => $material, 
                'message' => 'Course Material uploaded successfully'
            ], 201);
            
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Course Material Upload - Database Error', [
                'error' => $e->getMessage(),
                'sql' => $e->getSql() ?? 'N/A',
                'bindings' => $e->getBindings() ?? [],
                'data' => $data ?? []
            ]);
            
            return response()->json([
                'success' => false, 
                'message' => 'Database error occurred: ' . $e->getMessage(),
                'error_code' => $e->getCode()
            ], 500);
            
        } catch (\Exception $e) {
            \Log::error('Course Material Upload - General Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false, 
                'message' => 'Failed to upload material: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified course material (API & Inertia).
     */
    public function show(Request $request, $id)
    {
        try {
            $material = CourseMaterial::with(['subject', 'uploader'])->findOrFail($id);

            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'data' => $material]);
            }
            
            return Inertia::render('CourseMaterials/Show', ['material' => $material]);
        } catch (ModelNotFoundException $e) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Course material not found'], 404)
                : back()->with('error', 'Course material not found');
        } catch (\Exception $e) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Error retrieving material'], 500)
                : back()->with('error', 'Error retrieving material');
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        try {
            $material = CourseMaterial::with(['subject', 'uploader'])->findOrFail($id);
            $subjects = Subject::orderBy('subject_code')->get();
            
            return Inertia::render('CourseMaterials/Edit', [
                'material' => $material,
                'subjects' => $subjects
            ]);
        } catch (ModelNotFoundException $e) {
            return back()->with('error', 'Material not found');
        }
    }

    /**
     * Update the specified course material (metadata only).
     */
    public function update(Request $request, $id)
    {
        try {
            $material = CourseMaterial::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'subject_id' => 'required|exists:subjects,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() 
                    ? response()->json([
                        'success' => false, 
                        'message' => 'Validation failed', 
                        'errors' => $validator->errors()
                    ], 422) 
                    : back()->withErrors($validator)->withInput();
            }

            $material->update($validator->validated());
            $material->load(['subject', 'uploader']);
            
            return $request->expectsJson() 
                ? response()->json([
                    'success' => true, 
                    'data' => $material, 
                    'message' => 'Course Material updated successfully'
                ]) 
                : redirect()->route('course-materials.index')->with('success', 'Course Material updated successfully');
                
        } catch (ModelNotFoundException $e) {
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Material not found'], 404)
                : back()->with('error', 'Material not found');
        } catch (\Exception $e) {
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Failed to update material'], 500) 
                : back()->with('error', 'Failed to update material');
        }
    }

    /**
     * Download the material file.
     */
    public function download($id)
    {
        try {
            $material = CourseMaterial::findOrFail($id);
            
            if (!Storage::disk('public')->exists($material->file_path)) {
                return response()->json(['success' => false, 'message' => 'File not found on server'], 404);
            }
            
            $fileName = $material->title . '.' . $material->getFileExtension();
            
            return Storage::disk('public')->download($material->file_path, $fileName);
            
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Course material not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to download file'], 500);
        }
    }

    /**
     * Remove the specified course material from storage.
     */
    public function destroy(Request $request, $id)
    {
        try {
            $material = CourseMaterial::findOrFail($id);
            
            if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
                Storage::disk('public')->delete($material->file_path);
            }
            
            $material->delete();
            
            return $request->expectsJson() 
                ? response()->json(['success' => true, 'message' => 'Course Material deleted successfully']) 
                : redirect()->route('course-materials.index')->with('success', 'Course Material deleted successfully');
                
        } catch (ModelNotFoundException $e) {
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Material not found (already deleted)'], 404) 
                : back()->with('error', 'Material not found (already deleted)');
        } catch (\Exception $e) {
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Failed to delete material'], 500) 
                : back()->with('error', 'Failed to delete material');
        }
    }

    /**
     * Get all subjects for dropdown
     */
    public function getSubjects()
    {
        try {
            $subjects = Subject::orderBy('subject_code')->get();
            return response()->json(['success' => true, 'data' => $subjects]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to retrieve subjects'], 500);
        }
    }
}
