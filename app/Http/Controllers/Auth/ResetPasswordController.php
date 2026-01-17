<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class ResetPasswordController extends Controller
{
    /**
     * Show password reset form (after OTP verification)
     */
    public function show(Request $request): Response|RedirectResponse
    {
        // Check if OTP has been verified
        if (!Session::get('password_reset_verified') || !Session::get('password_reset_user_id')) {
            return redirect()->route('password.request')->withErrors(['email' => 'Please verify your reset code first.']);
        }

        return Inertia::render('auth/reset-password');
    }

    /**
     * Handle password reset
     */
    public function store(Request $request): RedirectResponse
    {
        // Check if OTP has been verified
        if (!Session::get('password_reset_verified') || !Session::get('password_reset_user_id')) {
            return redirect()->route('password.request')->withErrors(['email' => 'Session expired. Please start over.']);
        }

        $userId = Session::get('password_reset_user_id');
        $user = User::find($userId);

        if (!$user) {
            Session::forget(['password_reset_verified', 'password_reset_user_id', 'password_reset_email']);
            return redirect()->route('password.request')->withErrors(['email' => 'User not found.']);
        }

        $validator = Validator::make($request->all(), [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

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

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->password_changed_at = now();
        $user->password_reset_otp = null;
        $user->password_reset_otp_expires_at = null;
        $user->save();

        // Clear session
        Session::forget(['password_reset_verified', 'password_reset_user_id', 'password_reset_email']);

        return redirect()->route('login')->with('status', 'Password has been reset successfully. You can now login with your new password.');
    }
}

