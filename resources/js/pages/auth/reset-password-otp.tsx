// ============================================
// FILE: pages/Auth/ResetPasswordOtp.tsx
// OTP Verification for Password Reset
// ============================================
import { Head, useForm, router } from '@inertiajs/react';
import { LoaderCircle, ArrowLeft, Key, RefreshCw } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ResetPasswordOtpProps {
    email: string;
    status?: string;
}

export default function ResetPasswordOtp({ email, status }: ResetPasswordOtpProps) {
    const [resendCooldown, setResendCooldown] = useState(0);
    
    const { data, setData, post, processing, errors } = useForm<Required<{ otp: string }>>({
        otp: '',
    });

    useEffect(() => {
        // Countdown timer for resend button
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.reset.verify'));
    };

    const handleResend = () => {
        if (resendCooldown > 0) return;
        
        router.post(route('password.reset.resend'), {}, {
            onSuccess: () => {
                setResendCooldown(60); // 60 second cooldown
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center px-4 relative overflow-hidden">
            <Head title="Verify Reset Code - Southern Mindoro Maritime School" />

            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
                <div className="absolute inset-0 opacity-5">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Back button */}
                <div className="mb-6">
                    <TextLink 
                        href={route('password.request')} 
                        className="inline-flex items-center text-base font-semibold text-white/80 hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                    </TextLink>
                </div>

                {/* Logo and College Info */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="SMMS Logo"
                        className="mx-auto w-20 h-20 mb-4 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        SOUTHERN MINDORO MARITIME SCHOOL
                    </h1>
                    <p className="text-amber-400 text-sm font-medium italic">
                        Scheduling System
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Key className="w-8 h-8 text-blue-950" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white text-center mb-3">
                        Enter Reset Code
                    </h2>
                    <p className="text-gray-300 text-center mb-2 text-sm">
                        We've sent a 6-digit code to:
                    </p>
                    <p className="text-amber-400 text-center mb-6 font-semibold">
                        {email}
                    </p>

                    {status && (
                        <div className="mb-4 p-3 bg-green-500 bg-opacity-20 border border-green-400 rounded-lg">
                            <p className="text-center text-sm font-medium text-green-300">{status}</p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <Label htmlFor="otp" className="text-white/90 font-medium mb-2 block">
                                Reset Code
                            </Label>
                            <Input
                                id="otp"
                                type="text"
                                required
                                autoFocus
                                maxLength={6}
                                value={data.otp}
                                onChange={(e) => setData('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full bg-white/90 border-0 text-gray-900 text-center text-2xl font-bold tracking-widest placeholder:text-gray-400 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400"
                            />
                            <InputError message={errors.otp} className="text-red-300 mt-1" />
                            <p className="text-white/70 text-xs text-center mt-2">
                                Enter the 6-digit code from your email
                            </p>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center" 
                            disabled={processing || data.otp.length !== 6}
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Code'
                            )}
                        </Button>

                        <div className="text-center">
                            <p className="text-white/80 text-sm mb-2">
                                Didn't receive the code?
                            </p>
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || processing}
                                className="inline-flex items-center text-amber-400 hover:text-amber-300 font-medium text-sm disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                            </button>
                        </div>

                        <p className="text-center text-white/80 text-sm mt-4">
                            Remembered your password?{' '}
                            <TextLink 
                                href={route('login')} 
                                className="text-amber-400 hover:text-amber-300 font-medium"
                            >
                                Sign In
                            </TextLink>
                        </p>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.2; transform: scale(1.05); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 6s ease-in-out infinite;
                }
                .animation-delay-2000 { animation-delay: 2s; }
            `}</style>
        </div>
    );
}

