<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if user is not authenticated
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // Allow access to password change route and logout
        $allowedRoutes = [
            'password.change',
            'password.update',
            'logout',
        ];

        // Check if current route is allowed
        if (in_array($request->route()->getName(), $allowedRoutes)) {
            return $next($request);
        }

        // Redirect to password change if required
        if ($user->must_change_password) {
            return redirect()->route('password.change')
                ->with('warning', 'You must change your password before continuing.');
        }

        return $next($request);
    }
}

