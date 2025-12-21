<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ContentSecurityPolicy
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only apply CSP to HTML responses
        if ($response->headers->get('Content-Type') && str_contains($response->headers->get('Content-Type'), 'text/html')) {
            // Generate nonce for inline scripts
            $nonce = base64_encode(random_bytes(16));
            
            // Set CSP header
            // Note: 'unsafe-eval' is required for Ziggy's @routes directive
            // which uses Function constructor to create route helpers
            $csp = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.bunny.net",
                "style-src 'self' 'unsafe-inline' https://fonts.bunny.net",
                "font-src 'self' https://fonts.bunny.net data:",
                "img-src 'self' data: blob: https:",
                "connect-src 'self' https:",
                "frame-src 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
                "upgrade-insecure-requests",
            ];

            $response->headers->set('Content-Security-Policy', implode('; ', $csp));
        }

        return $response;
    }
}

