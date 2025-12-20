<?php

namespace App\Http\Controllers;

use App\Models\ParentModel;
use App\Models\Certificate;
use App\Models\Message;
use App\Models\Announcement;
use App\Models\CourseMaterial;
use App\Models\Student;
use App\Models\User;
use App\Models\ClassSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

// ==========================================
// Parent Controller
// ==========================================
class ParentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = ParentModel::with(['user', 'students'])->withCount('students');
            
            if ($search = $request->input('search')) {
                $query->search($search);
            }
            
            // Filter by education level of children
            // Parents with no students only appear in "No Students" filter
            // Parents with ANY linked students appear ONLY in their children's education level filter
            if ($educationLevel = $request->input('education_level')) {
                // Handle "No Students" filter
                // Show ONLY parents who have NO students linked to them at all
                // Use explicit subquery to check pivot table directly
                if ($educationLevel === 'no_students') {
                    $query->whereNotExists(function($subQuery) {
                        $subQuery->select(DB::raw(1))
                                 ->from('parent_student')
                                 ->whereColumn('parent_student.parent_id', 'parents.id');
                    });
                } else {
                    $gradeRanges = [
                        'College' => [13, 16],
                        'Senior High' => [11, 12],
                        'Junior High' => [7, 10],
                        'Elementary' => [1, 6],
                    ];
                    
                    if (isset($gradeRanges[$educationLevel])) {
                        [$minGrade, $maxGrade] = $gradeRanges[$educationLevel];
                        // Show parents who have students in this education level
                        // Include all linked students (even dropped ones) - if parent has students linked, 
                        // they should appear in the appropriate education level filter
                        $query->whereHas('students', function($studentQuery) use ($minGrade, $maxGrade) {
                            $studentQuery->whereBetween('year_level', [$minGrade, $maxGrade]);
                        });
                    }
                }
            }
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $parents = $query->paginate($perPage);
                
                // Add children info to response
                $parentsData = $parents->items();
                foreach ($parentsData as $parent) {
                    $parent->children = $parent->students->map(function($student) {
                        return [
                            'id' => $student->id,
                            'full_name' => $student->full_name,
                            'year_level' => $student->year_level,
                            'program' => $student->program,
                        ];
                    });
                }
                
                return response()->json(['success' => true, 'data' => $parentsData, 'pagination' => ['current_page' => $parents->currentPage(), 'last_page' => $parents->lastPage(), 'per_page' => $parents->perPage(), 'total' => $parents->total()]]);
            }
            
            $perPage = $request->input('per_page', 15);
            $parents = $query->paginate($perPage);
            
            return Inertia::render('Parents/Index', ['parents' => $parents, 'filters' => $request->only(['search', 'education_level'])]);
        } catch (\Exception $e) {
            Log::error('Error fetching parents: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to retrieve parents: ' . $e->getMessage()], 500) : back()->with('error', 'Failed to retrieve parents');
        }
    }

    /**
     * Get parent statistics
     * GET /api/parents/stats
     */
    public function getStats()
    {
        try {
            // 1. Get total count of all parents
            $totalParents = ParentModel::count();

            // 2. Get count of unlinked parents (parents with no students linked at all)
            // Use explicit subquery to check pivot table directly
            $unlinkedParents = ParentModel::whereNotExists(function($subQuery) {
                $subQuery->select(DB::raw(1))
                         ->from('parent_student')
                         ->whereColumn('parent_student.parent_id', 'parents.id');
            })->count();

            // 3. Count parents by their children's education level
            $gradeRanges = [
                'College' => [13, 16],
                'Senior High' => [11, 12],
                'Junior High' => [7, 10],
                'Elementary' => [1, 6],
            ];
            
            $byEducationLevel = [];
            foreach ($gradeRanges as $level => [$minGrade, $maxGrade]) {
                // Count parents who have students in this education level (all linked students, regardless of status)
                $count = ParentModel::whereHas('students', function($q) use ($minGrade, $maxGrade) {
                    $q->whereBetween('year_level', [$minGrade, $maxGrade]);
                })->count();
                
                $byEducationLevel[] = [
                    'level' => $level,
                    'count' => $count,
                ];
            }
            
            // Add count for parents with no students linked at all
            // Use explicit subquery to check pivot table directly
            $noStudentsCount = ParentModel::whereNotExists(function($subQuery) {
                $subQuery->select(DB::raw(1))
                         ->from('parent_student')
                         ->whereColumn('parent_student.parent_id', 'parents.id');
            })->count();
            $byEducationLevel[] = [
                'level' => 'No Students',
                'count' => $noStudentsCount,
            ];

            $stats = [
                'total_parents' => $totalParents,
                'unlinked_parents' => $unlinkedParents,
                'by_education_level' => $byEducationLevel,
                // Keep by_relationship for backwards compatibility
                'by_relationship' => $byEducationLevel,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting parent stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email',
                'gender' => 'nullable|in:Male,Female',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'password' => 'required|string|min:8|confirmed',
                'students' => 'nullable|array',
                'students.*.student_id' => 'exists:students,id',
                'students.*.relationship' => 'string|max:50',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() ? response()->json(['success' => false, 'errors' => $validator->errors()], 422) : back()->withErrors($validator)->withInput();
            }

            $validated = $validator->validated();
            
            // Custom validation: Gender is required if any relationship is "Guardian"
            if (!empty($validated['students'])) {
                $hasGuardian = collect($validated['students'])->contains(function ($student) {
                    return isset($student['relationship']) && $student['relationship'] === 'Guardian';
                });
                
                if ($hasGuardian && empty($validated['gender'])) {
                    return $request->expectsJson() 
                        ? response()->json(['success' => false, 'errors' => ['gender' => ['Gender is required when relationship is Guardian']], 'message' => 'Validation failed'], 422) 
                        : back()->withErrors(['gender' => 'Gender is required when relationship is Guardian'])->withInput();
                }
            }
            
            // Check if user with this email already exists
            $user = User::where('email', $validated['email'])->first();
            
            if ($user) {
                // Check if this user is already a parent
                $existingParent = ParentModel::where('user_id', $user->id)->first();
                if ($existingParent) {
                    return response()->json(['success' => false, 'message' => 'A parent account with this email already exists'], 422);
                }
            } else {
                // Create User for this parent
                $user = User::create([
                    'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                    'email' => $validated['email'],
                    'password' => bcrypt($validated['password']),
                    'role' => 'parent',
                    'status' => 'active',
                ]);
            }

            // Create the parent record
            $parent = ParentModel::create([
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'gender' => $validated['gender'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);
            
            // Link students with relationships
            if (!empty($validated['students'])) {
                foreach ($validated['students'] as $studentData) {
                    $parent->students()->attach($studentData['student_id'], [
                        'relationship' => $studentData['relationship'] ?? 'Parent',
                    ]);
                }
            }
            
            $parent->load(['user', 'students']);
            
            return $request->expectsJson() ? response()->json(['success' => true, 'data' => $parent, 'message' => 'Parent created successfully'], 201) : redirect()->route('parents.index')->with('success', 'Parent created successfully');
        } catch (\Exception $e) {
            Log::error('Error creating parent: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to create parent: ' . $e->getMessage()], 500) : back()->with('error', 'Failed to create parent');
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $parent = ParentModel::with(['user', 'students'])->findOrFail($id);
            
            if ($request->expectsJson()) {
                return response()->json(['success' => true, 'data' => $parent]);
            }
            
            return Inertia::render('Parents/Show', ['parent' => $parent]);
        } catch (\Exception $e) {
            Log::error('Error fetching parent: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Parent not found'], 404) : back()->with('error', 'Parent not found');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $parent = ParentModel::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'first_name' => 'sometimes|required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:parents,email,' . $id,
                'gender' => 'nullable|in:Male,Female',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'password' => 'nullable|string|min:8|confirmed',
                'students' => 'nullable|array',
                'students.*.student_id' => 'exists:students,id',
                'students.*.relationship' => 'string|max:50',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() ? response()->json(['success' => false, 'errors' => $validator->errors()], 422) : back()->withErrors($validator)->withInput();
            }

            $validated = $validator->validated();
            
            // Custom validation: Gender is required if any relationship is "Guardian"
            if (!empty($validated['students'])) {
                $hasGuardian = collect($validated['students'])->contains(function ($student) {
                    return isset($student['relationship']) && $student['relationship'] === 'Guardian';
                });
                
                $currentGender = $validated['gender'] ?? $parent->gender;
                if ($hasGuardian && empty($currentGender)) {
                    return $request->expectsJson() 
                        ? response()->json(['success' => false, 'errors' => ['gender' => ['Gender is required when relationship is Guardian']], 'message' => 'Validation failed'], 422) 
                        : back()->withErrors(['gender' => 'Gender is required when relationship is Guardian'])->withInput();
                }
            }
            
            // Update parent record
            $parent->update([
                'first_name' => $validated['first_name'] ?? $parent->first_name,
                'middle_name' => $validated['middle_name'] ?? $parent->middle_name,
                'last_name' => $validated['last_name'] ?? $parent->last_name,
                'email' => $validated['email'] ?? $parent->email,
                'gender' => $validated['gender'] ?? $parent->gender,
                'phone' => $validated['phone'] ?? $parent->phone,
                'address' => $validated['address'] ?? $parent->address,
            ]);
            
            // Update user password if provided
            if (!empty($validated['password'])) {
                $parent->user->update([
                    'password' => bcrypt($validated['password']),
                ]);
            }
            
            // Update user email if parent email changed
            if (isset($validated['email']) && $parent->user) {
                $parent->user->update([
                    'email' => $validated['email'],
                    'name' => ($validated['first_name'] ?? $parent->first_name) . ' ' . ($validated['last_name'] ?? $parent->last_name),
                ]);
            }
            
            // Update student links with relationships
            if (isset($validated['students'])) {
                $syncData = [];
                foreach ($validated['students'] as $studentData) {
                    $syncData[$studentData['student_id']] = [
                        'relationship' => $studentData['relationship'] ?? 'Parent',
                    ];
                }
                $parent->students()->sync($syncData);
            }
            
            $parent->load(['user', 'students']);
            
            return $request->expectsJson() ? response()->json(['success' => true, 'data' => $parent, 'message' => 'Parent updated successfully']) : redirect()->route('parents.index')->with('success', 'Parent updated successfully');
        } catch (\Exception $e) {
            Log::error('Error updating parent: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to update parent: ' . $e->getMessage()], 500) : back()->with('error', 'Failed to update parent');
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $parent = ParentModel::findOrFail($id);
            
            // Detach all students
            $parent->students()->detach();
            
            // Delete the parent record
            $parent->delete();
            
            return $request->expectsJson() ? response()->json(['success' => true, 'message' => 'Parent deleted successfully']) : redirect()->route('parents.index')->with('success', 'Parent deleted successfully');
        } catch (\Exception $e) {
            Log::error('Error deleting parent: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to delete parent'], 500) : back()->with('error', 'Failed to delete parent');
        }
    }
}

