<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
            'role' => 'required|in:super_admin,admin,teacher,student,parent',
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

            // Only super_admin can create admins
            if ($request->role === 'admin' && !$changer->isSuperAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only Super Admin can create Admin accounts.'
                ], 403);
            }

            // Prevent creating or changing to super_admin role
            if ($request->role === 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot assign super_admin role. This role is managed through environment variables only.'
                ], 403);
            }

            // Check if role can be changed
            if (!$user->canChangeRole($changer)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot change this user\'s role. Admins cannot change their own role or super_admin roles.'
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

    /**
     * Send account information to user via email (Admin only).
     */
    public function sendAccountInfo($id)
    {
        // Only admins can access this
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $user = User::findOrFail($id);
            
            // Check if user has already changed their password
            $passwordAlreadyChanged = !is_null($user->password_changed_at);
            
            // Generate a new temporary password
            $temporaryPassword = Str::random(12); // Generate 12-character random password
            
            // Update user's password with the temporary password
            $user->password = Hash::make($temporaryPassword);
            
            // Reset password change flags since we're setting a new auto-generated password
            $user->must_change_password = true;
            $user->password_changed_at = null; // Reset to null since password is now auto-generated again
            
            $user->save();
            
            // Send email with account information
            try {
                Mail::send('emails.account-info', [
                    'user' => $user,
                    'email' => $user->email,
                    'password' => $temporaryPassword,
                    'appName' => config('app.name', 'School Management System')
                ], function ($message) use ($user) {
                    $message->to($user->email)
                            ->subject('Your Account Information - ' . config('app.name', 'School Management System'));
                });
                
                $message = 'Account information sent successfully to ' . $user->email . '.';
                if ($passwordAlreadyChanged) {
                    $message .= ' Note: User\'s password has been reset to a new auto-generated password. They will be required to change it on next login.';
                }

                Log::info('Account information sent', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'sent_by' => Auth::user()->id,
                    'password_was_changed' => $passwordAlreadyChanged,
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'password_reset' => $passwordAlreadyChanged,
                    'generated_password' => $temporaryPassword, // Return generated password to admin
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send account info email: ' . $e->getMessage());
                
                // Revert password change if email failed
                // Note: In production, you might want to handle this differently
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send email: ' . $e->getMessage()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error sending account info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'User not found or error occurred'
            ], 404);
        }
    }

    /**
     * Send reminder email to user without resetting password (Admin only).
     */
    public function sendReminder($id)
    {
        // Only admins can access this
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $user = User::findOrFail($id);
            
            // Check if user has already changed their password
            if (!is_null($user->password_changed_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot send reminder. User has already changed their password.'
                ], 400);
            }
            
            // Send reminder email
            try {
                Mail::send('emails.password-reminder', [
                    'user' => $user,
                    'email' => $user->email,
                    'appName' => config('app.name', 'School Management System')
                ], function ($message) use ($user) {
                    $message->to($user->email)
                            ->subject('Reminder: Your Account Login Information - ' . config('app.name', 'School Management System'));
                });
                
                Log::info('Password reminder sent', [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'sent_by' => Auth::user()->id,
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Reminder sent successfully to ' . $user->email . '.',
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send reminder email: ' . $e->getMessage());
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send email: ' . $e->getMessage()
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error sending reminder: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'User not found or error occurred'
            ], 404);
        }
    }

    /**
     * Verify password for accessing User Password Management (Admin only).
     */
    public function verifyAccessPassword(Request $request)
    {
        // Only admins can access this
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Password is required.'
            ], 422);
        }

        $providedPassword = $request->password;
        $correctPassword = env('USER_PASSWORD_MANAGEMENT_PASSWORD', 'administrator');

        if ($providedPassword === $correctPassword) {
            // Store verification in session
            session(['user_password_management_verified' => true]);
            session(['user_password_management_verified_at' => now()]);

            Log::info('User Password Management access verified', [
                'user_id' => Auth::user()->id,
                'user_email' => Auth::user()->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password verified successfully.'
            ]);
        } else {
            Log::warning('Failed User Password Management access attempt', [
                'user_id' => Auth::user()->id,
                'user_email' => Auth::user()->email,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Incorrect password. Please try again.'
            ], 401);
        }
    }
}

