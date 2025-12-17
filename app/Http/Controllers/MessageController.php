<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class MessageController extends Controller
{
    /**
     * Display a listing of messages (API & Inertia).
     * Shows conversation threads for the authenticated user.
     */
    public function index(Request $request)
    {
        try {
            $userId = Auth::id();
            
            // Get all conversations (grouped by other user)
            $conversations = Message::select(
                    DB::raw('CASE 
                        WHEN sender_id = ? THEN receiver_id 
                        ELSE sender_id 
                    END as other_user_id'),
                    DB::raw('MAX(created_at) as last_message_at'),
                    DB::raw('COUNT(CASE WHEN receiver_id = ? AND is_read = 0 THEN 1 END) as unread_count')
                )
                ->where(function($q) use ($userId) {
                    $q->where('sender_id', $userId)
                      ->orWhere('receiver_id', $userId);
                })
                ->setBindings([$userId, $userId])
                ->groupBy('other_user_id')
                ->orderBy('last_message_at', 'desc')
                ->get();

            // Eager load other users
            $otherUserIds = $conversations->pluck('other_user_id')->unique();
            $users = User::whereIn('id', $otherUserIds)->get()->keyBy('id');
            
            // Attach user data to conversations
            $conversations = $conversations->map(function($conv) use ($users) {
                $conv->other_user = $users->get($conv->other_user_id);
                return $conv;
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $conversations
                ]);
            }

            return Inertia::render('Messages/Index', [
                'conversations' => $conversations,
                'users' => User::where('id', '!=', $userId)->get()
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching messages: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve messages',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve messages');
        }
    }

    /**
     * Get conversation between current user and another user.
     */
    public function getConversation(Request $request, $userId)
    {
        try {
            $currentUserId = Auth::id();
            
            $query = Message::betweenUsers($currentUserId, $userId)
                ->with(['sender', 'receiver'])
                ->orderBy('created_at', 'asc');

            // Mark messages as read
            Message::where('sender_id', $userId)
                ->where('receiver_id', $currentUserId)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            if ($request->expectsJson()) {
                $messages = $query->get();
                return response()->json([
                    'success' => true,
                    'data' => $messages
                ]);
            }

            $messages = $query->paginate(50);
            $otherUser = User::findOrFail($userId);

            return Inertia::render('Messages/Conversation', [
                'messages' => $messages,
                'otherUser' => $otherUser
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching conversation: ' . $e->getMessage());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve conversation',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return back()->with('error', 'Failed to retrieve conversation');
        }
    }

    /**
     * Store a newly created message in storage (API & Inertia).
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'receiver_id' => 'required|exists:users,id|different:' . Auth::id(),
                'message' => 'required|string|max:5000',
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

            $message = Message::create([
                'sender_id' => Auth::id(),
                'receiver_id' => $request->receiver_id,
                'message' => $request->message,
                'is_read' => false
            ]);

            $message->load(['sender', 'receiver']);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $message,
                    'message' => 'Message sent successfully'
                ], 201);
            }

            return redirect()->route('messages.conversation', $request->receiver_id)
                ->with('success', 'Message sent successfully');

        } catch (\Exception $e) {
            Log::error('Error sending message: ' . $e->getMessage());
            
            return $request->expectsJson()
                ? response()->json([
                    'success' => false,
                    'message' => 'Failed to send message',
                    'error' => $e->getMessage()
                ], 500)
                : back()->with('error', 'Failed to send message')->withInput();
        }
    }

    /**
     * Display the specified message (API & Inertia).
     */
    public function show(Request $request, $id)
    {
        try {
            $message = Message::with(['sender', 'receiver'])->findOrFail($id);
            
            // Ensure user has access to this message
            $userId = Auth::id();
            if ($message->sender_id !== $userId && $message->receiver_id !== $userId) {
                return $request->expectsJson()
                    ? response()->json([
                        'success' => false,
                        'message' => 'Unauthorized access'
                    ], 403)
                    : back()->with('error', 'Unauthorized access');
            }

            // Mark as read if current user is receiver
            if ($message->receiver_id === $userId && !$message->is_read) {
                $message->markAsRead();
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $message
                ]);
            }

            return Inertia::render('Messages/Show', [
                'message' => $message
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching message: ' . $e->getMessage());
            
            return $request->expectsJson()
                ? response()->json([
                    'success' => false,
                    'message' => 'Message not found',
                    'error' => $e->getMessage()
                ], 404)
                : back()->with('error', 'Message not found');
        }
    }

    /**
     * Mark a message as read (API only).
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $message = Message::findOrFail($id);
            
            // Ensure current user is the receiver
            if ($message->receiver_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $message->markAsRead();

            return response()->json([
                'success' => true,
                'data' => $message,
                'message' => 'Message marked as read'
            ]);

        } catch (\Exception $e) {
            Log::error('Error marking message as read: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark message as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a message as unread (API only).
     */
    public function markAsUnread(Request $request, $id)
    {
        try {
            $message = Message::findOrFail($id);
            
            // Ensure current user is the receiver
            if ($message->receiver_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }

            $message->markAsUnread();

            return response()->json([
                'success' => true,
                'data' => $message,
                'message' => 'Message marked as unread'
            ]);

        } catch (\Exception $e) {
            Log::error('Error marking message as unread: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark message as unread',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all messages from a specific user as read (API only).
     */
    public function markAllAsRead(Request $request, $senderId)
    {
        try {
            $updated = Message::where('sender_id', $senderId)
                ->where('receiver_id', Auth::id())
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'data' => [
                    'updated_count' => $updated
                ],
                'message' => "{$updated} message(s) marked as read"
            ]);

        } catch (\Exception $e) {
            Log::error('Error marking all messages as read: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark messages as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get unread messages count (API only).
     */
    public function getUnreadCount()
    {
        try {
            $count = Message::where('receiver_id', Auth::id())
                ->unread()
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'unread_count' => $count
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching unread count: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all unread messages (API only).
     */
    public function getUnread(Request $request)
    {
        try {
            $query = Message::where('receiver_id', Auth::id())
                ->unread()
                ->with(['sender'])
                ->orderBy('created_at', 'desc');

            if ($request->input('paginate', true)) {
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
            } else {
                $messages = $query->get();
                
                return response()->json([
                    'success' => true,
                    'data' => $messages
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error fetching unread messages: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve unread messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sent messages (API & Inertia).
     */
    public function getSent(Request $request)
    {
        try {
            $query = Message::bySender(Auth::id())
                ->with(['receiver'])
                ->orderBy('created_at', 'desc');

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

            $perPage = $request->input('per_page', 15);
            $messages = $query->paginate($perPage);

            return Inertia::render('Messages/Sent', [
                'messages' => $messages
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching sent messages: ' . $e->getMessage());
            
            return $request->expectsJson()
                ? response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve sent messages',
                    'error' => $e->getMessage()
                ], 500)
                : back()->with('error', 'Failed to retrieve sent messages');
        }
    }

    /**
     * Get received messages (API & Inertia).
     */
    public function getReceived(Request $request)
    {
        try {
            $query = Message::byReceiver(Auth::id())
                ->with(['sender'])
                ->orderBy('created_at', 'desc');

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

            $perPage = $request->input('per_page', 15);
            $messages = $query->paginate($perPage);

            return Inertia::render('Messages/Received', [
                'messages' => $messages
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching received messages: ' . $e->getMessage());
            
            return $request->expectsJson()
                ? response()->json([
                    'success' => false,
                    'message' => 'Failed to retrieve received messages',
                    'error' => $e->getMessage()
                ], 500)
                : back()->with('error', 'Failed to retrieve received messages');
        }
    }

    /**
     * Delete a conversation with a specific user (API & Inertia).
     */
    public function deleteConversation(Request $request, $userId)
    {
        try {
            $currentUserId = Auth::id();
            
            // Delete all messages between current user and specified user
            $deleted = Message::betweenUsers($currentUserId, $userId)->delete();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'deleted_count' => $deleted
                    ],
                    'message' => "Conversation deleted successfully ({$deleted} message(s) removed)"
                ]);
            }

            return redirect()->route('messages.index')
                ->with('success', 'Conversation deleted successfully');

        } catch (\Exception $e) {
            Log::error('Error deleting conversation: ' . $e->getMessage());
            
            return $request->expectsJson()
                ? response()->json([
                    'success' => false,
                    'message' => 'Failed to delete conversation',
                    'error' => $e->getMessage()
                ], 500)
                : back()->with('error', 'Failed to delete conversation');
        }
    }

    /**
     * Remove the specified message from storage (API & Inertia).
     */
    public function destroy(Request $request, $id)
    {
        try {
            $message = Message::findOrFail($id);
            
            // Ensure user has permission to delete (sender or receiver)
            $userId = Auth::id();
            if ($message->sender_id !== $userId && $message->receiver_id !== $userId) {
                return $request->expectsJson()
                    ? response()->json([
                        'success' => false,
                        'message' => 'Unauthorized'
                    ], 403)
                    : back()->with('error', 'Unauthorized');
            }

            $message->delete();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'Message deleted successfully'
                ]);
            }

            return redirect()->route('messages.index')
                ->with('success', 'Message deleted successfully');

        } catch (\Exception $e) {
            Log::error('Error deleting message: ' . $e->getMessage());
            
            return $request->expectsJson()
                ? response()->json([
                    'success' => false,
                    'message' => 'Failed to delete message',
                    'error' => $e->getMessage()
                ], 500)
                : back()->with('error', 'Failed to delete message');
        }
    }

    /**
     * Search messages (API only).
     */
    public function search(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'query' => 'required|string|min:1',
                'type' => 'nullable|in:sent,received,all'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userId = Auth::id();
            $searchQuery = $request->input('query');
            $type = $request->input('type', 'all');

            $query = Message::where('message', 'like', "%{$searchQuery}%");

            switch ($type) {
                case 'sent':
                    $query->bySender($userId);
                    break;
                case 'received':
                    $query->byReceiver($userId);
                    break;
                default:
                    $query->where(function($q) use ($userId) {
                        $q->where('sender_id', $userId)
                          ->orWhere('receiver_id', $userId);
                    });
            }

            $messages = $query->with(['sender', 'receiver'])
                ->orderBy('created_at', 'desc')
                ->paginate($request->input('per_page', 15));

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

        } catch (\Exception $e) {
            Log::error('Error searching messages: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to search messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get message statistics for current user (API only).
     */
    public function getStats()
    {
        try {
            $userId = Auth::id();

            $totalSent = Message::bySender($userId)->count();
            $totalReceived = Message::byReceiver($userId)->count();
            $unreadCount = Message::byReceiver($userId)->unread()->count();
            $recentCount = Message::where(function($q) use ($userId) {
                    $q->where('sender_id', $userId)
                      ->orWhere('receiver_id', $userId);
                })
                ->recent(7)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_sent' => $totalSent,
                    'total_received' => $totalReceived,
                    'unread_count' => $unreadCount,
                    'recent_messages' => $recentCount,
                    'total_messages' => $totalSent + $totalReceived
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching message stats: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve message statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}