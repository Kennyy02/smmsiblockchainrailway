// ============================================
// FILE: components/landing/AboutSection.tsx
// Southern Mindoro Maritime School, Inc. - About the Blockchain Grading System
// ============================================
import React from 'react';
import { Database, Users, Shield, Lock, Award, CheckCircle, Anchor, Zap } from 'lucide-react';

const AboutSection = () => {
    // Updated features for a Blockchain Grading System
    const features = [
        {
            icon: Shield,
            title: 'Immutable Grade Ledger',
            description: 'All grades are recorded as blocks, cryptographically sealed to prevent unauthorized modification or deletion.',
            color: 'bg-blue-500'
        },
        {
            icon: Database,
            title: 'Decentralized Data',
            description: 'Academic records are distributed across a private network, eliminating a single point of failure and increasing resilience.',
            color: 'bg-amber-500'
        },
        {
            icon: Zap,
            title: 'Instant Verification',
            description: 'External parties (employers, agencies) can instantly verify certificate authenticity using a unique transaction hash.',
            color: 'bg-green-500'
        },
        {
            icon: Lock,
            title: 'Role-Based Access',
            description: 'Access control ensures only authorized faculty can submit grades, and only students/admins can view specific records.',
            color: 'bg-purple-500'
        }
    ];

    // Updated benefits focused on security, trust, and efficiency
    const benefits = [
        'Eliminate certificate fraud and tampering.',
        'Reduce administrative costs associated with record retrieval and verification.',
        'Ensure 100% data integrity and audit readiness.',
        'Provide graduates with verifiable, globally trusted digital certificates.',
        'Streamline the grade submission process for faculty.',
        'Future-proof academic records against technical failure.'
    ];

    return (
        <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                        About Our Blockchain Grading System
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        A next-generation, secure solution designed to protect the integrity and authenticity of academic records at Southern Mindoro Maritime School.
                    </p>
                </div>
                
                {/* Features Grid - Why Blockchain? */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                            >
                                <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                                    <Icon className="text-white" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Two Column Layout: Core Value & Benefits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left - Core Value Stats/Diagram */}
                    <div>
                        <h3 className="text-3xl font-bold text-blue-900 mb-6">
                             The Trust Protocol
                        </h3>
                         <p className="text-gray-700 mb-8 text-lg">
                            We secure your future with technology built on trust. Every grade, every diploma, is a verified block in our private ledger. This is not just grading; it's **certified truth**.
                        </p>
                        
                        {/* Blockchain Diagram Placeholder */}
                        [Image of a simplified private blockchain ledger diagram showing a sequence of blocks containing student grade records linked by hashes, illustrating tamper-proof immutability]

                        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 shadow-2xl mt-8">
                             <div className="grid grid-cols-2 gap-6">
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-amber-400 mb-2">100%</div>
                                    <div className="text-white/80 text-sm">Record Integrity</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-amber-400 mb-2">0%</div>
                                    <div className="text-white/80 text-sm">Fraud Rate Potential</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-amber-400 mb-2">24/7</div>
                                    <div className="text-white/80 text-sm">Global Verification</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-amber-400 mb-2">Free</div>
                                    <div className="text-white/80 text-sm">Certificate Transactions</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Benefits */}
                    <div>
                        <h3 className="text-3xl font-bold text-blue-900 mb-6">
                            Tangible Benefits of Blockchain Records
                        </h3>
                        <p className="text-gray-600 mb-8 text-lg">
                            By implementing a private blockchain, SMMSI ensures maximum security, trust, and efficiency for all stakeholders: students, faculty, and future employers.
                        </p>
                        <div className="space-y-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <Award className="text-amber-500 flex-shrink-0 mt-1" size={20} />
                                    <span className="text-gray-700 text-lg">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                            <p className="text-gray-800 italic">
                                "The integration of blockchain technology elevates the credibility of our graduates to a global standard, giving them a clear advantage in the maritime industry."
                            </p>
                            <p className="text-gray-600 mt-2 font-semibold">
                                - Dr. A. Dela Cruz, President, SMMSI
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;