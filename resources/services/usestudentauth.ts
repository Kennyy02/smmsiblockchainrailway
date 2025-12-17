// ========================================================================
// 👨‍🎓 STUDENT AUTHENTICATION HOOK (FIXED)
// Reusable hook to get current authenticated student information
// NOW PROPERLY FETCHES STUDENT ID FROM STUDENTS TABLE
// ========================================================================

import { usePage } from '@inertiajs/react';

/**
 * Interface for the authenticated user structure from Laravel backend
 */
interface AuthUser {
    id: number;
    role: string;
    name?: string;
    email?: string;
    // Student profile data included by backend
    student?: {
        id: number;
        student_id: string;
        first_name: string;
        middle_name?: string;
        last_name: string;
        full_name: string;
        program?: string;
        year_level?: number;
    };
    // Generic profile (can be teacher/student/parent)
    profile?: {
        type: string;
        id: number;
        [key: string]: any;
    };
}

/**
 * Interface for Inertia.js page props
 */
interface AuthProps {
    auth: {
        user: AuthUser | null;
    };
}

/**
 * Custom hook to get the current authenticated student's information
 * 
 * @returns {Object} Object containing student authentication details
 * @returns {number | null} currentStudentId - The ID from students table (NOT users table)
 * @returns {AuthUser | null} user - The full user object
 * @returns {boolean} isStudent - Whether the current user is a student
 * @returns {object | null} studentProfile - The student profile data
 * 
 * @example
 * const { currentStudentId, isStudent, user, studentProfile } = useStudentAuth();
 * 
 * if (!isStudent) {
 *   return <div>Access denied. Students only.</div>;
 * }
 * 
 * // Use currentStudentId in API calls (this is students.id, NOT users.id)
 * const grades = await studentService.getGrades({ student_id: currentStudentId });
 */
export const useStudentAuth = () => {
    const { auth } = usePage().props as AuthProps;
    
    const user = auth?.user || null;
    const isStudent = user?.role === 'student';
    
    // ✅ FIX: Get student ID from student profile, NOT user ID
    // Try both 'student' and 'profile' keys for backwards compatibility
    const studentProfile = user?.student || (user?.profile?.type === 'student' ? user.profile : null);
    const currentStudentId = isStudent && studentProfile ? studentProfile.id : null;
    
    return {
        currentStudentId,      // This is students.id (correct)
        userId: user?.id || null,  // This is users.id (for reference)
        user,
        isStudent,
        studentProfile,
    };
};

/**
 * Alternative: Get student ID directly (simpler version)
 * 
 * @returns {number | null} The current student's ID from students table
 */
export const useCurrentStudentId = (): number | null => {
    const { currentStudentId } = useStudentAuth();
    return currentStudentId;
};

/**
 * Hook with error handling for routes that require student authentication
 * Throws an error if the user is not a student
 * 
 * @throws {Error} If user is not authenticated as a student
 * @returns {number} The current student's ID from students table
 */
export const useRequireStudent = (): number => {
    const { currentStudentId, isStudent } = useStudentAuth();
    
    // Check for both the role and a valid ID
    if (!isStudent || currentStudentId === null) {
        throw new Error('This page requires student authentication');
    }
    
    return currentStudentId;
};