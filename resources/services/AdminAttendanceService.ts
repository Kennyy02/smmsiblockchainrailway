// ========================================================================
// 🔐 ADMIN ATTENDANCE SERVICE - School Management System
// Handles API calls for Attendance management
// ========================================================================

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

export interface MinimalStudent {
    id: number;
    student_id: string;
    full_name: string;
}

export interface MinimalClassSubject {
    id: number;
    class: { class_code: string; class_name: string };
    subject: { subject_code: string; subject_name: string };
    full_name: string;
    teacher_id?: number;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
    id: number;
    class_subject_id: number;
    student_id: number;
    attendance_date: string;
    status: AttendanceStatus;
    remarks?: string;
    student?: MinimalStudent;
    class_subject?: MinimalClassSubject;
    status_color?: string;
}

// Type aliases for component compatibility
export type Attendance = AttendanceRecord;

export interface AttendanceFormData {
    class_subject_id: number;
    student_id: number;
    attendance_date: string;
    status: AttendanceStatus;
}

export interface AttendanceStats {
    total_records: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number;
}

// Alternate naming for stats (component compatibility)
export interface AttendanceStatsAlt {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number;
}

export interface AttendanceRecordsResponse extends ApiResponse<AttendanceRecord[]> {
    pagination?: PaginationData;
}

// Type alias for component compatibility
export type AttendanceResponse = AttendanceRecordsResponse;

export interface AttendanceFilters {
    page?: number;
    per_page?: number;
    search?: string;
    class_subject_id?: number;
    student_id?: number;
    status?: AttendanceStatus | string;
    start_date?: string;
    end_date?: string;
}

class AdminAttendanceService {
    private baseURL = '/api';

    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        // Get CSRF token from meta tag (should be in <head>)
        let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Fallback: Try to get from Inertia page props if available
        if (!csrfToken && typeof window !== 'undefined') {
            try {
                // Access Inertia's internal page data
                const inertiaData = (window as any).__INERTIA_DATA__;
                if (inertiaData?.page?.props?.csrf_token) {
                    csrfToken = inertiaData.page.props.csrf_token;
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        if (!csrfToken) {
            console.error('❌ CSRF token not found. Please ensure the meta tag is present in the HTML head.');
        }
        
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
            let data: any;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Unexpected response format from server');
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

    // Main method for fetching attendance records
    async getAttendance(params: AttendanceFilters = {}): Promise<AttendanceRecordsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            // Only add non-empty, non-null, non-undefined values (but allow 0 as a valid value)
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        const url = `${this.baseURL}/attendance${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        console.log('📡 [AdminAttendanceService] Making request to:', url);
        return this.request<AttendanceRecord[]>(url) as Promise<AttendanceRecordsResponse>;
    }

    // Alias for backward compatibility
    async getAttendanceRecords(params: AttendanceFilters = {}): Promise<AttendanceRecordsResponse> {
        return this.getAttendance(params);
    }

    async getAttendanceRecord(id: number): Promise<ApiResponse<AttendanceRecord>> {
        return this.request<AttendanceRecord>(`${this.baseURL}/attendance/${id}`);
    }

    async getAttendanceStats(params?: {
        student_id?: number;
        class_subject_id?: number;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<AttendanceStats>> {
        const searchParams = new URLSearchParams();
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, value.toString());
                }
            });
        }
        
        const url = searchParams.toString() 
            ? `${this.baseURL}/attendance/stats?${searchParams.toString()}`
            : `${this.baseURL}/attendance/stats`;
            
        return this.request<AttendanceStats>(url);
    }

    async createAttendance(attendanceData: AttendanceFormData): Promise<ApiResponse<AttendanceRecord>> {
        console.log('🚀 createAttendance called with:', attendanceData);
        console.log('📋 Attendance data keys:', Object.keys(attendanceData));
        console.log('📅 attendance_date:', attendanceData.attendance_date);
        console.log('📤 JSON.stringify:', JSON.stringify(attendanceData));
        
        return this.request<AttendanceRecord>(`${this.baseURL}/attendance`, {
            method: 'POST',
            body: JSON.stringify(attendanceData),
        });
    }

    async updateAttendance(id: number, attendanceData: Partial<AttendanceFormData>): Promise<ApiResponse<AttendanceRecord>> {
        console.log('✏️ updateAttendance called with:', { id, attendanceData });
        console.log('📋 Update data keys:', Object.keys(attendanceData));
        console.log('📤 JSON.stringify:', JSON.stringify(attendanceData));
        
        return this.request<AttendanceRecord>(`${this.baseURL}/attendance/${id}`, {
            method: 'PUT',
            body: JSON.stringify(attendanceData),
        });
    }

    async deleteAttendance(id: number): Promise<ApiResponse<null>> {
        return this.request<null>(`${this.baseURL}/attendance/${id}`, {
            method: 'DELETE',
        });
    }
    
    async getClassSubjectsMinimal(studentId?: number): Promise<ApiResponse<MinimalClassSubject[]>> {
        const params = studentId ? `?student_id=${studentId}&minimal=true` : '?minimal=true';
        return this.request<MinimalClassSubject[]>(`${this.baseURL}/class-subjects${params}`);
    }

    async getStudentsMinimal(): Promise<ApiResponse<MinimalStudent[]>> {
        return this.request<MinimalStudent[]>(`${this.baseURL}/students?minimal=true`);
    }

    async getAllDropdownOptions(teacherId?: number, studentId?: number): Promise<{
        classSubjects: MinimalClassSubject[];
        students: MinimalStudent[];
    }> {
        try {
            const [classSubjectsRes, studentsRes] = await Promise.all([
                this.getClassSubjectsMinimal(studentId),
                this.getStudentsMinimal(),
            ]);

            return {
                classSubjects: classSubjectsRes.data || [],
                students: studentsRes.data || [],
            };
        } catch (error) {
            console.error('❌ ERROR FETCHING ATTENDANCE DROPDOWN OPTIONS:', error);
            throw error;
        }
    }
}

export const adminAttendanceService = new AdminAttendanceService();