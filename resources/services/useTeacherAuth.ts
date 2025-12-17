// ========================================================================
// 🔐 TEACHER AUTHENTICATION HOOK
// Reusable hook to get current authenticated teacher information
// ========================================================================

import { usePage } from '@inertiajs/react';

/**
 * Interface for teacher data from Laravel backend
 */
interface TeacherData {
    id: number;
    teacher_id: string;
    first_name: string;
    last_name: string;
    advisory_class?: {
        id: number;
        class_code: string;
        class_name: string;
        program?: string;
    } | null;
    subjects?: Array<{
        id: number;
        subject_code: string;
        subject_name: string;
    }>;
}

/**
 * Interface for the authenticated user structure from Laravel backend
 */
interface AuthUser {
    id: number;
    role: string;
    name?: string;
    email?: string;
    teacher?: TeacherData | null;
    // Add other user properties as needed
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
 * Custom hook to get the current authenticated teacher's information
 * 
 * @returns {Object} Object containing teacher authentication details
 * @returns {number | null} currentTeacherId - The ID of the current teacher, or null if not a teacher
 * @returns {AuthUser | null} user - The full user object
 * @returns {TeacherData | null} teacher - The teacher data including advisory class
 * @returns {boolean} isTeacher - Whether the current user is a teacher
 * 
 * @example
 * const { currentTeacherId, isTeacher, user, teacher } = useTeacherAuth();
 * 
 * if (!isTeacher) {
 *   return <div>Access denied. Teachers only.</div>;
 * }
 * 
 * // Use currentTeacherId in API calls
 * const data = await someService.getData({ teacher_id: currentTeacherId });
 */
export const useTeacherAuth = () => {
    const { auth } = usePage().props as AuthProps;
    
    const user = auth?.user || null;
    const isTeacher = user?.role === 'teacher';
    const teacher = user?.teacher || null;
    // Use the actual teacher ID from the teacher relationship, not the user ID
    const currentTeacherId = isTeacher && teacher ? teacher.id : null;
    
    return {
        currentTeacherId,
        user,
        teacher,
        isTeacher,
    };
};

/**
 * Alternative: Get teacher ID directly (simpler version)
 * 
 * @returns {number | null} The current teacher's ID or null
 */
export const useCurrentTeacherId = (): number | null => {
    const { currentTeacherId } = useTeacherAuth();
    return currentTeacherId;
};

/**
 * Hook with error handling for routes that require teacher authentication
 * Throws an error if the user is not a teacher
 * 
 * @throws {Error} If user is not authenticated as a teacher
 * @returns {number} The current teacher's ID
 */
export const useRequireTeacher = (): number => {
    const { currentTeacherId, isTeacher } = useTeacherAuth();
    
    if (!isTeacher || currentTeacherId === null) {
        throw new Error('This page requires teacher authentication');
    }
    
    return currentTeacherId;
};