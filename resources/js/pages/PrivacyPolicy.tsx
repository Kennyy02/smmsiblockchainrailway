// ============================================
// FILE: pages/PrivacyPolicy.tsx
// Privacy Policy Page
// ============================================
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useContactInfo } from '../config/contactInfo';

const PrivacyPolicy: React.FC = () => {
    const contactInfo = useContactInfo();

    return (
        <AppLayout>
            <Head title="Privacy Policy" />
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
                                <Shield className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
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
                                <Lock className="w-6 h-6 mr-2 text-blue-600" />
                                1. Introduction
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                {contactInfo.schoolName} ("we," "our," or "us") operates the {contactInfo.systemName} 
                                (the "Service"). This Privacy Policy informs you of our policies regarding the collection, 
                                use, and disclosure of personal data when you use our Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <Eye className="w-6 h-6 mr-2 text-blue-600" />
                                2. Information We Collect
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We collect information that you provide directly to us, including:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                                        <li>Name, email address, and contact information</li>
                                        <li>Student identification numbers and academic records</li>
                                        <li>Login credentials and authentication data</li>
                                        <li>Any other information you choose to provide</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Usage Data</h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        We automatically collect information about how you access and use the Service, 
                                        including IP addresses, browser type, and access times.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                                3. How We Use Your Information
                            </h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                We use the collected information for various purposes:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                <li>To provide and maintain our Service</li>
                                <li>To manage academic records and grading</li>
                                <li>To verify certificate authenticity using blockchain technology</li>
                                <li>To notify you about changes to our Service</li>
                                <li>To provide customer support</li>
                                <li>To detect, prevent, and address technical issues</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                            <p className="text-gray-700 leading-relaxed">
                                We implement appropriate technical and organizational security measures to protect your 
                                personal information. Our {contactInfo.systemName} uses blockchain technology to ensure 
                                the immutability and security of academic records. However, no method of transmission 
                                over the Internet is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
                            <p className="text-gray-700 leading-relaxed">
                                We retain your personal information only for as long as necessary to fulfill the purposes 
                                outlined in this Privacy Policy, unless a longer retention period is required by law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                                <li>Access your personal information</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your personal information</li>
                                <li>Object to processing of your personal information</li>
                                <li>Request data portability</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
                            <p className="text-gray-700 leading-relaxed mb-4">
                                If you have any questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;

