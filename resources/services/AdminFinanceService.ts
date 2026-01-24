// ========================================================================
// 💰 ADMIN FINANCE SERVICE
// ========================================================================

export interface FinanceFilters {
    search?: string;
    class_id?: number | string;
    program?: string;
    page?: number;
    per_page?: number;
}

export interface StudentFinanceRecord {
    id: number;
    student_id: string;
    full_name: string;
    email: string;
    balance: number;
    miscellaneous_fee: number;
    total_paid: number;
    program: string;
    class_id: number;
    subjects_enrolled: number;
}

export interface ClassFinanceStats {
    id: number;
    class_code: string;
    class_name: string;
    program: string;
    total_students: number;
    total_balance: number;
    average_balance: number;
    year_level: number;
}

export interface FinanceStats {
    total_revenue: number;
    pending_balance: number;
    total_miscellaneous_fees: number;
    total_students: number;
    average_balance_per_student: number;
    paid_accounts: number;
    pending_accounts: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface FinanceResponse {
    success: boolean;
    data: StudentFinanceRecord[];
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    class_info?: {
        class_code: string;
        class_name: string;
        program: string;
    };
}

export interface ClassesFinanceResponse {
    success: boolean;
    data: ClassFinanceStats[];
    stats?: FinanceStats;
}

// ========================================================================
// 🛠️ ADMIN FINANCE SERVICE CLASS
// ========================================================================

class AdminFinanceService {
    private baseURL = '/api';

    private getCsrfToken(): string {
        let csrfToken: string | null = null;
        csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
        
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

    private async request<T>(url: string, options: RequestInit = {}, retryOn419: boolean = true): Promise<ApiResponse<T>> {
        const defaultHeaders: HeadersInit = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.getCsrfToken(),
        };

        const config: RequestInit = {
            credentials: 'include',
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {}),
            },
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 419 && retryOn419) {
                console.warn('🔄 [AdminFinanceService] 419 Conflict - Refreshing CSRF token and retrying...');
                await this.refreshCsrfToken();
                return this.request<T>(url, options, false);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: ApiResponse<T> = await response.json();
            return data;
        } catch (error) {
            console.error('❌ [AdminFinanceService] Request failed:', error);
            throw error;
        }
    }

    private async refreshCsrfToken(): Promise<string> {
        try {
            const response = await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to refresh CSRF token');
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!token) throw new Error('CSRF token still not found after refresh');
            return token;
        } catch (error) {
            console.error('Error refreshing CSRF token:', error);
            throw error;
        }
    }

    // ========================================================================
    // 💰 FINANCE ENDPOINTS
    // ========================================================================

    /**
     * Get finance statistics
     */
    async getFinanceStats(): Promise<ApiResponse<FinanceStats>> {
        return this.request<FinanceStats>(`${this.baseURL}/finance/stats`);
    }

    /**
     * Get list of classes with financial data
     */
    async getClassesFinance(params: FinanceFilters = {}): Promise<ClassesFinanceResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<ClassFinanceStats[]>(`${this.baseURL}/finance/classes?${searchParams.toString()}`) as Promise<ClassesFinanceResponse>;
    }

    /**
     * Get students in a specific class with financial records
     */
    async getClassStudentsFinance(classId: number, params: FinanceFilters = {}): Promise<FinanceResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && key !== 'class_id') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<StudentFinanceRecord[]>(`${this.baseURL}/finance/classes/${classId}/students?${searchParams.toString()}`) as Promise<FinanceResponse>;
    }

    /**
     * Get all students with financial records
     */
    async getStudentsFinance(params: FinanceFilters = {}): Promise<FinanceResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });
        return this.request<StudentFinanceRecord[]>(`${this.baseURL}/finance/students?${searchParams.toString()}`) as Promise<FinanceResponse>;
    }

    /**
     * Get student financial details with enrolled subjects
     */
    async getStudentFinanceDetails(studentId: number): Promise<ApiResponse<{
        student: StudentFinanceRecord;
        subjects: Array<{
            id: number;
            subject_code: string;
            subject_name: string;
            price: number;
        }>;
    }>> {
        return this.request(`${this.baseURL}/finance/students/${studentId}/details`);
    }
}

export const adminFinanceService = new AdminFinanceService();

