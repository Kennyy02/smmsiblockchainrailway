<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $email = $this->string('email');
        $password = $this->string('password');

        // SUPER ADMIN: Check env credentials FIRST (super admin is env-only, NOT in database)
        $envEmail = env('ADMIN_EMAIL');
        $envPassword = env('ADMIN_PASSWORD');

        // If credentials match env, this is super_admin (env-only)
        // Skip database authentication entirely for super admin
        if ($envEmail && $envPassword && $email === $envEmail && $password === $envPassword) {
            // Super admin authentication via env - bypass database completely
            RateLimiter::clear($this->throttleKey());
            return; // AuthenticatedSessionController will handle super_admin login
        }

        // For all OTHER users (NOT super_admin), use standard database authentication
        // IMPORTANT: If email matches env email but password doesn't, still fail (super admin is env-only)
        if ($envEmail && $email === $envEmail) {
            // Email matches env but password doesn't - this means wrong super admin password
            RateLimiter::hit($this->throttleKey());
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Regular database users (not super_admin email)
        try {
            if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
                RateLimiter::hit($this->throttleKey());

                throw ValidationException::withMessages([
                    'email' => __('auth.failed'),
                ]);
            }

            RateLimiter::clear($this->throttleKey());
        } catch (\RuntimeException $e) {
            // Handle password hashing issues
            if (str_contains($e->getMessage(), 'Bcrypt')) {
                RateLimiter::hit($this->throttleKey());
                
                throw ValidationException::withMessages([
                    'email' => 'Authentication failed. Please contact administrator to reset your password.',
                ]);
            }
            
            // Re-throw if it's a different error
            throw $e;
        }
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