// ==========================================
// Certificate Controller
// ... (remaining controllers unchanged)
// ==========================================
class CertificateController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Certificate::with(['student', 'issuer']);
            
            if ($studentId = $request->input('student_id')) {
                $query->byStudent($studentId);
            }
            
            if ($type = $request->input('type')) {
                $query->byType($type);
            }
            
            if ($startDate = $request->input('start_date') && $endDate = $request->input('end_date')) {
                $query->byDateRange($startDate, $endDate);
            }
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $certificates = $query->paginate($perPage);
                return response()->json(['success' => true, 'data' => $certificates->items(), 'pagination' => ['current_page' => $certificates->currentPage(), 'last_page' => $certificates->lastPage(), 'per_page' => $certificates->perPage(), 'total' => $certificates->total()]]);
            }
            
            $perPage = $request->input('per_page', 15);
            $certificates = $query->paginate($perPage);
            return Inertia::render('Certificates/Index', ['certificates' => $certificates]);
        } catch (\Exception $e) {
            Log::error('Error fetching certificates: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to retrieve certificates'], 500) : back()->with('error', 'Failed');
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'student_id' => 'required|exists:students,id',
                'issued_by' => 'required|exists:teachers,id',
                'certificate_type' => 'required|in:Completion,Achievement,Maritime Certificate',
                'title' => 'required|string|max:255',
                'date_issued' => 'required|date',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() ? response()->json(['success' => false, 'errors' => $validator->errors()], 422) : back()->withErrors($validator)->withInput();
            }

            $certificate = Certificate::create($validator->validated());
            // $certificate->registerOnBlockchain(); // Assuming this method exists on the Certificate Model
            $certificate->load(['student', 'issuer']);
            
            return $request->expectsJson() ? response()->json(['success' => true, 'data' => $certificate, 'message' => 'Certificate created successfully'], 201) : redirect()->route('certificates.index')->with('success', 'Certificate created');
        } catch (\Exception $e) {
            Log::error('Error creating certificate: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to create certificate'], 500) : back()->with('error', 'Failed');
        }
    }

    public function verify($certificateNumber)
    {
        try {
            $certificate = Certificate::where('certificate_number', $certificateNumber)
                ->with(['student', 'issuer'])
                ->firstOrFail();
            
            // $certificate->verify(); // Assuming this method exists on the Certificate Model
            
            return response()->json(['success' => true, 'data' => $certificate, 'message' => 'Certificate verified successfully']);
        } catch (\Exception $e) {
            Log::error('Error verifying certificate: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Certificate not found'], 404);
        }
    }
}

