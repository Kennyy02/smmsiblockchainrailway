// ============================================
// FILE: pages/Welcome.tsx
// Main component that orchestrates all sections
// ============================================

import { useState, useEffect } from 'react';

// Layout Components
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Content Sections
import HeroSection from '../components/content/HeroSection';
import AboutSection from '../components/content/AboutSection';
import HowItWorksSection from '../components/content/HowItWorksSection';
import CTASection from '../components/content/CTASection';
import ContactSection from '../components/content/ContactSection';


export default function Welcome() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        setIsLoaded(true);
        
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-gray-50">
            {/* Fixed Header */}
            <Header />

            {/* Main Content Sections */}
            <HeroSection isLoaded={isLoaded} />
            <AboutSection />
            <HowItWorksSection />
            <CTASection />
            <ContactSection /> 
            {/* Footer */}
            <Footer />

           
        </div>
    );
}