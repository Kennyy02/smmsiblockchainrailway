// ============================================
// FILE: pages/Welcome.tsx
// Main component that orchestrates all sections
// ============================================

import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

// Layout Components
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// Content Sections
import HeroSection from '../components/content/HeroSection';
import AboutSection from '../components/content/AboutSection';
import HowItWorksSection from '../components/content/HowItWorksSection';
import CTASection from '../components/content/CTASection';
import ContactSection from '../components/content/ContactSection';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface PageProps {
    auth: {
        user: AuthUser | null;
    };
}

export default function Welcome() {
    const { auth } = usePage<PageProps>().props;
    const user = auth?.user;
    const [isLoaded, setIsLoaded] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        // Redirect authenticated users to their dashboard
        if (user) {
            let dashboardRoute = '/login';
            switch (user.role) {
                case 'admin':
                    dashboardRoute = route('admin.dashboard');
                    break;
                case 'student':
                    dashboardRoute = route('student.dashboard');
                    break;
                case 'teacher':
                    dashboardRoute = route('teacher.dashboard');
                    break;
                case 'parent':
                    dashboardRoute = route('parent.dashboard');
                    break;
            }
            router.visit(dashboardRoute);
            return;
        }

        setIsLoaded(true);
        
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [user]);

    // Don't render content if user is authenticated (will redirect)
    if (user) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

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