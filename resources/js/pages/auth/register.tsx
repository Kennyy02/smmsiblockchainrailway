// ============================================
// FILE: pages/Auth/Register.tsx
// Columban College Scheduling System - Register (Updated with Current Offerings 2024-2025)
// ============================================
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, ArrowLeft, User, Mail, Building2, Briefcase } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    designation: string;
    college: string;
    campus: string;
};

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        designation: '',
        college: '',
        campus: 'main',
    });

    // Actual Columban College Departments/Colleges (2024-2025 Academic Year)
    const colleges = [
        { value: '', label: 'Select College/Department', disabled: true },
        
        // Main Colleges
        { value: 'CASED', label: 'College of Arts & Sciences / Education (CASED)' },
        { value: 'CBA', label: 'College of Business and Accountancy (CBA)' },
        { value: 'CCS', label: 'College of Computer Studies (CCS)' },
        { value: 'COE', label: 'College of Engineering (COE)' },
        { value: 'COA', label: 'College of Architecture (COA)' },
        { value: 'CON', label: 'College of Nursing (CON)' },
        { value: 'GSPACE', label: 'Graduate Studies (G-SPACE)' },
        
        // Basic Education
        { value: 'BASIC_MAIN', label: 'Basic Education - Main Campus' },
        { value: 'BASIC_BARRETTO', label: 'Basic Education - Barretto Campus' },
        
        // Sta Cruz Campus
        { value: 'CCI_STACRUZ', label: 'CCI - Sta Cruz Campus' },
        
        // Administrative/Support Departments
        { value: 'ADMIN', label: 'Administrative Office' },
        { value: 'REGISTRAR', label: 'Office of the Registrar (ARO)' },
        { value: 'LIBRARY', label: 'Library Services' },
        { value: 'RESEARCH', label: 'Research & Development (RIKDO)' },
        { value: 'EXTENSION', label: 'Community Extension Services' },
        { value: 'MINISTRY', label: 'Campus Ministry' },
        { value: 'ALUMNI', label: 'Alumni Relations' },
    ];

    const designations = [
        { value: '', label: 'Select Designation', disabled: true },
        { value: 'administrator', label: 'Administrator' },
        { value: 'dean', label: 'Dean / Department Head' },
        { value: 'program_chair', label: 'Program Chair / Coordinator' },
        { value: 'regular_faculty', label: 'Regular Faculty' },
        { value: 'parttime_faculty', label: 'Part-time Faculty' },
        { value: 'adjunct_faculty', label: 'Adjunct Faculty' },
        { value: 'registrar', label: 'Registrar Staff' },
        { value: 'admin_staff', label: 'Administrative Staff' },
        { value: 'principal', label: 'Principal (Basic Education)' },
        { value: 'librarian', label: 'Librarian' },
    ];

    const campuses = [
        { value: 'main', label: 'Main Campus - Asinan, Olongapo City' },
        { value: 'barretto', label: 'Barretto Campus - Olongapo City' },
        { value: 'stacruz', label: 'Sta Cruz Campus' },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Head title="Register - Columban College" />

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

            <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
                {/* Back button */}
                <div className="mb-6">
                    <TextLink 
                        href={route('home')} 
                        className="inline-flex items-center text-base font-semibold text-white/80 hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Home
                    </TextLink>
                </div>

                {/* Logo and College Info */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Columban College Logo"
                        className="mx-auto w-20 h-20 mb-4 object-contain"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        COLUMBAN COLLEGE, INC.
                    </h1>
                    <p className="text-amber-400 text-sm font-medium italic mb-1">
                        Christi Simus Non Nostri
                    </p>
                    <p className="text-gray-300 text-xs">
                        Faculty Scheduling System - Academic Year 2024-2025
                    </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl py-8 px-6 sm:px-10">
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-gray-300 text-sm">Join the Columban College scheduling system</p>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        <div className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <Label htmlFor="name" className="text-white/90 font-medium mb-2 block">
                                    Full Name <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        autoComplete="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Dr. Juan Dela Cruz"
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400 pl-10 pr-4 py-3 text-base"
                                    />
                                </div>
                                <InputError message={errors.name} className="text-red-300 mt-1" />
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className="text-white/90 font-medium mb-2 block">
                                    Email Address <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@columban.edu.ph"
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400 pl-10 pr-4 py-3 text-base"
                                    />
                                </div>
                                <InputError message={errors.email} className="text-red-300 mt-1" />
                                <p className="text-xs text-blue-200 mt-1">
                                    Please use your official Columban College email address
                                </p>
                            </div>

                            {/* Campus Selection */}
                            <div>
                                <Label htmlFor="campus" className="text-white/90 font-medium mb-2 block">
                                    Campus <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none z-10" />
                                    <select
                                        id="campus"
                                        required
                                        value={data.campus}
                                        onChange={(e) => setData('campus', e.target.value)}
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 focus:ring-2 focus:ring-amber-400 pl-10 pr-4 py-3 text-base appearance-none cursor-pointer"
                                    >
                                        {campuses.map((campus) => (
                                            <option key={campus.value} value={campus.value}>
                                                {campus.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.campus} className="text-red-300 mt-1" />
                            </div>

                            {/* Designation */}
                            <div>
                                <Label htmlFor="designation" className="text-white/90 font-medium mb-2 block">
                                    Designation <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none z-10" />
                                    <select
                                        id="designation"
                                        required
                                        value={data.designation}
                                        onChange={(e) => setData('designation', e.target.value)}
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 focus:ring-2 focus:ring-amber-400 pl-10 pr-4 py-3 text-base appearance-none cursor-pointer"
                                    >
                                        {designations.map((designation) => (
                                            <option 
                                                key={designation.value} 
                                                value={designation.value}
                                                disabled={designation.disabled}
                                            >
                                                {designation.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.designation} className="text-red-300 mt-1" />
                            </div>

                            {/* College/Department */}
                            <div>
                                <Label htmlFor="college" className="text-white/90 font-medium mb-2 block">
                                    College / Department <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5 pointer-events-none z-10" />
                                    <select
                                        id="college"
                                        required
                                        value={data.college}
                                        onChange={(e) => setData('college', e.target.value)}
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 focus:ring-2 focus:ring-amber-400 pl-10 pr-4 py-3 text-base appearance-none cursor-pointer"
                                    >
                                        {colleges.map((college) => (
                                            <option 
                                                key={college.value} 
                                                value={college.value}
                                                disabled={college.disabled}
                                            >
                                                {college.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.college} className="text-red-300 mt-1" />
                                <p className="text-xs text-blue-200 mt-1">
                                    Select your primary college or department
                                </p>
                            </div>

                            {/* Password */}
                            <div>
                                <Label htmlFor="password" className="text-white/90 font-medium mb-2 block">
                                    Password <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Create a strong password"
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400 px-4 py-3 pr-12 text-base"
                                    />
                                    <button 
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-gray-800 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="text-red-300 mt-1" />
                                <p className="text-xs text-blue-200 mt-1">
                                    Minimum 8 characters, include uppercase, lowercase, and numbers
                                </p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <Label htmlFor="password_confirmation" className="text-white/90 font-medium mb-2 block">
                                    Confirm Password <span className="text-red-400">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        autoComplete="new-password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Re-enter your password"
                                        className="w-full rounded-xl bg-white/90 text-gray-900 border-0 placeholder:text-gray-500 focus:ring-2 focus:ring-amber-400 px-4 py-3 pr-12 text-base"
                                    />
                                    <button 
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 hover:text-gray-800 focus:outline-none"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} className="text-red-300 mt-1" />
                            </div>

                            {/* Terms and Conditions */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    By creating an account, you agree to Columban College's Terms of Service and 
                                    acknowledge that you have read our Privacy Policy. This account will be subject 
                                    to approval by the system administrator.
                                </p>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold py-3 text-base rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center" 
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <LoaderCircle className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </div>

                        <div className="text-white/80 text-center text-sm mt-2">
                            Already have an account?{' '}
                            <TextLink 
                                href={route('login')} 
                                className="text-amber-400 hover:text-amber-300 font-semibold"
                            >
                                Sign In
                            </TextLink>
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center space-y-2">
                    <p className="text-white/60 text-xs">
                        Account approval may take 1-2 business days
                    </p>
                    <p className="text-white/60 text-xs">
                        Need help? Contact{' '}
                        <a href="mailto:info@columban.edu.ph" className="text-amber-400 hover:text-amber-300">
                            info@columban.edu.ph
                        </a>
                        {' '}or call{' '}
                        <a href="tel:+63472223329" className="text-amber-400 hover:text-amber-300">
                            +63 (47) 222-3329
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