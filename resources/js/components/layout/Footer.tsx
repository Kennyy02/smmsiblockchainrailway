// ============================================
// FILE: components/landing/Footer.tsx
// Southern Mindoro Maritime School, Inc. - Footer
// Focus: Blockchain Grading System Verification
// ============================================
import React from 'react';
import { Mail, Phone, MapPin, Globe, Facebook, ShieldCheck, Database } from 'lucide-react';

// ============================================
// CONFIGURATION - Easy to update for client
// ============================================
const CONTACT_INFO = {
    // School Information
    schoolName: 'Southern Mindoro Maritime School, Inc.',
    schoolShortName: 'Southern Mindoro',
    schoolSubtitle: 'Maritime School, Inc.',
    
    // Contact Details
    address: {
        city: 'San Jose',
        province: 'Occidental Mindoro',
        country: 'Philippines'
    },
    phone: '+63 XXX XXX XXXX',
    email: 'info@smms.edu.ph',
    
    // Social Media & Website
    facebookUrl: 'https://www.facebook.com/smmsi.shs',
    websiteUrl: 'https://www.facebook.com/smmsi.shs', // Update with actual website when available
    
    // Copyright
    copyrightYear: '2025',
    systemName: 'Blockchain Grading System'
};

const Footer = () => {
    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="relative bg-gray-900 text-white py-16">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden opacity-5">
                <div className="absolute top-10 left-10 w-64 h-64 bg-amber-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="md:col-span-1">
                        <div className="mb-6 flex items-center space-x-3">
                            <img
                                src="/logo.png"
                                alt="Southern Mindoro Maritime School Logo"
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <div>
                                <div className="text-lg font-bold text-white">
                                    {CONTACT_INFO.schoolShortName}
                                </div>
                                <div className="text-xs text-amber-400">
                                    {CONTACT_INFO.schoolSubtitle}
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-400 leading-relaxed mb-4 text-sm">
                            The official **{CONTACT_INFO.systemName}** for SMMSI. Ensuring immutable, secure, and globally verifiable academic records.
                        </p>
                        <p className="text-xs text-gray-500 italic">
                            A new era of certified trust.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <a 
                                    href="#home" 
                                    onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 flex items-center group text-sm"
                                >
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                                    Home
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#about" 
                                    onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 flex items-center group text-sm"
                                >
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                                    System Info
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#how-it-works" 
                                    onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 flex items-center group text-sm"
                                >
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                                    Grade Process
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="/verify" 
                                    className="text-amber-400 font-semibold hover:text-white transition-colors duration-300 flex items-center group text-sm"
                                >
                                    <ShieldCheck className='h-4 w-4 mr-2' />
                                    Verify Certificate
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="/login" 
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 flex items-center group text-sm"
                                >
                                    <span className="w-0 group-hover:w-2 h-0.5 bg-amber-400 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                                    Admin Login
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Technical & Resources */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Blockchain Resources</h3>
                        <ul className="space-y-3">
                            <li>
                                <a 
                                    href="/admin/blockchain-transactions"
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm flex items-center space-x-2"
                                >
                                    <Database className='h-4 w-4 text-blue-400' />
                                    <span>Blockchain Ledger (Explorer)</span>
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="/verify"
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm flex items-center space-x-2"
                                >
                                    <ShieldCheck className='h-4 w-4 text-blue-400' />
                                    <span>System Security Audit</span>
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#contact"
                                    onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                                >
                                    User Guide
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#contact"
                                    onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                                >
                                    Support Center
                                </a>
                            </li>
                            <li>
                                <a 
                                    href="#contact"
                                    onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                    className="text-gray-400 hover:text-amber-400 transition-colors duration-300 text-sm"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Connect */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Contact Us</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-start space-x-2 text-gray-400 text-sm">
                                <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <span>
                                    {CONTACT_INFO.address.city}<br/>
                                    {CONTACT_INFO.address.province}<br/>
                                    {CONTACT_INFO.address.country}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                <Phone className="w-5 h-5 text-amber-400" />
                                <a href={`tel:${CONTACT_INFO.phone}`} className="hover:text-amber-400 transition-colors">
                                    {CONTACT_INFO.phone}
                                </a>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                <Mail className="w-5 h-5 text-amber-400" />
                                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-amber-400 transition-colors">
                                    {CONTACT_INFO.email}
                                </a>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-800">
                            <h4 className="text-white font-semibold mb-3 text-sm">Official Channels</h4>
                            <div className="flex space-x-3">
                                <a 
                                    href={CONTACT_INFO.facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 bg-gray-800 hover:bg-amber-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                                    aria-label="Facebook"
                                    title="Visit our official Facebook page"
                                >
                                    <Facebook className="w-4 h-4 text-white" />
                                </a>
                                <a 
                                    href={CONTACT_INFO.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 bg-gray-800 hover:bg-amber-500 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                                    aria-label="Website"
                                    title="Visit our website"
                                >
                                    <Globe className="w-4 h-4 text-white" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-gray-400 text-sm text-center md:text-left">
                            © {CONTACT_INFO.copyrightYear} <span className="text-white font-semibold">{CONTACT_INFO.schoolName}</span> | **{CONTACT_INFO.systemName}**
                        </p>
                        <div className="flex space-x-6 text-sm">
                            <a 
                                href="#contact" 
                                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                className="text-gray-400 hover:text-amber-400 transition-colors"
                            >
                                Terms of Service
                            </a>
                            <a 
                                href="#contact" 
                                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                className="text-gray-400 hover:text-amber-400 transition-colors"
                            >
                                Privacy Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;