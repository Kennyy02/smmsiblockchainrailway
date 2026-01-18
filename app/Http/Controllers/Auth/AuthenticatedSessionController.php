<?php  

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // Note: 'guest' middleware already handles redirecting authenticated users
        return Inertia::render('auth/login', [
            'canResetPassword' => true, // Password reset via OTP is enabled
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $email = $request->string('email');
        $password = $request->string('password');

        // Check if this is super_admin login (from env, not database)
        // Super admin credentials are ONLY in env, never in database
        $envEmail = env('ADMIN_EMAIL');
        $envPassword = env('ADMIN_PASSWORD');

        // Debug logging (remove after testing)
        \Log::info('Super Admin Login Attempt', [
            'input_email' => $email,
            'input_password_length' => strlen($password),
            'env_email' => $envEmail ? 'SET' : 'NOT SET',
            'env_password' => $envPassword ? 'SET' : 'NOT SET',
            'email_match' => $email === $envEmail,
            'password_match' => $password === $envPassword,
        ]);

        // IMPORTANT: Check env credentials BEFORE database lookup
        // Super admin is env-only, so if credentials match env, it's super admin
        // Use trim() to handle any whitespace issues
        if ($envEmail && $envPassword && trim($email) === trim($envEmail) && trim($password) === trim($envPassword)) {
            // Super admin: Create a temporary User object for session (no database record)
            $superAdmin = new \App\Models\User([
                'id' => 0, // Special ID to indicate env-based user
                'name' => env('ADMIN_NAME', 'Super Administrator'),
                'email' => $envEmail,
                'role' => 'super_admin',
                'status' => 'active',
                'email_verified_at' => now(),
                'password_changed_at' => now(), // Super admin doesn't need password change
            ]);
            $superAdmin->exists = false; // Mark as non-persistent

            // Manually log in the super admin (bypass database)
            Auth::login($superAdmin, $request->boolean('remember'));
            $request->session()->regenerate();
            
            // Redirect super admin to admin dashboard
            return redirect()->intended(route('admin.dashboard'));
        }

        // Standard authentication for database users
        $request->authenticate();
        $request->session()->regenerate();

        // Get authenticated user
        $user = Auth::user();

        // If user must change password or password was never changed (still auto-generated), redirect to password change page
        if ($user->must_change_password || is_null($user->password_changed_at)) {
            return redirect()->route('password.change')
                ->with('warning', 'You must change your password before continuing.');
        }

        // Redirect based on user role
        switch ($user->role) {
            case 'admin':
            case 'super_admin':
                return redirect()->intended(route('admin.dashboard'));

            case 'student':
                return redirect()->intended(route('student.dashboard'));

            case 'parent':
                return redirect()->intended(route('parent.dashboard'));

            case 'teacher':
                return redirect()->intended(route('teacher.dashboard'));

            case 'user':
                return redirect()->intended(route('user.dashboard'));

            default:
                return redirect()->intended(route('dashboard'));
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
