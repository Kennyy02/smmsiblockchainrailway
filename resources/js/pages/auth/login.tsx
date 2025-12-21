// ============================================
// FILE: pages/Auth/Login.tsx
// Southern Mindoro Maritime School - Login
// ============================================
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Head title="Login - Southern Mindoro Maritime School" />

            {/* Decorative Background Elements - Maritime Theme */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
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

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                {/* Back button */}
                <div className="mb-6">
                    <TextLink 
                        href={route('home')} 
                        className="inline-flex items-center text-base font-semibold text-white/80 hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Home
                    </TextLink>
                </div>

                {/* Logo and School Info */}
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
                    <p className="text-gray-300 text-xs">
                        Blockchain Grading System
                    </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl py-8 px-6 sm:px-10">
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-300 text-sm">Please sign in to your account</p>
                    </div>

                    {status && (
                        <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-400 rounded-lg">
                            <p className="text-center text-sm font-medium text-blue-300">{status}</p>
                        </div>
                    )}

                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="text-white/90 font-medium mb-2 block">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="your.email@smms.edu.ph"
                                    className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 px-4 py-3 text-base"
                                />
                                <InputError message={errors.email} className="text-red-300 mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="password" className="text-white/90 font-medium mb-2 block">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 px-4 py-3 pr-12 text-base"
                                    />
                                    <button 
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-gray-800 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="text-red-300 mt-1" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked as boolean)}
                                        tabIndex={3}
                                        className="border-white/40"
                                    />
                                    <Label 
                                        htmlFor="remember" 
                                        className="text-sm text-white/80 cursor-pointer"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                                
                                {canResetPassword && (
                                    <TextLink 
                                        href={route('password.request')} 
                                        className="text-sm text-blue-400 hover:text-blue-300 font-medium" 
                                        tabIndex={4}
                                    >
                                        Forgot Password?
                                    </TextLink>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center" 
                                tabIndex={5} 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-white/60 text-xs">
                        Need help? Contact{' '}
                        <a href="mailto:info@smms.edu.ph" className="text-blue-400 hover:text-blue-300">
                            info@smms.edu.ph
                        </a>
                    </p>
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