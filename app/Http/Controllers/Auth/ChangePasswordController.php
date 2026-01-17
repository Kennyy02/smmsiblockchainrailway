<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class ChangePasswordController extends Controller
{
    /**
     * Show the password change form.
     */
    public function show(): Response
    {
        $user = Auth::user();
        
        // If password already changed, redirect to dashboard
        // Check both must_change_password flag and password_changed_at timestamp
        if (!$user->must_change_password && !is_null($user->password_changed_at)) {
            return $this->redirectToDashboard($user);
        }

        return Inertia::render('auth/change-password');
    }

    /**
     * Handle password change request.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            $validator->errors()->add('current_password', 'The current password is incorrect.');
            
            return back()->withErrors($validator)->withInput();
        }

        // Custom validation for password complexity
        $password = $request->password;
        
        if (strlen($password) < 8) {
            $validator->errors()->add('password', 'Password must be at least 8 characters long.');
        }
        if (!preg_match('/[A-Z]/', $password)) {
            $validator->errors()->add('password', 'Password must contain at least one uppercase letter (A-Z).');
        }
        if (!preg_match('/[0-9]/', $password)) {
            $validator->errors()->add('password', 'Password must contain at least one number (0-9).');
        }
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $validator->errors()->add('password', 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?).');
        }
        
        // Check if new password is different from current password
        if (Hash::check($request->password, $user->password)) {
            $validator->errors()->add('password', 'The new password must be different from your current password.');
        }

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->password_changed_at = now();
        $user->save();

        // Redirect to appropriate dashboard based on user role
        return $this->redirectToDashboard($user)
            ->with('success', 'Password changed successfully!');
    }

    /**
     * Redirect user to their dashboard based on role.
     */
    private function redirectToDashboard($user)
    {
        switch ($user->role) {
            case 'admin':
                return redirect()->route('admin.dashboard');
            case 'student':
                return redirect()->route('student.dashboard');
            case 'parent':
                return redirect()->route('parent.dashboard');
            case 'teacher':
                return redirect()->route('teacher.dashboard');
            default:
                return redirect()->route('dashboard');
        }
    }
}

