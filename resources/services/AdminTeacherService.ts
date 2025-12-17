// ========================================================================
// 🔐 ADMIN TEACHER SERVICE - School Management System (REFINED)
// Contains Admin, Teacher, and Academic/Resource Management
// ========================================================================

// ========================================================================
// 📋 INTERFACE DEFINITIONS
// ========================================================================

export interface Teacher {
    id: number;
    user_id?: number;
    teacher_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone?: string;
    address?: string;
    department: string;
    full_name?: string;
    classes_count?: number;
    subjects_count?: number;
    student_count?: number;
    advisory_class_name?: string;
    advisory_class?: { id: number; class_code: string; class_name: string } | null;
    // Subjects assigned to this teacher
    subjects?: { id: number; subject_code: string; subject_name: string }[];
    created_at: string;
    updated_at: string;
}

export interface TeacherFormData {
    teacher_id: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone?: string;
    address?: string;
    department: string;
    password?: string;
    password_confirmation?: string;
}

export interface TeacherStats {
    total_teachers: number;
    by_department: { department: string; count: number }[];
}

export interface DashboardStats {
    students: {
        total: number;
        active: number;
        by_year_level: { year: number; count: number }[];
    };
    teachers: {
        total: number;
        active: number;
        by_department: { department: string; count: number }[];
    };
    classes: {
        total: number;
        current: number;
    };
    academic_years: {
        total: number;
        current: any;
    };
    semesters: {
        total: number;
        current: any;
    };
    subjects: {
        total: number;
        active: number;
    };
    certificates: {
        total: number;
        verified: number;
    };
    blockchain_transactions: {
        total: number;
        pending: number;
        confirmed: number;
        failed: number;
    };
}

export interface SystemHealth {
    database: {
        status: 'healthy' | 'warning' | 'error';
        response_time_ms: number;
    };
    storage: {
        used_gb: number;
        total_gb: number;
        percentage: number;
    };
    users_online: number;
    recent_errors: number;
}

export interface AcademicOverview {
    average_grade: number;
    pass_rate: number;
    attendance_rate: number;
    assignment_completion_rate: number;
    top_performing_classes: any[];
    struggling_students: any[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: any;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface TeachersResponse extends ApiResponse<Teacher[]> {
    pagination?: PaginationData;
}

// ========================================================================
// 🛠️ ADMIN TEACHER SERVICE CLASS
// ========================================================================

class AdminTeacherService {
    private baseURL = '';

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        const defaultOptions: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers,
            },
            credentials: 'same-origin',
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error('Unexpected response format from server');
            }

            if (!response.ok) {
                if (data.errors) {
                    const errorMessages = Object.entries(data.errors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('; ');
                    throw new Error(errorMessages || data.message || `Request failed with status ${response.status}`);
                }
                throw new Error(data.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('❌ REQUEST ERROR:', error);
            throw error;
        }
    }

    // ========================================================================
    // 📊 DASHBOARD & ANALYTICS
    // ========================================================================

    async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
        return this.request<DashboardStats>(`${this.baseURL}/analytics/overview`);
    }