// ==========================================
// Message Controller
// ==========================================
class MessageController extends Controller
{
    public function index(Request $request)
    {
        try {
            $userId = auth()->id();
            $query = Message::with(['sender', 'receiver'])
                ->where(function($q) use ($userId) {
                    $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
                })
                ->orderBy('created_at', 'desc');
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 20);
                $messages = $query->paginate($perPage);
                return response()->json(['success' => true, 'data' => $messages->items(), 'pagination' => ['current_page' => $messages->currentPage(), 'last_page' => $messages->lastPage(), 'per_page' => $messages->perPage(), 'total' => $messages->total()]]);
            }
            
            $perPage = $request->input('per_page', 20);
            $messages = $query->paginate($perPage);
            return Inertia::render('Messages/Index', ['messages' => $messages]);
        } catch (\Exception $e) {
            Log::error('Error fetching messages: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed to retrieve messages'], 500) : back()->with('error', 'Failed');
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'receiver_id' => 'required|exists:users,id',
                'message' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $message = Message::create([
                'sender_id' => auth()->id(),
                'receiver_id' => $request->receiver_id,
                'message' => $request->message,
            ]);
            
            $message->load(['sender', 'receiver']);
            
            return response()->json(['success' => true, 'data' => $message, 'message' => 'Message sent successfully'], 201);
        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to send message'], 500);
        }
    }

    public function markAsRead($id)
    {
        try {
            $message = Message::findOrFail($id);
            
            if ($message->receiver_id !== auth()->id()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }
            
            // $message->markAsRead(); // Assuming this method exists on the Message Model
            
            return response()->json(['success' => true, 'data' => $message]);
        } catch (\Exception $e) {
            Log::error('Error marking message as read: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed'], 500);
        }
    }
}

