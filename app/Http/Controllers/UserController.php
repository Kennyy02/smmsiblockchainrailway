<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Display a listing of users (Admin only).
     */
    public function index(Request $request)
    {
        // Only admins can access this
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $query = User::with([
            'student.parents', 
            'teacher', 
            'parent' => function($q) {
                $q->with('students');
            }
        ]);

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by role
        if ($request->has('role') && $request->role !== 'all') {
            $query->byRole($request->role);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Include password and format data
        $users->getCollection()->transform(function ($user) {
            // Make password visible for this response
            $user->makeVisible(['password']);
            $userData = $user->toArray();
            
            // Add role-specific information and contact details
            if ($user->student) {
                $userData['level'] = $user->student->year_level;
                $userData['program'] = $user->student->program;
                $userData['grade'] = $user->student->year_level; // Grade is same as level for students
                $userData['phone'] = $user->student->phone ?? null;
                $userData['address'] = $user->student->address ?? null;
            } elseif ($user->teacher) {
                $userData['level'] = null;
                $userData['program'] = $user->teacher->department ?? 'N/A';
                $userData['grade'] = null;
                $userData['phone'] = $user->teacher->phone ?? null;
                $userData['address'] = null;
            } elseif ($user->parent) {
                $userData['level'] = null;
                $userData['program'] = 'N/A';
                $userData['grade'] = null;
                $userData['phone'] = $user->parent->phone ?? null;
                $userData['address'] = $user->parent->address ?? null;
            } else {
                $userData['level'] = null;
                $userData['program'] = 'N/A';
                $userData['grade'] = null;
                $userData['phone'] = null;
                $userData['address'] = null;
            }
            
            return $userData;
        });

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Update user role (Admin only).
     */
    public function updateRole(Request $request, $id)
    {
        // Only admins can change roles
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'required|in:admin,teacher,student,parent',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = User::findOrFail($id);
            $changer = Auth::user();

            // Check if role can be changed
            if (!$user->canChangeRole($changer)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot change this user\'s role. Admins cannot change their own role.'
                ], 403);
            }

            $oldRole = $user->role;
            $newRole = $request->role;

            // Set the new role using the safe method
            if (!$user->setRole($newRole)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update user role.'
                ], 500);
            }

            // Log the role change
            Log::info('User role changed', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'old_role' => $oldRole,
                'new_role' => $newRole,
                'changed_by' => $changer->id,
                'changed_by_email' => $changer->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User role updated successfully',
                'data' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user role: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user details (Admin only).
     */
    public function show($id)
    {
        // Only admins can access this
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $user = User::with([
                'teacher', 
                'student.parents', 
                'parent' => function($q) {
                    $q->with('students');
                }
            ])->findOrFail($id);
            
            // Make password visible for this response
            $user->makeVisible(['password']);
            $userData = $user->toArray();
            
            // Add role-specific information and contact details
            if ($user->student) {
                $userData['level'] = $user->student->year_level;
                $userData['program'] = $user->student->program;
                $userData['grade'] = $user->student->year_level;
                $userData['phone'] = $user->student->phone ?? null;
                $userData['address'] = $user->student->address ?? null;
            } elseif ($user->teacher) {
                $userData['level'] = null;
                $userData['program'] = $user->teacher->department ?? 'N/A';
                $userData['grade'] = null;
                $userData['phone'] = $user->teacher->phone ?? null;
                $userData['address'] = null;
            } elseif ($user->parent) {
                $userData['level'] = null;
                $userData['program'] = 'N/A';
                $userData['grade'] = null;
                $userData['phone'] = $user->parent->phone ?? null;
                $userData['address'] = $user->parent->address ?? null;
            } else {
                $userData['level'] = null;
                $userData['program'] = 'N/A';
                $userData['grade'] = null;
                $userData['phone'] = null;
                $userData['address'] = null;
            }

            return response()->json([
                'success' => true,
                'data' => $userData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
    }
}

