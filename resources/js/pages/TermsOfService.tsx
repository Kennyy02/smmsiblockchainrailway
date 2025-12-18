// ============================================
// FILE: pages/TermsOfService.tsx
// Terms of Service Page
// ============================================
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FileText, Scale, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useContactInfo } from '../config/contactInfo';

const TermsOfService: React.FC = () => {
    const contactInfo = useContactInfo();

    return (
        <AppLayout>
            <Head title="Terms of Service" />
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
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
                                <Scale className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
                                <p className="text-gray-600 mt-1">
                                    Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                By accessing and using the {contactInfo.systemName} provided by {contactInfo.schoolName}, 
                                you accept and agree to be bound by the terms and provision of this agreement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Permission is granted to temporarily use the {contactInfo.systemName} for personal, 
                                non-commercial transitory viewing only. This is the grant of a license, not a transfer 
                                of title, and under this license you may not:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                <li>Modify or copy the materials</li>
                                <li>Use the materials for any commercial purpose or for any public display</li>
                                <li>Attempt to reverse engineer any software contained in the Service</li>
                                <li>Remove any copyright or other proprietary notations from the materials</li>
                                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                When you create an account with us, you must provide information that is accurate, 
                                complete, and current at all times. You are responsible for safeguarding the password 
                                and for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Academic Records</h2>
                            <p className="text-gray-700 leading-relaxed">
                                All academic records stored in the {contactInfo.systemName} are secured using blockchain 
                                technology. Once recorded, these records are immutable and cannot be altered. You acknowledge 
                                that the accuracy of your academic records is your responsibility.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
                                5. Prohibited Uses
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                You may not use our Service:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                <li>In any way that violates any applicable national or international law or regulation</li>
                                <li>To transmit, or procure the sending of, any advertising or promotional material</li>
                                <li>To impersonate or attempt to impersonate the school, an employee, another user, or any other person or entity</li>
                                <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Disclaimer</h2>
                            <p className="text-gray-700 leading-relaxed">
                                The materials on the {contactInfo.systemName} are provided on an 'as is' basis. 
                                {contactInfo.schoolName} makes no warranties, expressed or implied, and hereby disclaims 
                                and negates all other warranties including, without limitation, implied warranties or 
                                conditions of merchantability, fitness for a particular purpose, or non-infringement of 
                                intellectual property or other violation of rights.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitations</h2>
                            <p className="text-gray-700 leading-relaxed">
                                In no event shall {contactInfo.schoolName} or its suppliers be liable for any damages 
                                (including, without limitation, damages for loss of data or profit, or due to business 
                                interruption) arising out of the use or inability to use the materials on the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                If you have any questions about these Terms of Service, please contact us:
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-gray-700"><strong>Email:</strong> {contactInfo.email}</p>
                                <p className="text-gray-700"><strong>Phone:</strong> {contactInfo.phone}</p>
                                <p className="text-gray-700">
                                    <strong>Address:</strong> {contactInfo.addressCity}, {contactInfo.addressProvince}, {contactInfo.addressCountry}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default TermsOfService;

