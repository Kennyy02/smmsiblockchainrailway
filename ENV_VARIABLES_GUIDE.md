# Environment Variables Configuration Guide

This guide explains all the environment variables that can be configured for the Blockchain Grading System. These variables are used throughout the application for contact information, school details, and system configuration.

## Setting Variables in Railway

1. Go to your Railway project dashboard
2. Select your service
3. Click on the "Variables" tab
4. Add each variable with its value
5. Railway will automatically redeploy with the new values

## Contact Information Variables

### School Information
```env
SCHOOL_NAME="Southern Mindoro Maritime School, Inc."
SCHOOL_SHORT_NAME="Southern Mindoro"
SCHOOL_SUBTITLE="Maritime School, Inc."
```

### Address Information
```env
SCHOOL_ADDRESS_CITY="Bagumbayan, Roxas"
SCHOOL_ADDRESS_PROVINCE="Oriental Mindoro"
SCHOOL_ADDRESS_COUNTRY="Philippines"
```

### Contact Details
```env
SCHOOL_PHONE="+63 XXX XXX XXXX"
SCHOOL_EMAIL="info@smms.edu.ph"
SCHOOL_EMAIL_SUPPORT="support@smms.edu.ph"
```

### Social Media & Website
```env
SCHOOL_FACEBOOK_URL="https://www.facebook.com/smmsi.shs"
SCHOOL_WEBSITE_URL="https://smmsblockchain.up.railway.app/"
```

### Office Hours
```env
SCHOOL_OFFICE_HOURS="Monday - Friday, 8:00 AM - 5:00 PM"
```

### System Information
```env
SYSTEM_NAME="Blockchain Grading System"
SCHOOL_COPYRIGHT_YEAR="2025"
```

## Default Values

If any variable is not set, the system will use these default values:
- **SCHOOL_NAME**: "Southern Mindoro Maritime School, Inc."
- **SCHOOL_SHORT_NAME**: "Southern Mindoro"
- **SCHOOL_SUBTITLE**: "Maritime School, Inc."
- **SCHOOL_ADDRESS_CITY**: "Bagumbayan, Roxas"
- **SCHOOL_ADDRESS_PROVINCE**: "Oriental Mindoro"
- **SCHOOL_ADDRESS_COUNTRY**: "Philippines"
- **SCHOOL_PHONE**: "+63 XXX XXX XXXX"
- **SCHOOL_EMAIL**: "info@smms.edu.ph"
- **SCHOOL_EMAIL_SUPPORT**: "support@smms.edu.ph"
- **SCHOOL_FACEBOOK_URL**: "https://www.facebook.com/smmsi.shs"
- **SCHOOL_WEBSITE_URL**: "https://smmsblockchain.up.railway.app/"
- **SCHOOL_OFFICE_HOURS**: "Monday - Friday, 8:00 AM - 5:00 PM"
- **SYSTEM_NAME**: "Blockchain Grading System"
- **SCHOOL_COPYRIGHT_YEAR**: Current year (automatically set)

## Where These Variables Are Used

- **Footer Component**: All contact information, social media links, and copyright
- **Contact Section**: Address, phone, email, office hours, and social links
- **Privacy Policy Page**: School name and contact information
- **Terms of Service Page**: School name and contact information
- **Support Center Page**: Contact information and office hours
- **User Guide Page**: System name and support contact

## Quick Setup for New Client

1. Update all `SCHOOL_*` variables with the client's information
2. Update `SYSTEM_NAME` if they have a custom system name
3. Update `SCHOOL_COPYRIGHT_YEAR` to the current year
4. Update social media URLs if different
5. Deploy and verify all information appears correctly

## Notes

- All variables are optional - defaults will be used if not set
- Changes take effect after Railway redeploys (automatic)
- No code changes needed - just update environment variables
- All contact information is centralized in one place

