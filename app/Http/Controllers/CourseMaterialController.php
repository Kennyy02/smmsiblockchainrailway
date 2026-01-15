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
            // Debug: Log what we received
            \Log::info('Course Material Upload Request', [
                'has_file' => $request->hasFile('file'),
                'all_files' => $request->allFiles(),
                'input_keys' => array_keys($request->all()),
                'content_type' => $request->header('Content-Type'),
                'content_length' => $request->header('Content-Length'),
                'subject_id' => $request->input('subject_id'),
                'title' => $request->input('title'),
                'request_method' => $request->method(),
                'is_multipart' => str_contains($request->header('Content-Type', ''), 'multipart/form-data'),
                'php_input_size' => strlen(file_get_contents('php://input')),
            ]);
            
            // Check if file was uploaded
            if (!$request->hasFile('file')) {
                // Try alternative field names
                $fileField = null;
                foreach (['file', 'upload', 'document'] as $field) {
                    if ($request->hasFile($field)) {
                        $fileField = $field;
                        break;
                    }
                }
                
                \Log::warning('No file in request', [
                    'all_files' => $request->allFiles(),
                    'has_file' => $request->hasFile('file'),
                    'content_type' => $request->header('Content-Type'),
                    'content_length' => $request->header('Content-Length'),
                    'alternative_field' => $fileField,
                    'all_input' => $request->all(),
                ]);
                
                return response()->json([
                    'success' => false, 
                    'message' => 'No file was uploaded',
                    'errors' => ['file' => ['Please select a file to upload.']],
                    'debug' => [
                        'content_type' => $request->header('Content-Type'),
                        'has_file' => $request->hasFile('file'),
                        'all_files_count' => count($request->allFiles()),
                    ]
                ], 422);
            }

            $validator = Validator::make($request->all(), [
                'subject_id' => 'required|exists:subjects,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'required|file|max:10240', // max:10240 = 10MB in kilobytes
            ]);

            if ($validator->fails()) {
                // Enhance file validation error messages
                $errors = $validator->errors();
                if ($errors->has('file') && $request->hasFile('file')) {
                    $file = $request->file('file');
                    // Check for specific file upload errors
                    if ($file && $file->getError() !== UPLOAD_ERR_OK) {
                        $uploadErrors = [
                            UPLOAD_ERR_INI_SIZE => 'File exceeds PHP upload_max_filesize limit. Maximum file size is 10 MB.',
                            UPLOAD_ERR_FORM_SIZE => 'File exceeds form MAX_FILE_SIZE limit. Maximum file size is 10 MB.',
                            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded. Please try again.',
                            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder on server',
                            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
                        ];
                        $errorCode = $file->getError();
                        $errorMsg = $uploadErrors[$errorCode] ?? 'File upload failed. Please check the file size and try again.';
                        $errors->add('file', $errorMsg);
                    } elseif ($file && $file->getSize() > 10240 * 1024) {
                        // File size exceeds 10MB (10240 KB)
                        $errors->add('file', 'File size exceeds the maximum allowed size of 10 MB.');
                    }
                }
                
                return response()->json([
                    'success' => false, 
                    'message' => 'Validation failed', 
                    'errors' => $errors
                ], 422);
            }

            $file = $request->file('file');
            
            // Additional file validation
            if (!$file || !$file->isValid()) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Invalid file upload',
                    'errors' => ['file' => ['The uploaded file is not valid. Please check the file and try again.']]
                ], 422);
            }
            
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
