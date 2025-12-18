// ============================================
// FILE: pages/UserGuide.tsx
// User Guide Page
// ============================================
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BookOpen, GraduationCap, Shield, FileText, Users, Award, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useContactInfo } from '../config/contactInfo';

const UserGuide: React.FC = () => {
    const contactInfo = useContactInfo();

    const sections = [
        {
            icon: GraduationCap,
            title: 'For Students',
            items: [
                'Access your academic records and grades',
                'View your enrolled subjects and class schedule',
                'Download course materials',
                'Track your attendance records',
                'View your overall academic performance'
            ]
        },
        {
            icon: Users,
            title: 'For Parents',
            items: [
                'Monitor your child\'s academic progress',
                'View grades and attendance records',
                'Access course materials and announcements',
                'Track multiple children in one account',
                'Receive important school updates'
            ]
        },
        {
            icon: Award,
            title: 'For Teachers',
            items: [
                'Submit and manage student grades',
                'Record attendance for your classes',
                'Upload course materials',
                'View class rosters and student information',
                'Manage your advisory class'
            ]
        },
        {
            icon: Shield,
            title: 'Certificate Verification',
            items: [
                'All certificates are stored on the blockchain',
                'Certificates are immutable and tamper-proof',
                'Verify certificates using the verification page',
                'Global verification available 24/7',
                'Secure and transparent academic records'
            ]
        }
    ];

    const steps = [
        {
            number: 1,
            title: 'Login to Your Account',
            description: 'Use your provided credentials to access the system. Contact support if you need account access.'
        },
        {
            number: 2,
            title: 'Navigate the Dashboard',
            description: 'Each user type (Student, Parent, Teacher, Admin) has a customized dashboard with relevant information.'
        },
        {
            number: 3,
            title: 'Access Your Features',
            description: 'Use the navigation menu to access grades, attendance, course materials, and other features.'
        },
        {
            number: 4,
            title: 'Verify Certificates',
            description: 'Use the Certificate Verification page to verify academic certificates stored on the blockchain.'
        }
    ];

    return (
        <AppLayout>
            <Head title="User Guide" />
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Link>
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">User Guide</h1>
                                <p className="text-gray-600 mt-1">
                                    Learn how to use the {contactInfo.systemName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Getting Started */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
                        <div className="space-y-6">
                            {steps.map((step) => (
                                <div key={step.number} className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        {step.number}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                        <p className="text-gray-700">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features by User Type */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Features by User Type</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sections.map((section, index) => {
                                const Icon = section.icon;
                                return (
                                    <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Icon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start space-x-2">
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-gray-700">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Additional Resources */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href="/support-center"
                                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <FileText className="w-6 h-6 text-blue-600 mb-2" />
                                <h3 className="font-semibold text-gray-900 mb-1">Support Center</h3>
                                <p className="text-sm text-gray-600">Get help with technical issues</p>
                            </Link>
                            <Link
                                href="/verify"
                                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <Shield className="w-6 h-6 text-blue-600 mb-2" />
                                <h3 className="font-semibold text-gray-900 mb-1">Verify Certificate</h3>
                                <p className="text-sm text-gray-600">Verify academic certificates</p>
                            </Link>
                            <Link
                                href="/privacy-policy"
                                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <Shield className="w-6 h-6 text-blue-600 mb-2" />
                                <h3 className="font-semibold text-gray-900 mb-1">Privacy Policy</h3>
                                <p className="text-sm text-gray-600">Learn about data protection</p>
                            </Link>
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="mt-8 bg-blue-50 rounded-xl p-6 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Need More Help?</h3>
                        <p className="text-gray-700 mb-4">
                            Contact our support team at <a href={`mailto:${contactInfo.emailSupport}`} className="text-blue-600 hover:text-blue-800">{contactInfo.emailSupport}</a> or visit our <Link href="/support-center" className="text-blue-600 hover:text-blue-800">Support Center</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default UserGuide;

