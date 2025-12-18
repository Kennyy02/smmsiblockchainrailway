// ============================================
// FILE: config/contactInfo.ts
// Contact Information Configuration
// Reads from Inertia shared props (environment variables)
// ============================================
import { usePage } from '@inertiajs/react';

export interface ContactInfo {
    schoolName: string;
    schoolShortName: string;
    schoolSubtitle: string;
    addressCity: string;
    addressProvince: string;
    addressCountry: string;
    phone: string;
    email: string;
    emailSupport: string;
    facebookUrl: string;
    websiteUrl: string;
    officeHours: string;
    copyrightYear: string;
    systemName: string;
}

/**
 * Get contact information from Inertia shared props
 * This data comes from environment variables set in Railway
 */
export const useContactInfo = (): ContactInfo => {
    const { contactInfo } = usePage().props as { contactInfo: ContactInfo };
    return contactInfo;
};

/**
 * Get contact information as a static object (for use outside React components)
 * Falls back to defaults if not available
 */
export const getContactInfo = (): ContactInfo => {
    try {
        const pageProps = (window as any).__INERTIA_PROPS__;
        if (pageProps?.contactInfo) {
            return pageProps.contactInfo;
        }
    } catch (e) {
        // Fallback if Inertia props not available
    }
    
    // Default fallback values
    return {
        schoolName: 'Southern Mindoro Maritime School, Inc.',
        schoolShortName: 'Southern Mindoro',
        schoolSubtitle: 'Maritime School, Inc.',
        addressCity: 'Bagumbayan, Roxas',
        addressProvince: 'Oriental Mindoro',
        addressCountry: 'Philippines',
        phone: '+63 XXX XXX XXXX',
        email: 'info@smms.edu.ph',
        emailSupport: 'support@smms.edu.ph',
        facebookUrl: 'https://www.facebook.com/smmsi.shs',
        websiteUrl: 'https://smmsblockchain.up.railway.app/',
        officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
        copyrightYear: new Date().getFullYear().toString(),
        systemName: 'Blockchain Grading System',
    };
};