// ==========================================
// Announcement Controller
// ==========================================
class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Announcement::with('creator');
            
            if ($audience = $request->input('audience')) {
                $query->byAudience($audience);
            }
            
            if ($request->input('published_only')) {
                $query->published();
            }
            
            $query->orderBy('created_at', 'desc');
            
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $announcements = $query->paginate($perPage);
                return response()->json(['success' => true, 'data' => $announcements->items(), 'pagination' => ['current_page' => $announcements->currentPage(), 'last_page' => $announcements->lastPage(), 'per_page' => $announcements->perPage(), 'total' => $announcements->total()]]);
            }
            
            $perPage = $request->input('per_page', 15);
            $announcements = $query->paginate($perPage);
            return Inertia::render('Announcements/Index', ['announcements' => $announcements]);
        } catch (\Exception $e) {
            Log::error('Error fetching announcements: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed'], 500) : back()->with('error', 'Failed');
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'target_audience' => 'required|in:All,Teachers,Students,Parents',
                'publish_now' => 'boolean',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() ? response()->json(['success' => false, 'errors' => $validator->errors()], 422) : back()->withErrors($validator)->withInput();
            }

            $data = $validator->safe()->except('publish_now');
            $data['created_by'] = auth()->id();
            
            if ($request->input('publish_now')) {
                $data['published_at'] = now();
            }
            
            $announcement = Announcement::create($data);
            $announcement->load('creator');
            
            return $request->expectsJson() ? response()->json(['success' => true, 'data' => $announcement, 'message' => 'Announcement created'], 201) : redirect()->route('announcements.index')->with('success', 'Created');
        } catch (\Exception $e) {
            Log::error('Error creating announcement: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed'], 500) : back()->with('error', 'Failed');
        }
    }
}

