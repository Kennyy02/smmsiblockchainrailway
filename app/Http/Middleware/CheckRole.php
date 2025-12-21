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
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            // Redirect to user's own dashboard based on their role
            $userRole = $request->user()->role ?? 'student';
            $dashboardRoute = match($userRole) {
                'admin' => 'admin.dashboard',
                'teacher' => 'teacher.dashboard',
                'student' => 'student.dashboard',
                'parent' => 'parent.dashboard',
                default => 'student.dashboard',
            };
            
            return redirect()->route($dashboardRoute);
        }

        return $next($request);
    }
}