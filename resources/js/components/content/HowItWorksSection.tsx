// ============================================
// FILE: components/landing/HowItWorksSection.tsx
// Southern Mindoro Maritime School, Inc. - How the Blockchain Grading System Works
// (Updated Role-Based Workflows)
// ============================================
import React from 'react';
import { UserCheck, FilePlus, Zap, Anchor, Lock, Database, Shield, ScrollText, User, Users, Home } from 'lucide-react';

const HowItWorksSection = () => {
    // ... (rest of the component and steps array remain the same) ...

    const steps = [
        {
            number: '01',
            icon: UserCheck,
            title: 'Faculty Authentication',
            description: 'Faculty uses their secure credentials to log in. Their identity is verified to authorize the grade submission transaction.',
            color: 'from-blue-900 to-blue-700'
        },
        {
            number: '02',
            icon: FilePlus,
            title: 'Grade Submission & Hashing',
            description: 'The faculty submits final grades. The system calculates a unique **cryptographic hash** for the record (student ID + grade + course data).',
            color: 'from-amber-500 to-amber-600'
        },
        {
            number: '03',
            icon: Database,
            title: 'Block Confirmation & Mining',
            description: 'The hash is bundled into a new block, confirmed by network nodes, and permanently added to the private blockchain ledger.',
            color: 'from-green-600 to-green-700'
        },
        {
            number: '04',
            icon: Shield,
            title: 'Instant Global Verification',
            description: 'The student receives a digital certificate with the block hash. Any party can instantly verify the record’s immutability against the ledger.',
            color: 'from-purple-600 to-purple-700'
        }
    ];

    // UPDATED Workflows for Student, Faculty, Parent, and Admin
    const workflows = [
        {
            role: 'Student',
            icon: User,
            tasks: [
                'Securely view current and historical grades.',
                'Download **official digital certificates** (containing the blockchain hash).',
                'Track academic progress and record changes.',
                'Access immutable records anytime, anywhere.'
            ]
        },
        {
            role: 'Faculty Member (Teacher)',
            icon: UserCheck,
            tasks: [
                'Securely submit student grades (initiates block creation).',
                'View status of submitted blocks (confirmation time).',
                'Access decentralized system securely.',
                'Retrieve records for performance review.'
            ]
        },
        {
            role: 'Parent/Guardian',
            icon: Users,
            tasks: [
                'Access their child’s academic records using parental credentials.',
                'Monitor grade integrity and progress in real-time.',
                'Verify school announcements and grade publication dates.',
                'Utilize the system for authorized inquiries.'
            ]
        },
        {
            role: 'Administrator (System Admin)',
            icon: Lock,
            tasks: [
                'Manage private network nodes and access keys.',
                'Monitor blockchain health and consensus.',
                'Oversee system integration and reporting.',
                'Handle external verification requests and system audits.'
            ]
        }
    ];

    return (
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                        How the Blockchain Grading System Works
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        We transform traditional grade reporting into a secure, four-step, immutable transaction verified by our custom private blockchain.
                    </p>
                </div>

                {/* Steps Timeline */}
                <div className="mb-20">
                    <h3 className="text-2xl font-bold text-gray-800 text-center mb-12">
                        The 4-Step Journey of an Immutable Grade
                    </h3>
                    

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative">
                                    {/* Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-blue-300 -ml-4" 
                                            style={{ width: 'calc(100% - 2rem)' }}
                                        />
                                    )}
                                    
                                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative z-10 border-t-4 border-amber-500">
                                        {/* Step Number */}
                                        <div className="text-6xl font-bold text-gray-100 absolute top-4 right-4">
                                            {step.number}
                                        </div>
                                        
                                        {/* Icon */}
                                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg relative z-10`}>
                                            <Icon className="text-white" size={32} />
                                        </div>
                                        
                                        {/* Content */}
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed relative z-10">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <hr className="border-t border-gray-200" />

                {/* Role-Based Workflows */}
                <div className="pt-20">
                    <h3 className="text-3xl font-bold text-blue-900 text-center mb-12">
                        Tailored Blockchain Workflows by Role 👩‍🎓
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {workflows.map((workflow, index) => {
                            const Icon = workflow.icon;
                            return (
                                <div key={index} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100">
                                    <div className="flex items-center mb-6">
                                        <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                                            <Icon className="text-amber-400" size={24} />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 leading-snug">
                                            {workflow.role}
                                        </h4>
                                    </div>
                                    <ul className="space-y-3">
                                        {workflow.tasks.map((task, taskIndex) => (
                                            <li key={taskIndex} className="flex items-start">
                                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                                <span className="text-gray-700">{task}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;