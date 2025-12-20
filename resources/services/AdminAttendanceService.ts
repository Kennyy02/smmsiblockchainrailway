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

    private getCsrfToken(): string {
        // Try multiple sources for CSRF token
        let csrfToken: string | null = null;
        
        // 1. Try meta tag first
        csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
        
        // 2. Try Inertia page props
        if (!csrfToken && typeof window !== 'undefined') {
            try {
                const inertiaData = (window as any).__INERTIA_DATA__;
                if (inertiaData?.page?.props?.csrf_token) {
                    csrfToken = inertiaData.page.props.csrf_token;
                } else if ((window as any).Inertia?.page?.props?.csrf_token) {
                    csrfToken = (window as any).Inertia.page.props.csrf_token;
                }
            } catch (e) {
                console.warn('Could not retrieve CSRF token from Inertia props:', e);
            }
        }
        
        // 3. Try Laravel's default token name
        if (!csrfToken) {
            const tokenInput = document.querySelector('input[name="_token"]') as HTMLInputElement;
            if (tokenInput) {
                csrfToken = tokenInput.value;
            }
        }
        
        if (!csrfToken) {
            console.error('CSRF token not found. Please refresh the page.');
            throw new Error('CSRF token not found. Please refresh the page.');
        }
        
        return csrfToken;
    }

    private async refreshCsrfToken(): Promise<string> {
        try {
            const response = await fetch(`${this.baseURL}/csrf-token`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch new CSRF token');
            }
            const data = await response.json();
            if (data.success && data.csrf_token) {
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', data.csrf_token);
                }
                return data.csrf_token;
            }
            throw new Error('Invalid CSRF token response');
        } catch (error) {
            console.error('Error refreshing CSRF token:', error);
            throw new Error('Failed to refresh session. Please refresh the page manually.');
        }
    }

    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<ApiResponse<T>> {
        let csrfToken = this.getCsrfToken();
        
        const makeRequest = async (token: string): Promise<Response> => {
            const defaultOptions: RequestInit = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                    ...options.headers,
                },
                credentials: 'same-origin',
            };

            return fetch(url, { ...defaultOptions, ...options });
        };

        try {
            let response = await makeRequest(csrfToken);
            const contentType = response.headers.get('content-type');
            let data: any;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || 'Unexpected response format from server');
            }

            // Handle CSRF token mismatch (419) - retry with fresh token
            if (response.status === 419 && retryOn419) {
                console.warn('CSRF token mismatch detected. Attempting to refresh token...');
                const freshToken = await this.refreshCsrfToken();
                
                if (freshToken) {
                    // Retry the request with the fresh token (only once)
                    response = await makeRequest(freshToken);
                    
                    if (response.headers.get('content-type')?.includes('application/json')) {
                        data = await response.json();
                    } else {
                        const text = await response.text();
                        throw new Error(text || 'Unexpected response format from server');
                    }
                } else {
                    console.error('CSRF token mismatch. Could not refresh token. Please refresh the page.');
                    throw new Error('Session expired. Please refresh the page and try again.');
                }
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