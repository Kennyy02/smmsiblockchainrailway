// ============================================
// FILE: components/sections/HeroSection.tsx
// Southern Mindoro Maritime School, Inc. - Fully Responsive Hero Section
// Blockchain-Based Grading System Implementation
// ============================================

import React from 'react';
import { Link } from '@inertiajs/react';
import { Shield, Lock, Zap, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';

const HeroSection = () => {

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 pt-8 sm:pt-12 md:pt-20">

            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-48 md:w-72 h-48 md:h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-64 md:w-96 h-64 md:h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                {/* Background Grid Pattern for Tech Vibe */}
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

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                {/* Main Content */}
                <div className="text-center mb-12 md:mb-16">
                    {/* Logo & School Name */}
                    <div className="mb-6 md:mb-8">
                        <img
                            src="/logo.png"
                            alt="Southern Mindoro Maritime School Logo"
                            className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mx-auto object-contain mb-4 md:mb-6"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight px-4">
                            SOUTHERN MINDORO MARITIME SCHOOL, INC.
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-amber-400 font-medium italic mb-2 md:mb-3">
                            Navigating Excellence in Maritime Education
                        </p>
                       
                    </div>

                    {/* Main Headline */}
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-amber-400 mb-4 md:mb-6 leading-tight px-4">
                        Blockchain Grading System
                    </h2>
                
                </div>

                {/* Scroll Indicator - Hidden on Mobile */}
                <div className="hidden md:flex justify-center mt-12 lg:mt-16">
                    <div className="animate-bounce">
                        <svg className="w-6 h-6 text-white/60" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Feature Card Component for reusability and cleaner JSX
const FeatureCard = ({ icon, title, description }: { icon: JSX.Element, title: string, description: string }) => (
    <div className="bg-blue-900/50 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-blue-700/50 text-center transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex justify-center mb-2">{icon}</div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs text-gray-300">{description}</p>
    </div>
);

export default HeroSection;