<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AnnouncementController extends Controller
{
    /**
     * Get validation rules for announcements
     */
    private function announcementRules(bool $isUpdate = false): array
    {
        $prefix = $isUpdate ? 'sometimes|' : '';
        
        return [
            'title' => $prefix . 'required|string|max:255',
            'content' => $prefix . 'required|string',
            'target_audience' => $prefix . 'required|in:All,Teachers,Students,Parents',
            'published_at' => 'nullable|date',
        ];
    }

    /**
     * Display a listing of announcements (API & Inertia).
     * GET /api/announcements
     */
    public function index(Request $request)
    {
        try {
            $query = Announcement::with('creator'); // FIXED: removed .user
            
            // Apply search filter on title and content
            if ($search = $request->input('search')) {
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%");
                });
            }

            // Apply audience filter
            if ($audience = $request->input('audience')) {
                $query->byAudience($audience); 
            }
            
            // Apply status filter (maps client-side status to model scopes)
            if ($status = $request->input('status')) {
                match($status) {
                    'Published' => $query->published(),
                    'Draft' => $query->draft(),
                    'Scheduled' => $query->scheduled(),
                    default => null
                };
            }
            
            // Apply sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            $perPage = $request->input('per_page', 15);
            $announcements = $query->paginate($perPage);
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true, 
                    'data' => $announcements->items(), 
                    'pagination' => [
                        'current_page' => $announcements->currentPage(), 
                        'last_page' => $announcements->lastPage(), 
                        'per_page' => $announcements->perPage(), 
                        'total' => $announcements->total()
                    ]
                ]);
            }
            
            return Inertia::render('Admin/Announcements', [
                'announcements' => $announcements
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching announcements: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve announcements'], 500);
        }
    }

    /**
     * Store a newly created announcement (API & Inertia).
     * POST /api/announcements
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), $this->announcementRules());

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'errors' => $validator->errors(), 
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            // Ensure published_at is properly null if empty
            $publishedAt = $request->published_at;
            if (empty($publishedAt) || $publishedAt === '') {
                $publishedAt = null;
            }

            $announcement = Announcement::create([
                'created_by' => $request->user()->id, 
                'title' => $request->title,
                'content' => $request->content,
                'target_audience' => $request->target_audience,
                'published_at' => $publishedAt,
            ]);

            $announcement->load('creator'); // FIXED: removed .user

            return response()->json([
                'success' => true, 
                'data' => $announcement, 
                'message' => 'Announcement created successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating announcement: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to create announcement', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified announcement.
     * GET /api/announcements/{id}
     */
    public function show($id)
    {
        try {
            $announcement = Announcement::with('creator')->findOrFail($id); // FIXED: removed .user
            return response()->json(['success' => true, 'data' => $announcement]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Announcement not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching announcement: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve announcement'], 500);
        }
    }

    /**
     * Update the specified announcement (API & Inertia).
     * PUT/PATCH /api/announcements/{id}
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), $this->announcementRules(true));

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 
                'errors' => $validator->errors(), 
                'message' => 'Validation failed'
            ], 422);
        }
        
        try {
            $announcement = Announcement::findOrFail($id);
            
            // Prepare update data
            $updateData = $request->only(['title', 'content', 'target_audience']);
            
            // Handle published_at separately to ensure null handling
            if ($request->has('published_at')) {
                $publishedAt = $request->published_at;
                $updateData['published_at'] = (empty($publishedAt) || $publishedAt === '') ? null : $publishedAt;
            }
            
            $announcement->update($updateData);
            
            $announcement->load('creator'); // FIXED: removed .user

            return response()->json([
                'success' => true, 
                'data' => $announcement, 
                'message' => 'Announcement updated successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Announcement not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error updating announcement: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Failed to update announcement', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified announcement from storage (API & Inertia).
     * DELETE /api/announcements/{id}
     */
    public function destroy(Request $request, $id)
    {
        try {
            $announcement = Announcement::findOrFail($id);
            $announcementTitle = $announcement->title;
            
            $announcement->delete();
            
            // Return appropriate response based on request type
            return $request->expectsJson()
                ? response()->json(['success' => true, 'message' => "Announcement '{$announcementTitle}' deleted successfully"])
                : redirect()->route('announcements.index')->with('success', "Announcement '{$announcementTitle}' deleted successfully");
        } catch (ModelNotFoundException $e) {
            return $request->expectsJson() 
                ? response()->json(['success' => false, 'message' => 'Announcement not found'], 404)
                : back()->with('error', 'Announcement not found');
        } catch (\Exception $e) {
            Log::error('Error deleting announcement: ' . $e->getMessage());
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => 'Failed to delete announcement', 'error' => $e->getMessage()], 500)
                : back()->with('error', 'Failed to delete announcement');
        }
    }

    /**
     * Get announcement statistics (API only).
     * GET /api/announcements/stats
     */
    public function getStats()
    {
        try {
            $total = Announcement::count();
            $published = Announcement::published()->count();
            $draft = Announcement::draft()->count();
            $scheduled = Announcement::scheduled()->count();

            // Count announcements published today
            $todayCount = Announcement::published()->whereDate('published_at', now()->toDateString())->count();

            // Stats by audience (groups counts by the target_audience column)
            $byAudience = Announcement::select('target_audience')
                ->selectRaw('count(*) as count')
                ->groupBy('target_audience')
                ->get()
                ->map(fn($item) => ['audience' => $item->target_audience, 'count' => $item->count]);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_announcements' => $total,
                    'published_count' => $published,
                    'draft_count' => $draft,
                    'scheduled_count' => $scheduled,
                    'today_count' => $todayCount,
                    'by_audience' => $byAudience,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching announcement stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve announcement statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get the currently published announcements for a specific user type (Public endpoint logic).
     * GET /api/announcements/published/{audience}
     */
    public function getPublishedForUser(Request $request, $audience)
    {
        try {
            $announcements = Announcement::published()
                ->where(function($query) use ($audience) {
                    // Filter for 'All' audience OR the specific audience type requested
                    $query->byAudience('All')
                          ->orWhere('target_audience', $audience);
                })
                ->with('creator') // FIXED: removed .user
                ->orderBy('published_at', 'desc')
                ->take($request->input('limit', 10))
                ->get();

            return response()->json(['success' => true, 'data' => $announcements]);
        } catch (\Exception $e) {
            Log::error('Error fetching published announcements: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve announcements'], 500);
        }
    }
}