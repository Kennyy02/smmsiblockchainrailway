// ============================================
// FILE: components/landing/CTASection.tsx
// Southern Mindoro Maritime School, Inc. - Call to Action Section
// Focus: Blockchain Grading System Verification
// ============================================
import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Shield, Lock, CheckCircle } from 'lucide-react';

const CTASection = () => {

    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 opacity-5">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid-cta" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-cta)" />
                    </svg>
                </div>
            </div>

            <div className="max-w-5xl mx-auto text-center relative z-10">
                {/* Main Heading */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                    Ready to Trust <Lock className="inline-block h-10 w-10 text-amber-400 -mt-2 mx-1" />
                    and Verify 
                    <span className="block text-amber-400 mt-2">
                        Your Academic Records?
                    </span>
                </h2>

                <p className="text-xl text-blue-100 mb-10 max-w-4xl mx-auto">
                    Experience the future of maritime education with **SMMSI's Private Blockchain Grading System**. Ensure every diploma and certificate is **tamper-proof, verifiable**, and eternally secure.
                </p>

                {/* Key Benefit Highlights */}
                <div className="flex justify-center gap-6 mb-12 flex-wrap">
                    <div className="flex items-center space-x-2 text-lg text-amber-400 font-semibold">
                        <Shield className="h-6 w-6" />
                        <span>Irreversible Records</span>
                    </div>
                    <div className="flex items-center space-x-2 text-lg text-amber-400 font-semibold">
                        <CheckCircle className="h-6 w-6" />
                        <span>Instant Verification</span>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="flex justify-center items-center mb-8">
                    <Link
                        href="/verify"
                        className="group px-8 py-4 bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl flex items-center space-x-2 min-w-[200px] justify-center"
                    >
                        <span>Verify a Certificate</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                
            </div>
        </section>
    );
};

export default CTASection;