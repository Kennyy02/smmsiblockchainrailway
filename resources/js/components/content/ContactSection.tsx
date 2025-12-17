// ============================================
// FILE: components/landing/ContactSection.tsx
// Southern Mindoro Maritime School, Inc. - Contact Information
// Focus: Blockchain Grading System Support
// ============================================
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, Facebook, Globe, LoaderCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { adminContactService } from '../../../services/AdminContactService';

const ContactSection = () => {
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
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
            
            // Reset success state after 10 seconds
            setTimeout(() => {
                setIsSubmitted(false);
            }, 10000);
        } catch (err: any) {
            setError(err.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const contactInfo = [
        {
            icon: MapPin,
            title: 'Main Campus',
            details: ['San Jose', 'Occidental Mindoro', 'Philippines'],
            link: 'https://maps.app.goo.gl/YourMapLinkHere' // Placeholder for actual map link
        },
        {
            icon: Phone,
            title: 'Phone / Support Line',
            details: ['+63 XXX XXX XXXX'],
            link: 'tel:+63XXXXXXXXXX'
        },
        {
            icon: Mail,
            title: 'Email',
            details: ['info@smms.edu.ph', 'support@smms.edu.ph'],
            link: 'mailto:info@smms.edu.ph'
        },
        {
            icon: Clock,
            title: 'Office Hours',
            details: ['Monday - Friday', '8:00 AM - 5:00 PM'],
            link: null
        }
    ];

    // Updated list of contact subjects to reflect the new system
    const subjects = [
        'General Inquiry',
        'Blockchain System Support',
        'Certificate Verification Request',
        'Faculty Grade Submission Issue',
        'System Access / Account Issues',
        'Maritime Program Inquiry',
        'Other Technical Support'
    ];

    return (
        <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                        Get In Touch
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Questions about our **Secure Blockchain Grading System** or need help verifying a certificate? <br className="hidden sm:inline" /> Our support team is ready to assist you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 shadow-2xl h-full">
                            <h3 className="text-2xl font-bold text-white mb-6">
                                Contact Information
                            </h3>
                            <p className="text-blue-100 mb-8">
                                Connect with Southern Mindoro Maritime School for support, verification requests, and general assistance.
                            </p>

                            <div className="space-y-6">
                                {contactInfo.map((info, index) => {
                                    const Icon = info.icon;
                                    return (
                                        <div key={index} className="flex items-start space-x-4">
                                            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                {/* Added ShieldCheck for support line / relevant contacts */}
                                                {info.title.includes('Support') ? 
                                                    <ShieldCheck className="text-blue-950" size={20} /> : 
                                                    <Icon className="text-blue-950" size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">
                                                    {info.title}
                                                </h4>
                                                {info.link ? (
                                                    <a 
                                                        href={info.link}
                                                        target={info.title === 'Email' ? '_self' : '_blank'}
                                                        rel="noopener noreferrer"
                                                        className="text-blue-200 hover:text-amber-400 transition-colors"
                                                    >
                                                        {info.details.map((detail, i) => (
                                                            <div key={i} className="text-sm">
                                                                {detail}
                                                            </div>
                                                        ))}
                                                    </a>
                                                ) : (
                                                    <div className="text-blue-200 text-sm">
                                                        {info.details.map((detail, i) => (
                                                            <div key={i}>{detail}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Social Links */}
                            <div className="mt-8 pt-8 border-t border-blue-700">
                                <h4 className="text-white font-semibold mb-4">Official Channels</h4>
                                <div className="flex space-x-4">
                                    <a 
                                        href="#" // Placeholder link
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-blue-700 hover:bg-amber-500 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Facebook className="text-white" size={20} />
                                    </a>
                                    <a 
                                        href="#" // Placeholder link
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 bg-blue-700 hover:bg-amber-500 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <Globe className="text-white" size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-2xl p-8 shadow-lg">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                Send Us a Message
                            </h3>

                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Send className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h4 className="text-2xl font-semibold text-gray-900 mb-3">
                                        Message Sent Successfully!
                                    </h4>
                                    <p className="text-lg text-gray-600">
                                        Thank you for contacting us. We prioritize inquiries related to the Blockchain Grading System and will respond within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="mt-6 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Error Message */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-800 font-medium">Failed to send message</p>
                                                <p className="text-red-600 text-sm">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                                                placeholder="Juan Dela Cruz"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                                                placeholder="juan@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Subject
                                        </label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                                        >
                                            <option value="">Select a subject</option>
                                            {subjects.map((subject, index) => (
                                                <option key={index} value={subject}>
                                                    {subject}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                                            placeholder="Tell us how we can help you..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-blue-950 text-lg font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoaderCircle className="animate-spin h-5 w-5" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5" />
                                                <span>Send Message</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;