<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetOtpController extends Controller
{
    /**
     * Show OTP verification page for password reset
     */
    public function show(Request $request): Response|RedirectResponse
    {
        // Check if email is in session (from forgot password step)
        if (!Session::has('password_reset_email')) {
            return redirect()->route('password.request')->withErrors(['email' => 'Please request a password reset first.']);
        }

        return Inertia::render('auth/reset-password-otp', [
            'email' => Session::get('password_reset_email'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Verify OTP and proceed to password reset
     */
    public function verify(Request $request): RedirectResponse
    {
        $email = Session::get('password_reset_email');
        
        if (!$email) {
            return redirect()->route('password.request')->withErrors(['email' => 'Session expired. Please request a password reset again.']);
        }

        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $user = User::where('email', $email)->first();

        if (!$user) {
            return redirect()->route('password.request')->withErrors(['email' => 'User not found.']);
        }

        // Check if OTP exists
        if (!$user->password_reset_otp) {
            return back()->withErrors(['otp' => 'No reset code found. Please request a new one.']);
        }

        // Check if OTP has expired
        if (now()->isAfter($user->password_reset_otp_expires_at)) {
            return back()->withErrors(['otp' => 'Reset code has expired. Please request a new one.']);
        }

        // Check if OTP matches
        if ($request->otp !== $user->password_reset_otp) {
            return back()->withErrors(['otp' => 'Invalid reset code. Please try again.']);
        }

        // Store verified OTP in session to allow password reset
        Session::put('password_reset_verified', true);
        Session::put('password_reset_user_id', $user->id);

        return redirect()->route('password.reset.form');
    }

    /**
     * Resend OTP for password reset
     */
    public function resend(Request $request): RedirectResponse
    {
        $email = Session::get('password_reset_email');
        
        if (!$email) {
            return redirect()->route('password.request')->withErrors(['email' => 'Please request a password reset first.']);
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            return redirect()->route('password.request');
        }

        // Generate new 6-digit OTP
        $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP in database (expires in 10 minutes)
        $user->update([
            'password_reset_otp' => $otp,
            'password_reset_otp_expires_at' => now()->addMinutes(10),
        ]);

        // Send OTP via email
        try {
            Mail::mailer('smtp')->send('emails.password-reset-otp', [
                'otp' => $otp,
                'user' => $user,
                'expires_in' => 10,
            ], function ($message) use ($user) {
                $message->to($user->email)
                        ->from(config('mail.from.address'), config('mail.from.name'))
                        ->subject('Password Reset Code - ' . config('app.name', 'School Management System'));
            });

            return back()->with('status', 'A new reset code has been sent to your email address.');
        } catch (\Exception $e) {
            return back()->withErrors(['otp' => 'Failed to send reset code. Please try again later.']);
        }
    }
}

