// ========================================================================
// 📚 STUDENT GRADE SERVICE - Extends AdminGradeService for student use
// ========================================================================

import { 
    adminGradeService,
    Grade,
    GradeFilters,
    GradeStats,
    ApiResponse,
    GradesResponse,
    AcademicYearOption,
    SemesterOption,
    PaginationData
} from './AdminGradeService';

// ========================================================================
// 📦 STUDENT-SPECIFIC INTERFACES
// ========================================================================

export interface StudentGradeFilters extends Omit<GradeFilters, 'teacher_id'> {
    student_id: number; // Required for student context
}

export interface StudentGradeStats {
    total_subjects: number;
    average_rating: number;
    passed_count: number;
    failed_count: number;
    incomplete_count: number;
    pending_count: number;
    gwa: number;
    highest_grade: number | null;
    lowest_grade: number | null;
}

// ========================================================================
// 🔧 STUDENT GRADE SERVICE
// ========================================================================

class StudentGradeService {
    /**
     * Get all grades for a specific student
     */
    async getMyGrades(filters: StudentGradeFilters): Promise<GradesResponse> {
        const params: GradeFilters = {
            student_id: filters.student_id,
            search: filters.search,
            class_subject_id: filters.class_subject_id,
            academic_year_id: filters.academic_year_id,
            semester_id: filters.semester_id,
            remarks: filters.remarks,
            page: filters.page,
            per_page: filters.per_page,
        };

        return adminGradeService.getGrades(params);
    }

    /**
     * Get a single grade by ID (student-specific)
     */
    async getGrade(id: number, studentId: number): Promise<ApiResponse<Grade>> {
        const response = await adminGradeService.getGrade(id);
        
        // Verify the grade belongs to the student
        if (response.success && response.data.student_id !== studentId) {
            throw new Error('Access denied. This grade does not belong to you.');
        }
        
        return response;
    }

    /**
     * Get all grades for a student (alternative method)
     */
    async getGradesByStudent(studentId: number): Promise<ApiResponse<Grade[]>> {
        return adminGradeService.getGradesByStudent(studentId);
    }

    /**
     * Get grade statistics for a specific student
     * Note: This uses the backend stats endpoint but filters by student_id
     */
    async getMyStats(studentId: number): Promise<ApiResponse<StudentGradeStats>> {
        try {
            // Fetch all grades for the student to calculate stats
            const gradesResponse = await this.getGradesByStudent(studentId);
            
            if (!gradesResponse.success || !gradesResponse.data) {
                throw new Error('Failed to fetch grades for statistics');
            }

            const grades = gradesResponse.data;
            const totalSubjects = grades.length;
            
            // Calculate stats
            const passedCount = grades.filter(g => g.remarks === 'Passed').length;
            const failedCount = grades.filter(g => g.remarks === 'Failed').length;
            const incompleteCount = grades.filter(g => g.remarks === 'Incomplete').length;
            const pendingCount = grades.filter(g => !g.remarks).length;

            // Calculate average rating (only grades with final_rating)
            const gradesWithRating = grades.filter(g => g.final_rating !== null);
            const averageRating = gradesWithRating.length > 0
                ? gradesWithRating.reduce((sum, g) => sum + (g.final_rating || 0), 0) / gradesWithRating.length
                : 0;

            // Calculate GWA (General Weighted Average)
            // GWA Formula: 1.0 (highest) to 5.0 (lowest)
            let gwa = 0;
            if (gradesWithRating.length > 0) {
                let sumGwa = 0;
                gradesWithRating.forEach(grade => {
                    const rating = grade.final_rating || 0;
                    if (rating >= 60) {
                        const gradeGwa = 5 - ((rating - 60) / 10);
                        sumGwa += Math.max(1.0, Math.min(5.0, gradeGwa));
                    } else {
                        sumGwa += 5.0; // Failed grade = 5.0 GWA
                    }
                });
                gwa = sumGwa / gradesWithRating.length;
            }

            const highestGrade = gradesWithRating.length > 0
                ? Math.max(...gradesWithRating.map(g => g.final_rating || 0))
                : null;

            const lowestGrade = gradesWithRating.length > 0
                ? Math.min(...gradesWithRating.map(g => g.final_rating || 0))
                : null;

            return {
                success: true,
                data: {
                    total_subjects: totalSubjects,
                    average_rating: parseFloat(averageRating.toFixed(2)),
                    passed_count: passedCount,
                    failed_count: failedCount,
                    incomplete_count: incompleteCount,
                    pending_count: pendingCount,
                    gwa: parseFloat(gwa.toFixed(2)),
                    highest_grade: highestGrade,
                    lowest_grade: lowestGrade,
                }
            };
        } catch (error: any) {
            console.error('Failed to calculate student stats:', error);
            throw error;
        }
    }

    /**
     * Get academic years for filtering
     */
    async getAcademicYears(): Promise<ApiResponse<AcademicYearOption[]>> {
        return adminGradeService.getAcademicYears();
    }

    /**
     * Get semesters for filtering
     */
    async getSemesters(): Promise<ApiResponse<SemesterOption[]>> {
        return adminGradeService.getSemesters();
    }

    /**
     * Get current academic year
     */
    async getCurrentAcademicYear(): Promise<ApiResponse<AcademicYearOption>> {
        return adminGradeService.getCurrentAcademicYear();
    }

    /**
     * Get current semester
     */
    async getCurrentSemester(): Promise<ApiResponse<SemesterOption>> {
        return adminGradeService.getCurrentSemester();
    }

    /**
     * Export grades to PDF (backend implementation required)
     */
    async exportToPDF(studentId: number, filters?: Partial<StudentGradeFilters>): Promise<Blob> {
        const searchParams = new URLSearchParams();
        searchParams.append('student_id', studentId.toString());
        
        if (filters?.academic_year_id) {
            searchParams.append('academic_year_id', filters.academic_year_id.toString());
        }
        if (filters?.semester_id) {
            searchParams.append('semester_id', filters.semester_id.toString());
        }

        const response = await fetch(`/grades/export/pdf?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error('Failed to export grades to PDF');
        }

        return response.blob();
    }
}

export const studentGradeService = new StudentGradeService();

// Re-export types from AdminGradeService for convenience
export type {
    Grade,
    GradeFilters,
    GradeStats,
    ApiResponse,
    GradesResponse,
    AcademicYearOption,
    SemesterOption,
    PaginationData,
    GradeRemarks,
    MinimalStudent,
    MinimalClassSubject
} from './AdminGradeService';