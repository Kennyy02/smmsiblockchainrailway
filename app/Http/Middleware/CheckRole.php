<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return redirect()->route('student.dashboard');
        }

        // Allow super_admin access for 'admin' role routes
        $hasAccess = false;
        foreach ($roles as $allowedRole) {
            if ($user->role === $allowedRole) {
                $hasAccess = true;
                break;
            }
            // super_admin can access admin routes
            if ($allowedRole === 'admin' && $user->role === 'super_admin') {
                $hasAccess = true;
                break;
            }
        }
        
        if (!$hasAccess) {
            // Redirect to user's own dashboard based on their role
            $userRole = $user->role;
            
            // Use switch statement for better compatibility
            switch ($userRole) {
                case 'super_admin':
                case 'admin':
                    $dashboardRoute = 'admin.dashboard';
                    break;
                case 'teacher':
                    $dashboardRoute = 'teacher.dashboard';
                    break;
                case 'student':
                    $dashboardRoute = 'student.dashboard';
                    break;
                case 'parent':
                    $dashboardRoute = 'parent.dashboard';
                    break;
                default:
                    $dashboardRoute = 'student.dashboard';
                    break;
            }
            
            return redirect()->route($dashboardRoute);
        }

        return $next($request);
    }
}