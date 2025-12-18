// ============================================
// FILE: pages/SupportCenter.tsx
// Support Center Page
// ============================================
import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { HelpCircle, Mail, Phone, MessageSquare, BookOpen, Shield, ArrowLeft, Send } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useContactInfo } from '../config/contactInfo';
import { adminContactService } from '../../services/AdminContactService';

const SupportCenter: React.FC = () => {
    const contactInfo = useContactInfo();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            await adminContactService.submitContactForm(formData);
            setIsSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err: any) {
            setError(err.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const supportTopics = [
        {
            icon: BookOpen,
            title: 'Getting Started',
            description: 'Learn how to use the blockchain grading system',
            link: '/user-guide'
        },
        {
            icon: Shield,
            title: 'Certificate Verification',
            description: 'Verify academic certificates on the blockchain',
            link: '/verify'
        },
        {
            icon: MessageSquare,
            title: 'Account Issues',
            description: 'Problems with login or account access',
        },
        {
            icon: HelpCircle,
            title: 'Technical Support',
            description: 'Get help with system errors or bugs',
        }
    ];

    return (
        <AppLayout>
            <Head title="Support Center" />
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
                                <HelpCircle className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">Support Center</h1>
                                <p className="text-gray-600 mt-1">
                                    We're here to help you with the {contactInfo.systemName}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Support Topics */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Support Topics</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {supportTopics.map((topic, index) => {
                                        const Icon = topic.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                                            >
                                                <div className="flex items-start space-x-4">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <Icon className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 mb-1">{topic.title}</h3>
                                                        <p className="text-sm text-gray-600">{topic.description}</p>
                                                        {topic.link && (
                                                            <Link
                                                                href={topic.link}
                                                                className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                                                            >
                                                                Learn more →
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="bg-white rounded-xl p-6 shadow-md">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Phone Support</p>
                                            <a href={`tel:${contactInfo.phone}`} className="text-blue-600 hover:text-blue-800">
                                                {contactInfo.phone}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-gray-900">Email Support</p>
                                            <a href={`mailto:${contactInfo.emailSupport}`} className="text-blue-600 hover:text-blue-800">
                                                {contactInfo.emailSupport}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-600">
                                            <strong>Office Hours:</strong> {contactInfo.officeHours}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 shadow-md sticky top-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Send us a Message</h2>
                                
                                {isSubmitted ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send className="h-8 w-8 text-green-600" />
                                        </div>
                                        <p className="text-gray-700 font-medium">Message sent successfully!</p>
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            Send another message
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                                {error}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Subject
                                            </label>
                                            <select
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select a subject</option>
                                                <option value="Technical Support">Technical Support</option>
                                                <option value="Account Issues">Account Issues</option>
                                                <option value="Certificate Verification">Certificate Verification</option>
                                                <option value="General Inquiry">General Inquiry</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Message
                                            </label>
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                required
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default SupportCenter;

