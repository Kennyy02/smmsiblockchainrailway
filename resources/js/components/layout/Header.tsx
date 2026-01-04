import React, { useState } from 'react';
import { Home, Menu, X, Info, HelpCircle, Phone, Anchor } from 'lucide-react';

const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            closeMobileMenu();
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b-4 border-blue-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">

                        {/* Logo and School Name - Left Side */}
                        <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }} className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
                            <img
                                src="/logo.png"
                                alt="SMMS Logo"
                                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <div className="hidden sm:block">
                                <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-blue-900 leading-tight">
                                    SOUTHERN MINDORO MARITIME SCHOOL
                                </div>
                                <div className="text-[8px] sm:text-[10px] md:text-xs text-blue-600 italic font-medium">
                                    Blockchain Grading System
                                </div>
                            </div>
                        </a>

                        {/* Desktop Navigation - Hidden on Mobile/Tablet */}
                        <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4">
                            <a
                                href="#home"
                                onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                                className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors duration-300 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                            >
                                <Home size={18} />
                                <span>Home</span>
                            </a>

                            <a
                                href="#about"
                                onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                                className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors duration-300 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                            >
                                <Info size={18} />
                                <span>About</span>
                            </a>

                          
                            <a
                                href="#how-it-works"
                                onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
                                className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors duration-300 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                            >
                                <HelpCircle size={18} />
                                <span>How It Works</span>
                            </a>

                            <a
                                href="#contact"
                                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                className="flex items-center space-x-1 text-gray-700 hover:text-blue-900 transition-colors duration-300 font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                            >
                                <Phone size={18} />
                                <span>Contact</span>
                            </a>
                        </nav>

                        {/* Right Side - Auth Buttons & Mobile Menu */}
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Desktop Auth Buttons */}
                            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                                <a
                                    href="/login"
                                    className="px-3 sm:px-4 lg:px-5 py-2 rounded-full bg-blue-900 text-white font-medium hover:bg-blue-800 transition-all duration-300 shadow-sm text-xs sm:text-sm lg:text-base whitespace-nowrap"
                                >
                                    Login
                                </a>

                              
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={toggleMobileMenu}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                                aria-label="Toggle menu"
                                aria-expanded={mobileMenuOpen}
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" />
                                ) : (
                                    <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile/Tablet Menu Overlay - Full Screen */}
            {mobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    />

                    {/* Mobile Menu */}
                    <div className="fixed top-16 sm:top-20 left-0 right-0 bottom-0 bg-white z-40 lg:hidden overflow-y-auto">
                        <nav className="px-4 py-6 space-y-2">
                            {/* Navigation Links */}
                            <a
                                href="#home"
                                onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                                className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-colors duration-300 font-medium touch-manipulation"
                            >
                                <Home size={22} />
                                <span className="text-base">Home</span>
                            </a>

                            <a
                                href="#about"
                                onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                                className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-colors duration-300 font-medium touch-manipulation"
                            >
                                <Info size={22} />
                                <span className="text-base">About</span>
                            </a>

                            <a
                                href="#features"
                                onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
                                className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-colors duration-300 font-medium touch-manipulation"
                            >
                                <Anchor size={22} />
                                <span className="text-base">Features</span>
                            </a>

                            <a
                                href="#how-it-works"
                                onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
                                className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-colors duration-300 font-medium touch-manipulation"
                            >
                                <HelpCircle size={22} />
                                <span className="text-base">How It Works</span>
                            </a>

                            <a
                                href="#contact"
                                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                                className="flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-900 rounded-xl transition-colors duration-300 font-medium touch-manipulation"
                            >
                                <Phone size={22} />
                                <span className="text-base">Contact</span>
                            </a>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Mobile Auth Button */}
                            <div className="space-y-3 pt-2">
                                <a
                                    href="/login"
                                    className="block w-full px-6 py-4 text-center rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-all duration-300 shadow-lg text-base touch-manipulation"
                                >
                                    Login to System
                                </a>
                            </div>

                            {/* Mobile Footer Info */}
                            <div className="pt-6 text-center border-t border-gray-200 mt-6">
                                <p className="text-xs text-gray-500">
                                    Southern Mindoro Maritime School, Inc.<br/>
                                    Blockchain Grading System
                                </p>
                            </div>
                        </nav>
                    </div>
                </>
            )}

            {/* Spacer to prevent content from going under fixed header */}
            <div className="h-16 sm:h-20"></div>
        </>
    );
};

export default Header;