    async getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
        return this.request<SystemHealth>(`${this.baseURL}/admin/system-health`);
    }

    async getAcademicOverview(): Promise<ApiResponse<AcademicOverview>> {
        return this.request<AcademicOverview>(`${this.baseURL}/analytics/student-performance`);
    }

    async getTeacherLoad(): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/analytics/teacher-load`);
    }

    async getRoomUtilization(): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/analytics/room-utilization`);
    }

    async getDepartmentStats(): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/analytics/departments`);
    }

    async getAttendanceSummary(): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/analytics/attendance-summary`);
    }

    // ========================================================================
    // 👥 USER MANAGEMENT
    // ========================================================================

    async getUsers(params: {
        page?: number;
        per_page?: number;
        search?: string;
        role?: string;
        status?: string;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    } = {}): Promise<ApiResponse<any>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<any>(`${this.baseURL}/users?${searchParams.toString()}`);
    }

    async createUser(userData: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/users`, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(id: number, userData: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/users/${id}`, {
            method: 'DELETE',
        });
    }

    // ========================================================================
    // 👨‍🏫 TEACHER MANAGEMENT (EXISTING)
    // ========================================================================

    async getTeachers(params: {
        page?: number;
        per_page?: number;
        search?: string;
        department?: string;
    } = {}): Promise<TeachersResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<Teacher[]>(`${this.baseURL}/teachers?${searchParams.toString()}`) as Promise<TeachersResponse>;
    }

    async getTeacher(id: number): Promise<ApiResponse<Teacher>> {
        return this.request<Teacher>(`${this.baseURL}/teachers/${id}`);
    }

    async createTeacher(teacherData: TeacherFormData): Promise<ApiResponse<Teacher>> {
        return this.request<Teacher>(`${this.baseURL}/teachers`, {
            method: 'POST',
            body: JSON.stringify(teacherData),
        });
    }

    async updateTeacher(id: number, teacherData: Partial<TeacherFormData>): Promise<ApiResponse<Teacher>> {
        return this.request<Teacher>(`${this.baseURL}/teachers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(teacherData),
        });
    }

    async deleteTeacher(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/teachers/${id}`, {
            method: 'DELETE',
        });
    }

    async getTeacherStats(): Promise<ApiResponse<TeacherStats>> {
        return this.request<TeacherStats>(`${this.baseURL}/teachers/stats`);
    }

    async getTeachersByDepartment(department: string): Promise<ApiResponse<Teacher[]>> {
        return this.request<Teacher[]>(`${this.baseURL}/teachers/department/${encodeURIComponent(department)}`);
    }

    async getTeacherSubjects(id: number): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/teachers/${id}/subjects`);
    }

    async getTeacherClasses(id: number): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/teachers/${id}/classes`);
    }

    async getTeacherSchedule(id: number): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/teachers/${id}/schedule`);
    }

    async getDepartments(): Promise<ApiResponse<string[]>> {
        return this.request<string[]>(`${this.baseURL}/teachers/departments`);
    }

    // ========================================================================
    // 🏫 ACADEMIC MANAGEMENT
    // ========================================================================

    async getCurrentAcademicYear(): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/academic-years/current`);
    }

    async getCurrentSemester(): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/semesters/current`);
    }

    async createAcademicYear(data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/academic-years`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createSemester(data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/semesters`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ========================================================================
    // 📚 SUBJECT MANAGEMENT
    // ========================================================================

    async getSubjects(params: any = {}): Promise<ApiResponse<any>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<any>(`${this.baseURL}/subjects?${searchParams.toString()}`);
    }

    async getSubjectStats(): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/subjects/stats`);
    }

    async getSubjectsNeedingAttention(): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/subjects/needing-attention`);
    }

    async createSubject(data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/subjects`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateSubject(id: number, data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteSubject(id: number, force: boolean = false): Promise<ApiResponse<null>> {
        const url = force ? `${this.baseURL}/subjects/${id}?force=true` : `${this.baseURL}/subjects/${id}`;
        return this.request<null>(url, { method: 'DELETE' });
    }

    // ========================================================================
    // 🚪 ROOM MANAGEMENT
    // ========================================================================

    async getRooms(params: any = {}): Promise<ApiResponse<any>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<any>(`${this.baseURL}/rooms?${searchParams.toString()}`);
    }

    async checkRoomAvailability(data: {
        start_time: string;
        end_time: string;
        required_capacity?: number;
    }): Promise<ApiResponse<any[]>> {
        return this.request<any[]>(`${this.baseURL}/rooms/check-availability`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async createRoom(data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/rooms`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateRoom(id: number, data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/rooms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteRoom(id: number, force: boolean = false): Promise<ApiResponse<null>> {
        const url = force ? `${this.baseURL}/rooms/${id}?force=true` : `${this.baseURL}/rooms/${id}`;
        return this.request<null>(url, { method: 'DELETE' });
    }

    // ========================================================================
    // 🔐 BLOCKCHAIN & CERTIFICATES
    // ========================================================================

    async getBlockchainStats(): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/blockchain-transactions/stats`);
    }

    async getBlockchainTransactions(params: any = {}): Promise<ApiResponse<any>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<any>(`${this.baseURL}/blockchain-transactions?${searchParams.toString()}`);
    }

    async confirmTransaction(id: number): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/blockchain-transactions/${id}/confirm`, {
            method: 'POST',
        });
    }

    async failTransaction(id: number): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/blockchain-transactions/${id}/fail`, {
            method: 'POST',
        });
    }

    async retryTransaction(id: number): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/blockchain-transactions/${id}/retry`, {
            method: 'POST',
        });
    }

    async getCertificates(params: any = {}): Promise<ApiResponse<any>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<any>(`${this.baseURL}/certificates?${searchParams.toString()}`);
    }

    async issueCertificate(data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/certificates`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ========================================================================
    // 📢 ANNOUNCEMENTS
    // ========================================================================

    async getAnnouncements(params: any = {}): Promise<ApiResponse<any>> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<any>(`${this.baseURL}/announcements?${searchParams.toString()}`);
    }

    async createAnnouncement(data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/announcements`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAnnouncement(id: number, data: any): Promise<ApiResponse<any>> {
        return this.request<any>(`${this.baseURL}/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/announcements/${id}`, {
            method: 'DELETE',
        });
    }

    // ========================================================================
    // 📊 REPORTS & EXPORTS
    // ========================================================================

    async exportStudents(format: 'csv' | 'pdf' | 'excel' = 'csv'): Promise<Blob> {
        const response = await fetch(`${this.baseURL}/reports/students/export?format=${format}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream',
            },
            credentials: 'same-origin',
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        return response.blob();
    }

    async exportGrades(params: any = {}): Promise<Blob> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        
        const response = await fetch(`${this.baseURL}/reports/grades/export?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream',
            },
            credentials: 'same-origin',
        });
        
        if (!response.ok) {
            throw new Error('Export failed');
        }
        
        return response.blob();
    }

    /**
     * Export teachers to CSV - Organized format with all information
     */
    exportTeachersToCSV(teachers: Teacher[], filename: string = 'teachers_report.csv'): void {
        // Define CSV headers - organized columns
        const headers = [
            'No.',
            'Teacher ID',
            'Last Name',
            'First Name',
            'Middle Name',
            'Email',
            'Phone',
            'Address',
            'Department',
            'Advisory Class',
            'Subjects Assigned',
            'Status'
        ];

        // Convert teachers to CSV rows with all info
        const rows = teachers.map((teacher, index) => [
            index + 1,
            teacher.teacher_id,
            teacher.last_name,
            teacher.first_name,
            teacher.middle_name || '',
            teacher.email,
            teacher.phone || '',
            teacher.address || '',
            teacher.department || '',
            teacher.advisory_class?.class_code || teacher.advisory_class_name || '',
            teacher.subjects_count || teacher.classes_count || 0,
            'Active'
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        // Add BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

export const adminTeacherService = new AdminTeacherService();