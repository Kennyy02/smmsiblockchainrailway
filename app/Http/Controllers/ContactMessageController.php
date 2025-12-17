<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ContactMessageController extends Controller
{
    /**
     * Display a listing of contact messages (Admin only)
     */
    public function index(Request $request)
    {
        try {
            $query = ContactMessage::with('repliedByUser');

            // Apply status filter
            if ($status = $request->input('status')) {
                $query->byStatus($status);
            }

            // Apply search filter
            if ($search = $request->input('search')) {
                $query->search($search);
            }

            // Apply sorting
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Check if request expects JSON
            if ($request->expectsJson()) {
                $perPage = $request->input('per_page', 15);
                $messages = $query->paginate($perPage);

                return response()->json([
                    'success' => true,
                    'data' => $messages->items(),
                    'pagination' => [
                        'current_page' => $messages->currentPage(),
                        'last_page' => $messages->lastPage(),
                        'per_page' => $messages->perPage(),
                        'total' => $messages->total()
                    ]
                ]);
            }

            // Return Inertia view for admin
            return Inertia::render('Admin/ContactMessages', [
                'initialMessages' => $query->paginate(15),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching contact messages: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve contact messages',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to load contact messages');
        }
    }

    /**
     * Store a new contact message (Public - no auth required)
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'subject' => 'required|string|max:255',
                'message' => 'required|string|max:5000',
            ]);

            $contactMessage = ContactMessage::create([
                ...$validated,
                'status' => 'unread',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            Log::info('New contact message received', [
                'id' => $contactMessage->id,
                'email' => $contactMessage->email,
                'subject' => $contactMessage->subject,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Your message has been sent successfully. We will respond within 24 hours.',
                'data' => $contactMessage
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error storing contact message: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a single contact message
     */
    public function show(Request $request, ContactMessage $contactMessage)
    {
        try {
            // Mark as read when viewing
            $contactMessage->markAsRead();
            $contactMessage->load('repliedByUser');

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $contactMessage
                ]);
            }

            return Inertia::render('Admin/ContactMessageDetail', [
                'message' => $contactMessage,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching contact message: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update contact message status or add admin notes
     */
    public function update(Request $request, ContactMessage $contactMessage)
    {
        try {
            $validated = $request->validate([
                'status' => 'sometimes|in:unread,read,replied,archived',
                'admin_notes' => 'sometimes|nullable|string|max:5000',
            ]);

            // If marking as replied, set the replied_by and replied_at
            if (isset($validated['status']) && $validated['status'] === 'replied') {
                $validated['replied_by'] = $request->user()->id;
                $validated['replied_at'] = now();
            }

            $contactMessage->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Message updated successfully',
                'data' => $contactMessage->fresh()->load('repliedByUser')
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating contact message: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a contact message
     */
    public function destroy(ContactMessage $contactMessage)
    {
        try {
            $contactMessage->delete();

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting contact message: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get contact message statistics
     */
    public function getStats(Request $request)
    {
        try {
            $stats = [
                'total' => ContactMessage::count(),
                'unread' => ContactMessage::unread()->count(),
                'read' => ContactMessage::read()->count(),
                'replied' => ContactMessage::replied()->count(),
                'archived' => ContactMessage::archived()->count(),
                'today' => ContactMessage::whereDate('created_at', today())->count(),
                'this_week' => ContactMessage::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching contact message stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark multiple messages as read
     */
    public function markAsRead(Request $request)
    {
        try {
            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'integer|exists:contact_messages,id',
            ]);

            ContactMessage::whereIn('id', $validated['ids'])
                ->where('status', 'unread')
                ->update(['status' => 'read']);

            return response()->json([
                'success' => true,
                'message' => 'Messages marked as read'
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking messages as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