// ==========================================
// Course Material Controller
// ==========================================
class CourseMaterialController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = CourseMaterial::with('classSubject.subject');
            
            if ($classSubjectId = $request->input('class_subject_id')) {
                $query->where('class_subject_id', $classSubjectId);
            }
            
            if ($request->expectsJson()) {
                $materials = $query->get();
                return response()->json(['success' => true, 'data' => $materials]);
            }
            
            $materials = $query->paginate(15);
            return Inertia::render('CourseMaterials/Index', ['materials' => $materials]);
        } catch (\Exception $e) {
            Log::error('Error fetching materials: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed'], 500) : back()->with('error', 'Failed');
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'class_subject_id' => 'required|exists:class_subjects,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'file' => 'required|file|max:10240',
            ]);

            if ($validator->fails()) {
                return $request->expectsJson() ? response()->json(['success' => false, 'errors' => $validator->errors()], 422) : back()->withErrors($validator)->withInput();
            }

            $filePath = $request->file('file')->store('course_materials', 'public');
            
            $material = CourseMaterial::create([
                'class_subject_id' => $request->class_subject_id,
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $filePath,
            ]);
            
            $material->load('classSubject.subject');
            
            return $request->expectsJson() ? response()->json(['success' => true, 'data' => $material, 'message' => 'Material uploaded'], 201) : redirect()->route('course-materials.index')->with('success', 'Uploaded');
        } catch (\Exception $e) {
            Log::error('Error uploading material: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed'], 500) : back()->with('error', 'Failed');
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $material = CourseMaterial::findOrFail($id);
            
            if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
                Storage::disk('public')->delete($material->file_path);
            }
            
            $material->delete();
            
            return $request->expectsJson() ? response()->json(['success' => true, 'message' => 'Deleted']) : redirect()->route('course-materials.index')->with('success', 'Deleted');
        } catch (\Exception $e) {
            Log::error('Error deleting material: ' . $e->getMessage());
            return $request->expectsJson() ? response()->json(['success' => false, 'message' => 'Failed'], 500) : back()->with('error', 'Failed');
        }
    }
}