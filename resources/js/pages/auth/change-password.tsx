import { Head, useForm, router } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ChangePasswordForm = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

interface ChangePasswordProps {
    status?: string;
}

export default function ChangePassword({ status }: ChangePasswordProps) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm<ChangePasswordForm>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Handle redirect after successful password change
    useEffect(() => {
        if (status === 'success') {
            // Get user role from Inertia props if available
            const user = (window as any).__inertia?.page?.props?.auth?.user;
            if (user) {
                setTimeout(() => {
                    switch (user.role) {
                        case 'admin':
                            router.visit('/admin/dashboard');
                            break;
                        case 'student':
                            router.visit('/student/dashboard');
                            break;
                        case 'parent':
                            router.visit('/parent/dashboard');
                            break;
                        case 'teacher':
                            router.visit('/teacher/dashboard');
                            break;
                        default:
                            router.visit('/dashboard');
                    }
                }, 2000);
            }
        }
    }, [status]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.update'), {
            onSuccess: () => {
                reset();
                // Redirect will be handled by useEffect above
            },
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Head title="Change Password - Required" />

            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
            </div>

            <div className="relative max-w-md w-full mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-yellow-500/20 p-4 rounded-full">
                            <Lock className="h-12 w-12 text-yellow-400" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Change Your Password</h2>
                    <p className="text-blue-200">For security reasons, you must change your password before continuing.</p>
                </div>

                {/* Warning Alert */}
                <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-yellow-200 font-semibold text-sm">Password Change Required</p>
                        <p className="text-yellow-300/80 text-xs mt-1">You cannot access other parts of the system until you change your password.</p>
                    </div>
                </div>

                {/* Success Message */}
                {status === 'success' && (
                    <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-green-200 font-semibold text-sm">Password Changed Successfully!</p>
                            <p className="text-green-300/80 text-xs mt-1">Redirecting you to your dashboard...</p>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Current Password */}
                        <div>
                            <Label htmlFor="current_password" className="text-white mb-2 block">
                                Current Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="current_password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10 focus:bg-white/15"
                                    placeholder="Enter your current password"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.current_password} className="mt-1" />
                        </div>

                        {/* New Password */}
                        <div>
                            <Label htmlFor="password" className="text-white mb-2 block">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10 focus:bg-white/15"
                                    placeholder="Enter your new password (min. 8 characters)"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                            <div className="text-white/60 text-xs mt-2 space-y-1">
                                <p className="font-semibold mb-1">Password must meet the following requirements:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                    <li>At least 8 characters long</li>
                                    <li>At least one uppercase letter (A-Z)</li>
                                    <li>At least one number (0-9)</li>
                                    <li>At least one special character ({'!@#$%^&*()_+-=[]{}|;:,.<>?'})</li>
                                </ul>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <Label htmlFor="password_confirmation" className="text-white mb-2 block">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-10 focus:bg-white/15"
                                    placeholder="Confirm your new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                                >
                                    {showPasswordConfirmation ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="h-5 w-5 mr-2 animate-spin" />
                                    Changing Password...
                                </>
                            ) : (
                                <>
                                    <Lock className="h-5 w-5 mr-2" />
                                    Change Password
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-200/80 text-sm mt-6">
                    This is a mandatory security requirement. You cannot skip this step.
                </p>
            </div>
        </div>
    );
}

