<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\OtpVerificationController; // ADD THIS
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // Registration routes removed - Only Admin can create users
    // Route::get('register', [RegisteredUserController::class, 'create'])->name('register');
    // Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');

    // OTP-based password reset routes
    Route::get('reset-password/verify', [\App\Http\Controllers\Auth\PasswordResetOtpController::class, 'show'])->name('password.reset.verify');
    Route::post('reset-password/verify', [\App\Http\Controllers\Auth\PasswordResetOtpController::class, 'verify']);
    Route::post('reset-password/resend', [\App\Http\Controllers\Auth\PasswordResetOtpController::class, 'resend'])->name('password.reset.resend');
    
    Route::get('reset-password', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'show'])->name('password.reset.form');
    Route::post('reset-password', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'store'])->name('password.store');
});

Route::middleware('auth')->group(function () {
    // Password change routes (must be accessible even if password change is required)
    Route::get('password/change', [ChangePasswordController::class, 'show'])->name('password.change');
    Route::post('password/change', [ChangePasswordController::class, 'update'])->name('password.update');
    // OTP Verification Routes (BEFORE 'verified' middleware)
    Route::get('verify-otp', [OtpVerificationController::class, 'show'])->name('otp.verify');
    Route::post('verify-otp', [OtpVerificationController::class, 'verify']);
    Route::post('resend-otp', [OtpVerificationController::class, 'resend'])->name('otp.resend');

    // Email Verification (legacy, can keep or remove)
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    // This route is deprecated - use password/change instead
    // Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});