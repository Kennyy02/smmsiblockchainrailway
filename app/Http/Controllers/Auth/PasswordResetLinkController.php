<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset OTP request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if email is registered in the system
        if (!$user) {
            return back()->withErrors(['email' => 'This email address is not registered in the system. Please check your email and try again.']);
        }

        // Generate 6-digit OTP
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

            // Store email in session for OTP verification step
            Session::put('password_reset_email', $user->email);

            Log::info('Password reset OTP sent', [
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);

            return redirect()->route('password.reset.verify')->with('status', 'A password reset code has been sent to your email address.');
        } catch (\Exception $e) {
            Log::error('Failed to send password reset OTP: ' . $e->getMessage());
            return back()->withErrors(['email' => 'Failed to send reset code. Please try again later.']);
        }
    }
}
